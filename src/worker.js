let schemaReady = false;

const jsonHeaders = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: jsonHeaders
  });
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
  if (!env.DB) {
    return false;
  }

  if (schemaReady) {
    return true;
  }

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
    env.DB.prepare("CREATE INDEX IF NOT EXISTS idx_results_created_date ON results(created_date)")
  ]);

  schemaReady = true;
  return true;
}

function requireDb(env) {
  if (!env.DB) {
    return json({
      error: "Banco D1 ainda nao foi ligado.",
      code: "d1_missing_binding",
      detail: "Crie um banco D1 e adicione um binding no Worker com o nome DB."
    }, 500);
  }
  return null;
}

async function createParticipant(request, env) {
  const data = await readJson(request);
  const now = new Date().toISOString();
  const participant = {
    id: makeId("participant"),
    full_name: data.full_name || "",
    email: data.email || "",
    phone: data.phone || "",
    company: data.company || "",
    role: data.role || "",
    birth_date: data.birth_date || "",
    gender: data.gender || "",
    plan: data.plan || "basico",
    answers: "{}",
    current_index: 0,
    created_date: now,
    updated_date: now
  };

  await env.DB.prepare(`
    INSERT INTO participants (
      id, full_name, email, phone, company, role, birth_date, gender, plan,
      answers, current_index, created_date, updated_date
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    participant.id,
    participant.full_name,
    participant.email,
    participant.phone,
    participant.company,
    participant.role,
    participant.birth_date,
    participant.gender,
    participant.plan,
    participant.answers,
    participant.current_index,
    participant.created_date,
    participant.updated_date
  ).run();

  return json(participant, 201);
}

async function getParticipant(id, env) {
  const participant = await env.DB.prepare("SELECT * FROM participants WHERE id = ?").bind(id).first();
  if (!participant) {
    return json({ error: "Participante nao encontrado." }, 404);
  }
  return json(participant);
}

async function updateParticipant(id, request, env) {
  const data = await readJson(request);
  const current = await env.DB.prepare("SELECT * FROM participants WHERE id = ?").bind(id).first();
  if (!current) {
    return json({ error: "Participante nao encontrado." }, 404);
  }

  const updated = {
    ...current,
    answers: data.answers ?? current.answers,
    current_index: data.current_index ?? current.current_index,
    updated_date: new Date().toISOString()
  };

  await env.DB.prepare(`
    UPDATE participants
    SET answers = ?, current_index = ?, updated_date = ?
    WHERE id = ?
  `).bind(updated.answers, updated.current_index, updated.updated_date, id).run();

  return json(updated);
}

async function listParticipants(url, env) {
  const limit = Math.min(Number(url.searchParams.get("limit") || 500), 1000);
  const { results } = await env.DB.prepare(`
    SELECT * FROM participants
    ORDER BY created_date DESC
    LIMIT ?
  `).bind(limit).all();
  return json(results || []);
}

async function createResult(request, env) {
  const data = await readJson(request);
  const now = new Date().toISOString();
  const result = {
    id: makeId("result"),
    participant_id: data.participant_id || "",
    participant_name: data.participant_name || "",
    participant_email: data.participant_email || "",
    participant_company: data.participant_company || "",
    participant_role: data.participant_role || "",
    participant_birth_date: data.participant_birth_date || "",
    plan: data.plan || "basico",
    answers: data.answers || "{}",
    scores: data.scores || "{}",
    dominant_type: data.dominant_type || null,
    dominant_type_name: data.dominant_type_name || "",
    wing: data.wing == null ? "" : String(data.wing),
    wing_name: data.wing_name || "",
    confidence_level: data.confidence_level || 0,
    duration_seconds: data.duration_seconds || 0,
    completed: data.completed ? 1 : 0,
    created_date: now,
    updated_date: now
  };

  await env.DB.prepare(`
    INSERT INTO results (
      id, participant_id, participant_name, participant_email, participant_company,
      participant_role, participant_birth_date, plan, answers, scores, dominant_type,
      dominant_type_name, wing, wing_name, confidence_level, duration_seconds,
      completed, created_date, updated_date
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    result.id,
    result.participant_id,
    result.participant_name,
    result.participant_email,
    result.participant_company,
    result.participant_role,
    result.participant_birth_date,
    result.plan,
    result.answers,
    result.scores,
    result.dominant_type,
    result.dominant_type_name,
    result.wing,
    result.wing_name,
    result.confidence_level,
    result.duration_seconds,
    result.completed,
    result.created_date,
    result.updated_date
  ).run();

  return json({ ...result, completed: Boolean(result.completed) }, 201);
}

async function getResult(id, env) {
  const result = await env.DB.prepare("SELECT * FROM results WHERE id = ?").bind(id).first();
  if (!result) {
    return json({ error: "Resultado nao encontrado." }, 404);
  }
  return json({ ...result, completed: Boolean(result.completed) });
}

async function listResults(url, env) {
  const participantId = url.searchParams.get("participant_id");
  const limit = Math.min(Number(url.searchParams.get("limit") || 500), 1000);
  let statement;

  if (participantId) {
    statement = env.DB.prepare(`
      SELECT * FROM results
      WHERE participant_id = ?
      ORDER BY created_date DESC
      LIMIT ?
    `).bind(participantId, limit);
  } else {
    statement = env.DB.prepare(`
      SELECT * FROM results
      ORDER BY created_date DESC
      LIMIT ?
    `).bind(limit);
  }

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

  if (pathname === "/api/health") {
    return json({ ok: true, database: "D1" });
  }

  if (pathname === "/api/participants" && method === "POST") {
    return createParticipant(request, env);
  }

  if (pathname === "/api/participants" && method === "GET") {
    return listParticipants(url, env);
  }

  const participantMatch = pathname.match(/^\/api\/participants\/([^/]+)$/);
  if (participantMatch && method === "GET") {
    return getParticipant(participantMatch[1], env);
  }
  if (participantMatch && method === "PATCH") {
    return updateParticipant(participantMatch[1], request, env);
  }

  if (pathname === "/api/results" && method === "POST") {
    return createResult(request, env);
  }

  if (pathname === "/api/results" && method === "GET") {
    return listResults(url, env);
  }

  const resultMatch = pathname.match(/^\/api\/results\/([^/]+)$/);
  if (resultMatch && method === "GET") {
    return getResult(resultMatch[1], env);
  }

  return json({ error: "Rota nao encontrada." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/api/")) {
        return handleApi(request, env);
      }

      return env.ASSETS.fetch(request);
    } catch (error) {
      return json({
        error: "Erro interno.",
        detail: error.message
      }, 500);
    }
  }
};
