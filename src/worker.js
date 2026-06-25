let schemaReady = false;

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: jsonHeaders });
}

function makeId(prefix) {
  return `${prefix}_${crypto.randomUUID()}`;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

async function ensureSchema(env) {
  if (!env.DB) return false;
  if (schemaReady) return true;

  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS participants (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        role TEXT,
        birth_date TEXT,
        gender TEXT,
        plan TEXT DEFAULT 'basico',
        answers TEXT DEFAULT '{}',
        current_index INTEGER DEFAULT 0,
        created_date TEXT NOT NULL,
        updated_date TEXT NOT NULL
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS results (
        id TEXT PRIMARY KEY,
        participant_id TEXT NOT NULL,
        participant_name TEXT,
        participant_email TEXT,
        participant_company TEXT,
        participant_role TEXT,
        participant_birth_date TEXT,
        plan TEXT DEFAULT 'basico',
        answers TEXT NOT NULL,
        scores TEXT NOT NULL,
        dominant_type INTEGER,
        dominant_type_name TEXT,
        wing TEXT,
        wing_name TEXT,
        confidence_level REAL,
        duration_seconds INTEGER,
        completed INTEGER DEFAULT 1,
        created_date TEXT NOT NULL,
        updated_date TEXT NOT NULL
      )
    `),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_results_participant_id ON results(participant_id)"),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_results_created_date ON results(created_date)"),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id TEXT PRIMARY KEY,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role TEXT NOT NULL DEFAULT 'master',
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_date TEXT NOT NULL,
        updated_date TEXT NOT NULL
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS admin_sessions (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        created_date TEXT NOT NULL
      )
    `),
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(token_hash)")
  ]);

  schemaReady = true;
  return true;
}

function getCookie(request, name) {
  const cookie = request.headers.get("cookie") || "";
  const part = cookie.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  return part ? decodeURIComponent(part.slice(name.length + 1)) : "";
}

function sessionCookie(token, maxAge = 60 * 60 * 24 * 7) {
  return [
    `ennea_admin_session=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${maxAge}`
  ].join("; ");
}

async function sha256Hex(value) {
  const data = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function passwordHash(password, salt) {
  return sha256Hex(`${salt}:${password}`);
}

async function createAdminSession(env, adminUser) {
  const token = `${crypto.randomUUID()}-${crypto.randomUUID()}`;
  const tokenHash = await sha256Hex(token);
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7).toISOString();

  await env.DB.prepare(`
    INSERT INTO admin_sessions (id, admin_user_id, token_hash, expires_at, created_date)
    VALUES (?, ?, ?, ?, ?)
  `).bind(makeId("session"), adminUser.id, tokenHash, expires, now.toISOString()).run();

  return token;
}

function publicAdmin(adminUser) {
  if (!adminUser) return null;
  return { id: adminUser.id, full_name: adminUser.full_name, email: adminUser.email, role: adminUser.role };
}

async function getAdminFromRequest(request, env) {
  const token = getCookie(request, "ennea_admin_session");
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  return await env.DB.prepare(`
    SELECT admin_users.*
    FROM admin_sessions
    JOIN admin_users ON admin_users.id = admin_sessions.admin_user_id
    WHERE admin_sessions.token_hash = ? AND admin_sessions.expires_at > ?
    LIMIT 1
  `).bind(tokenHash, new Date().toISOString()).first();
}

async function setupStatus(env) {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM admin_users").first();
  return json({ needs_setup: Number(row?.count || 0) === 0 });
}

async function setupAdmin(request, env) {
  const countRow = await env.DB.prepare("SELECT COUNT(*) AS count FROM admin_users").first();
  if (Number(countRow?.count || 0) > 0) return json({ error: "O acesso master ja foi criado." }, 409);

  const data = await readJson(request);
  const email = String(data.email || "").trim().toLowerCase();
  const fullName = String(data.full_name || data.name || "Master").trim();
  const password = String(data.password || "");

  if (!email || !email.includes("@")) return json({ error: "Informe um e-mail valido." }, 400);
  if (password.length < 6) return json({ error: "A senha precisa ter pelo menos 6 caracteres." }, 400);

  const now = new Date().toISOString();
  const salt = crypto.randomUUID();
  const adminUser = {
    id: makeId("admin"), full_name: fullName, email, role: "master",
    password_salt: salt, password_hash: await passwordHash(password, salt), created_date: now, updated_date: now
  };

  await env.DB.prepare(`
    INSERT INTO admin_users (id, full_name, email, role, password_salt, password_hash, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(adminUser.id, adminUser.full_name, adminUser.email, adminUser.role, adminUser.password_salt, adminUser.password_hash, adminUser.created_date, adminUser.updated_date).run();

  const token = await createAdminSession(env, adminUser);
  return new Response(JSON.stringify({ user: publicAdmin(adminUser) }), { status: 201, headers: { ...jsonHeaders, "set-cookie": sessionCookie(token) } });
}

async function loginAdmin(request, env) {
  const data = await readJson(request);
  const email = String(data.email || "").trim().toLowerCase();
  const password = String(data.password || "");
  const adminUser = await env.DB.prepare("SELECT * FROM admin_users WHERE email = ? LIMIT 1").bind(email).first();
  if (!adminUser) return json({ error: "E-mail ou senha invalidos." }, 401);
  const hash = await passwordHash(password, adminUser.password_salt);
  if (hash !== adminUser.password_hash) return json({ error: "E-mail ou senha invalidos." }, 401);
  const token = await createAdminSession(env, adminUser);
  return new Response(JSON.stringify({ user: publicAdmin(adminUser) }), { status: 200, headers: { ...jsonHeaders, "set-cookie": sessionCookie(token) } });
}

async function currentAdmin(request, env) {
  const adminUser = await getAdminFromRequest(request, env);
  if (!adminUser) return json({ user: null, isAuthenticated: false }, 401);
  return json({ user: publicAdmin(adminUser), isAuthenticated: true });
}

async function logoutAdmin(request, env) {
  const token = getCookie(request, "ennea_admin_session");
  if (token) {
    const tokenHash = await sha256Hex(token);
    await env.DB.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").bind(tokenHash).run();
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...jsonHeaders, "set-cookie": sessionCookie("", 0) } });
}

function requireDb(env) {
  if (!env.DB) return json({ error: "Banco D1 ainda nao foi ligado.", code: "d1_missing_binding", detail: "Crie um banco D1 e adicione um binding no Worker com o nome DB." }, 500);
  return null;
}

async function createParticipant(request, env) {
  const data = await readJson(request);
  const now = new Date().toISOString();
  const participant = {
    id: makeId("participant"), full_name: data.full_name || "", email: data.email || "", phone: data.phone || "",
    company: data.company || "", role: data.role || "", birth_date: data.birth_date || "", gender: data.gender || "",
    plan: data.plan || "basico", answers: "{}", current_index: 0, created_date: now, updated_date: now
  };
  await env.DB.prepare(`
    INSERT INTO participants (id, full_name, email, phone, company, role, birth_date, gender, plan, answers, current_index, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(participant.id, participant.full_name, participant.email, participant.phone, participant.company, participant.role, participant.birth_date, participant.gender, participant.plan, participant.answers, participant.current_index, participant.created_date, participant.updated_date).run();
  return json(participant, 201);
}

async function getParticipant(id, env) {
  const participant = await env.DB.prepare("SELECT * FROM participants WHERE id = ?").bind(id).first();
  if (!participant) return json({ error: "Participante nao encontrado." }, 404);
  return json(participant);
}

async function updateParticipant(id, request, env) {
  const data = await readJson(request);
  const current = await env.DB.prepare("SELECT * FROM participants WHERE id = ?").bind(id).first();
  if (!current) return json({ error: "Participante nao encontrado." }, 404);
  const updated = {
    ...current,
    full_name: data.full_name ?? current.full_name,
    email: data.email ?? current.email,
    phone: data.phone ?? current.phone,
    company: data.company ?? current.company,
    role: data.role ?? current.role,
    birth_date: data.birth_date ?? current.birth_date,
    gender: data.gender ?? current.gender,
    plan: data.plan ?? current.plan,
    answers: data.answers ?? current.answers,
    current_index: data.current_index ?? current.current_index,
    updated_date: new Date().toISOString()
  };
  await env.DB.prepare(`
    UPDATE participants
    SET full_name = ?, email = ?, phone = ?, company = ?, role = ?, birth_date = ?, gender = ?, plan = ?, answers = ?, current_index = ?, updated_date = ?
    WHERE id = ?
  `).bind(updated.full_name, updated.email, updated.phone, updated.company, updated.role, updated.birth_date, updated.gender, updated.plan, updated.answers, updated.current_index, updated.updated_date, id).run();
  if (Object.prototype.hasOwnProperty.call(data, "company")) {
    await env.DB.prepare("UPDATE results SET participant_company = ?, updated_date = ? WHERE participant_id = ? OR lower(participant_email) = lower(?)")
      .bind(updated.company, updated.updated_date, id, updated.email || current.email || "").run();
  }
  return json(updated);
}

async function deleteParticipant(id, env) {
  const current = await env.DB.prepare("SELECT * FROM participants WHERE id = ?").bind(id).first();
  if (!current) return json({ error: "Participante nao encontrado." }, 404);
  await env.DB.prepare("DELETE FROM results WHERE participant_id = ? OR lower(participant_email) = lower(?)").bind(id, current.email || "").run();
  await env.DB.prepare("DELETE FROM participants WHERE id = ?").bind(id).run();
  return json({ ok: true, deleted: "participant", id });
}

async function listParticipants(url, env) {
  const limit = Math.min(Number(url.searchParams.get("limit") || 500), 1000);
  const { results } = await env.DB.prepare("SELECT * FROM participants ORDER BY created_date DESC LIMIT ?").bind(limit).all();
  return json(results || []);
}

async function createResult(request, env) {
  const data = await readJson(request);
  const now = new Date().toISOString();
  const result = {
    id: makeId("result"), participant_id: data.participant_id || "", participant_name: data.participant_name || "",
    participant_email: data.participant_email || "", participant_company: data.participant_company || "", participant_role: data.participant_role || "",
    participant_birth_date: data.participant_birth_date || "", plan: data.plan || "basico", answers: data.answers || "{}",
    scores: data.scores || "{}", dominant_type: data.dominant_type || null, dominant_type_name: data.dominant_type_name || "",
    wing: data.wing == null ? "" : String(data.wing), wing_name: data.wing_name || "", confidence_level: data.confidence_level || 0,
    duration_seconds: data.duration_seconds || 0, completed: data.completed ? 1 : 0, created_date: now, updated_date: now
  };
  await env.DB.prepare(`
    INSERT INTO results (id, participant_id, participant_name, participant_email, participant_company, participant_role, participant_birth_date, plan, answers, scores, dominant_type, dominant_type_name, wing, wing_name, confidence_level, duration_seconds, completed, created_date, updated_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(result.id, result.participant_id, result.participant_name, result.participant_email, result.participant_company, result.participant_role, result.participant_birth_date, result.plan, result.answers, result.scores, result.dominant_type, result.dominant_type_name, result.wing, result.wing_name, result.confidence_level, result.duration_seconds, result.completed, result.created_date, result.updated_date).run();
  return json({ ...result, completed: Boolean(result.completed) }, 201);
}

async function getResult(id, env) {
  const result = await env.DB.prepare("SELECT * FROM results WHERE id = ?").bind(id).first();
  if (!result) return json({ error: "Resultado nao encontrado." }, 404);
  return json({ ...result, completed: Boolean(result.completed) });
}

async function updateResult(id, request, env) {
  const data = await readJson(request);
  const current = await env.DB.prepare("SELECT * FROM results WHERE id = ?").bind(id).first();
  if (!current) return json({ error: "Resultado nao encontrado." }, 404);
  const updated = {
    ...current,
    participant_name: data.participant_name ?? current.participant_name,
    participant_email: data.participant_email ?? current.participant_email,
    participant_company: data.participant_company ?? current.participant_company,
    participant_role: data.participant_role ?? current.participant_role,
    participant_birth_date: data.participant_birth_date ?? current.participant_birth_date,
    plan: data.plan ?? current.plan,
    updated_date: new Date().toISOString()
  };
  await env.DB.prepare(`
    UPDATE results
    SET participant_name = ?, participant_email = ?, participant_company = ?, participant_role = ?, participant_birth_date = ?, plan = ?, updated_date = ?
    WHERE id = ?
  `).bind(updated.participant_name, updated.participant_email, updated.participant_company, updated.participant_role, updated.participant_birth_date, updated.plan, updated.updated_date, id).run();
  if (Object.prototype.hasOwnProperty.call(data, "participant_company") && updated.participant_id) {
    await env.DB.prepare("UPDATE participants SET company = ?, updated_date = ? WHERE id = ?").bind(updated.participant_company, updated.updated_date, updated.participant_id).run();
  }
  return json({ ...updated, completed: Boolean(updated.completed) });
}

async function deleteResult(id, env) {
  const current = await env.DB.prepare("SELECT * FROM results WHERE id = ?").bind(id).first();
  if (!current) return json({ error: "Resultado nao encontrado." }, 404);
  await env.DB.prepare("DELETE FROM results WHERE id = ?").bind(id).run();
  if (current.participant_id) {
    await env.DB.prepare("DELETE FROM participants WHERE id = ?").bind(current.participant_id).run();
  }
  return json({ ok: true, deleted: "result", id, participant_id: current.participant_id || null });
}

async function listResults(url, env) {
  const participantId = url.searchParams.get("participant_id");
  const limit = Math.min(Number(url.searchParams.get("limit") || 500), 1000);
  const statement = participantId
    ? env.DB.prepare("SELECT * FROM results WHERE participant_id = ? ORDER BY created_date DESC LIMIT ?").bind(participantId, limit)
    : env.DB.prepare("SELECT * FROM results ORDER BY created_date DESC LIMIT ?").bind(limit);
  const { results } = await statement.all();
  return json((results || []).map((result) => ({ ...result, completed: Boolean(result.completed) })));
}

async function handleApi(request, env) {
  const dbError = requireDb(env);
  if (dbError) return dbError;
  await ensureSchema(env);
  const url = new URL(request.url);
  const { pathname } = url;
  const method = request.method.toUpperCase();

  if (pathname === "/api/health") return json({ ok: true, database: "D1" });
  if (pathname === "/api/admin/setup-status" && method === "GET") return setupStatus(env);
  if (pathname === "/api/admin/setup" && method === "POST") return setupAdmin(request, env);
  if (pathname === "/api/admin/login" && method === "POST") return loginAdmin(request, env);
  if (pathname === "/api/admin/me" && method === "GET") return currentAdmin(request, env);
  if (pathname === "/api/admin/logout" && method === "POST") return logoutAdmin(request, env);

  if (pathname === "/api/participants" && method === "POST") return createParticipant(request, env);
  if (pathname === "/api/participants" && method === "GET") return listParticipants(url, env);

  const participantMatch = pathname.match(/^\/api\/participants\/([^/]+)$/);
  if (participantMatch && method === "GET") return getParticipant(participantMatch[1], env);
  if (participantMatch && method === "PATCH") return updateParticipant(participantMatch[1], request, env);
  if (participantMatch && method === "DELETE") return deleteParticipant(participantMatch[1], env);

  if (pathname === "/api/results" && method === "POST") return createResult(request, env);
  if (pathname === "/api/results" && method === "GET") return listResults(url, env);

  const resultMatch = pathname.match(/^\/api\/results\/([^/]+)$/);
  if (resultMatch && method === "GET") return getResult(resultMatch[1], env);
  if (resultMatch && method === "PATCH") return updateResult(resultMatch[1], request, env);
  if (resultMatch && method === "DELETE") return deleteResult(resultMatch[1], env);

  return json({ error: "Rota nao encontrada." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return handleApi(request, env);
      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({ error: "Erro interno.", detail: error.message }, 500);
    }
  }
};
