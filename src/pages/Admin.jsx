import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileCheck2,
  Filter,
  Heart,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { QUESTIONS, calculateResults } from "@/lib/testEngine";
import { TYPE_COLORS, TYPE_NAMES } from "@/lib/enneagramData";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard RH", href: "/admin" },
  { icon: Users, label: "Mapeamento de Equipes", href: "/admin/team-mapping" },
  { icon: Heart, label: "Compatibilidade", href: "/admin/compatibility" },
  { icon: Target, label: "Plano de Desenvolvimento", href: "/admin/development-plan" },
  { icon: History, label: "Historico Comportamental", href: "/admin/behavioral-history" },
  { icon: Bot, label: "IA para Lideranca", href: "/admin/ai-leadership" },
  { icon: BarChart3, label: "Relatorios", href: "/admin/reports" },
  { icon: Settings, label: "Configuracoes", href: "/admin/settings" }
];

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function parseAnswers(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function answerCount(value) {
  return Object.keys(parseAnswers(value)).length;
}

function companyLabel(value) {
  const label = String(value || "").trim();
  return label || "Sem empresa";
}

function companyKey(value) {
  return normalizeText(companyLabel(value));
}

function sameEmail(a, b) {
  return normalizeText(a) && normalizeText(a) === normalizeText(b);
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString("pt-BR");
}

function confidenceLevel(value) {
  const score = Number(value) || 0;
  if (score < 40) return { label: "Baixa", className: "bg-red-500/15 text-red-300 border-red-500/25" };
  if (score < 65) return { label: "Moderada", className: "bg-amber-500/15 text-amber-300 border-amber-500/25" };
  return { label: "Alta", className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" };
}

function canGenerateResult(participant) {
  return answerCount(participant.answers) >= QUESTIONS.length;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [results, setResults] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [editCompanyTarget, setEditCompanyTarget] = useState(null);
  const [editCompanyValue, setEditCompanyValue] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [generatingId, setGeneratingId] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.TestResult.filter({ completed: true }, "-created_date", 1000),
      base44.entities.TestParticipant.filter({}, "-created_date", 1000)
    ])
      .then(([resultRows, participantRows]) => {
        setResults(Array.isArray(resultRows) ? resultRows : []);
        setParticipants(Array.isArray(participantRows) ? participantRows : []);
      })
      .catch((error) => setLoadError(error.message || "Nao foi possivel carregar os dados."))
      .finally(() => setLoading(false));
  }, []);

  const completedKeys = useMemo(() => {
    const keys = new Set();
    results.forEach((result) => {
      if (result.participant_id) keys.add(`id:${result.participant_id}`);
      if (result.participant_email) keys.add(`email:${String(result.participant_email).toLowerCase()}`);
    });
    return keys;
  }, [results]);

  const pendingParticipants = useMemo(() => {
    return participants.filter((participant) => {
      const hasResultById = participant.id && completedKeys.has(`id:${participant.id}`);
      const hasResultByEmail = participant.email && completedKeys.has(`email:${String(participant.email).toLowerCase()}`);
      return !hasResultById && !hasResultByEmail;
    });
  }, [participants, completedKeys]);

  const companyOptions = useMemo(() => {
    const map = new Map();
    [...results, ...participants].forEach((item) => {
      const raw = item.participant_company || item.company;
      const key = companyKey(raw);
      if (!map.has(key)) map.set(key, companyLabel(raw));
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [results, participants]);

  const filteredResults = useMemo(() => {
    const q = normalizeText(search);
    return results.filter((result) => {
      const haystack = normalizeText(`${result.participant_name} ${result.participant_email} ${result.participant_company} ${result.participant_role}`);
      if (q && !haystack.includes(q)) return false;
      if (filterCompany !== "all" && companyKey(result.participant_company) !== filterCompany) return false;
      if (filterType !== "all" && Number(result.dominant_type) !== Number(filterType)) return false;
      return true;
    });
  }, [results, search, filterCompany, filterType]);

  const filteredPending = useMemo(() => {
    const q = normalizeText(search);
    return pendingParticipants.filter((participant) => {
      const haystack = normalizeText(`${participant.full_name} ${participant.email} ${participant.company} ${participant.role} ${participant.phone}`);
      if (q && !haystack.includes(q)) return false;
      if (filterCompany !== "all" && companyKey(participant.company) !== filterCompany) return false;
      return true;
    });
  }, [pendingParticipants, search, filterCompany]);

  const avgConfidence = Math.round(
    filteredResults.reduce((total, result) => total + (Number(result.confidence_level) || 0), 0) / Math.max(filteredResults.length, 1)
  );

  const dominantType = useMemo(() => {
    const counts = {};
    filteredResults.forEach((result) => {
      const type = Number(result.dominant_type);
      if (type) counts[type] = (counts[type] || 0) + 1;
    });
    const [type] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
    return type ? Number(type) : null;
  }, [filteredResults]);

  const companyRows = useMemo(() => {
    const map = new Map();
    function ensure(raw) {
      const key = companyKey(raw);
      if (!map.has(key)) map.set(key, { key, company: companyLabel(raw), completed: 0, pending: 0, roles: new Set() });
      return map.get(key);
    }
    results.forEach((result) => {
      const row = ensure(result.participant_company);
      row.completed += 1;
      if (result.participant_role) row.roles.add(normalizeText(result.participant_role));
    });
    pendingParticipants.forEach((participant) => {
      const row = ensure(participant.company);
      row.pending += 1;
      if (participant.role) row.roles.add(normalizeText(participant.role));
    });
    return Array.from(map.values()).map((row) => ({ ...row, total: row.completed + row.pending, roleCount: row.roles.size }));
  }, [results, pendingParticipants]);

  async function saveCompanyEdit() {
    const target = editCompanyTarget;
    const newCompany = editCompanyValue.trim();
    if (!target || !newCompany) return;
    setSavingCompany(true);
    try {
      if (target.kind === "result") {
        await base44.entities.TestResult.update(target.id, { participant_company: newCompany });
        if (target.participant_id) await base44.entities.TestParticipant.update(target.participant_id, { company: newCompany }).catch(() => null);
      } else {
        await base44.entities.TestParticipant.update(target.id, { company: newCompany });
      }
      setResults((rows) => rows.map((result) => {
        const related = result.id === target.id || result.participant_id === target.participant_id || sameEmail(result.participant_email, target.email);
        return related ? { ...result, participant_company: newCompany } : result;
      }));
      setParticipants((rows) => rows.map((participant) => {
        const related = participant.id === target.id || participant.id === target.participant_id || sameEmail(participant.email, target.email);
        return related ? { ...participant, company: newCompany } : participant;
      }));
      setEditCompanyTarget(null);
      setEditCompanyValue("");
      setFilterCompany("all");
    } catch (error) {
      window.alert(error.message || "Nao foi possivel salvar a empresa.");
    } finally {
      setSavingCompany(false);
    }
  }

  async function deleteCandidate(target) {
    if (!window.confirm(`Excluir ${target.name || "este candidato"}? Esta acao remove cadastro e resultado vinculado.`)) return;
    setDeletingId(target.id);
    try {
      if (target.kind === "result") await base44.entities.TestResult.delete(target.id);
      else await base44.entities.TestParticipant.delete(target.id);
      setResults((rows) => rows.filter((result) => result.id !== target.id && result.participant_id !== target.participant_id && !sameEmail(result.participant_email, target.email)));
      setParticipants((rows) => rows.filter((participant) => participant.id !== target.id && participant.id !== target.participant_id && !sameEmail(participant.email, target.email)));
    } catch (error) {
      window.alert(error.message || "Nao foi possivel excluir.");
    } finally {
      setDeletingId("");
    }
  }

  async function generateResultForParticipant(participant) {
    const answers = parseAnswers(participant.answers);
    const answered = Object.keys(answers).length;
    if (answered < QUESTIONS.length) {
      window.alert(`Este candidato tem ${answered}/${QUESTIONS.length} respostas. So gere manualmente quando todas estiverem respondidas.`);
      return;
    }
    if (!window.confirm(`Gerar resultado manual para ${participant.full_name || "este candidato"}?`)) return;

    setGeneratingId(participant.id);
    try {
      const calculated = calculateResults(answers);
      const savedResult = await base44.entities.TestResult.create({
        participant_id: participant.id,
        participant_name: participant.full_name || "",
        participant_email: participant.email || "",
        participant_company: participant.company || "",
        participant_role: participant.role || "",
        participant_birth_date: participant.birth_date || "",
        plan: participant.plan || "basico",
        answers: JSON.stringify(answers),
        scores: JSON.stringify(calculated),
        dominant_type: calculated.dominantType,
        dominant_type_name: calculated.dominantTypeName,
        wing: calculated.wing,
        wing_name: calculated.wingName,
        confidence_level: calculated.confidence,
        duration_seconds: 0,
        completed: true
      });

      await base44.entities.TestParticipant.update(participant.id, { answers: "{}", current_index: 0 });
      setResults((rows) => [savedResult, ...rows]);
      setParticipants((rows) => rows.map((item) => item.id === participant.id ? { ...item, answers: "{}", current_index: 0 } : item));
      window.alert("Resultado gerado com sucesso.");
    } catch (error) {
      window.alert(error.message || "Nao foi possivel gerar o resultado.");
    } finally {
      setGeneratingId("");
    }
  }

  if (loading) return <div className="h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="p-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">EP</div>
            <span className="font-display text-base font-semibold text-foreground">Diagnostico de Lideranca</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} to={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${item.href === "/admin" ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 sm:px-6 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-muted-foreground hover:text-foreground"><Menu className="w-5 h-5" /></button>
          <div className="flex-1">
            <h1 className="font-display text-lg font-bold text-foreground">Dashboard de Analise</h1>
            <p className="text-xs text-muted-foreground">Resultados, pendencias e recuperacao manual de testes travados</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={async () => { await logout(); navigate("/admin/login"); }}><LogOut className="w-4 h-4" /> Sair</Button>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {loadError && <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">{loadError}</div>}

          <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail, empresa, funcao/cargo ou telefone..." className="bg-background" />
              </div>
              <select value={filterCompany} onChange={(event) => setFilterCompany(event.target.value)} className="h-10 rounded-lg bg-background border border-border px-3 text-sm text-foreground">
                <option value="all">Todas as empresas</option>
                {companyOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
              </select>
              <select value={filterType} onChange={(event) => setFilterType(event.target.value)} className="h-10 rounded-lg bg-background border border-border px-3 text-sm text-foreground">
                <option value="all">Todos os tipos</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((type) => <option key={type} value={type}>Tipo {type} - {TYPE_NAMES[type]}</option>)}
              </select>
              <Button variant="outline" className="gap-2" onClick={() => { setSearch(""); setFilterCompany("all"); setFilterType("all"); }}><Filter className="w-4 h-4" /> Limpar</Button>
            </div>
          </section>

          <section className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <MetricCard icon={Users} label="Candidatos" value={filteredResults.length + filteredPending.length} />
            <MetricCard icon={CheckCircle2} label="Concluidos" value={filteredResults.length} />
            <MetricCard icon={Clock} label="Pendentes" value={filteredPending.length} />
            <MetricCard icon={FileCheck2} label="Prontos p/ gerar" value={filteredPending.filter(canGenerateResult).length} />
            <MetricCard icon={TrendingUp} label="Clareza media" value={`${confidenceLevel(avgConfidence).label} ${avgConfidence}%`} />
            <MetricCard icon={Target} label="Tipo recorrente" value={dominantType ? `T${dominantType}` : "—"} />
          </section>

          <section className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="font-heading text-sm font-semibold text-foreground">Analise por empresa</h2>
              <p className="text-xs text-muted-foreground">Resumo por empresa, funcoes, concluidos e pendentes</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border"><Th>Empresa</Th><Th>Funcoes</Th><Th>Total</Th><Th>Concluidos</Th><Th>Pendentes</Th></tr></thead>
                <tbody>{companyRows.map((row) => <tr key={row.key} className="border-b border-border/50"><Td>{row.company}</Td><Td>{row.roleCount}</Td><Td>{row.total}</Td><Td>{row.completed}</Td><Td>{row.pending}</Td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between gap-3">
              <div><h2 className="font-heading text-sm font-semibold text-foreground">Resultados concluidos</h2><p className="text-xs text-muted-foreground">Candidatos que finalizaram o teste</p></div>
              <span className="text-xs text-muted-foreground">{filteredResults.length} encontrado(s)</span>
            </div>
            <ClarityLegend />
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border"><Th>Participante</Th><Th>Empresa</Th><Th>Funcao/Cargo</Th><Th>Tipo</Th><Th>Clareza</Th><Th>Data</Th><Th align="right">Acao</Th></tr></thead>
                <tbody>
                  {filteredResults.length === 0 ? <tr><td colSpan={7} className="text-center p-10 text-sm text-muted-foreground">Nenhum resultado concluido encontrado.</td></tr> : filteredResults.map((result) => (
                    <tr key={result.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                      <Td><p className="font-medium text-foreground">{result.participant_name || "Sem nome"}</p><p className="text-[11px] text-muted-foreground">{result.participant_email || "—"}</p></Td>
                      <Td><p>{result.participant_company || "—"}</p><button onClick={() => { setEditCompanyTarget({ kind: "result", id: result.id, participant_id: result.participant_id, email: result.participant_email, name: result.participant_name, company: result.participant_company }); setEditCompanyValue(result.participant_company || ""); }} className="text-[11px] text-primary hover:underline">Editar empresa</button></Td>
                      <Td>{result.participant_role || "—"}</Td>
                      <Td><TypeBadge type={result.dominant_type} /></Td>
                      <Td><ConfidenceBadge value={result.confidence_level} /></Td>
                      <Td>{formatDate(result.created_date)}</Td>
                      <Td align="right"><div className="flex justify-end gap-1"><Link to={`/results/${result.id}`}><Button variant="ghost" size="sm" className="h-8 gap-1 text-primary text-xs"><Eye className="w-3 h-3" /> Ver</Button></Link><Button variant="ghost" size="sm" disabled={deletingId === result.id} onClick={() => deleteCandidate({ kind: "result", id: result.id, participant_id: result.participant_id, email: result.participant_email, name: result.participant_name })} className="h-8 text-xs text-destructive"><Trash2 className="w-3 h-3" /> Excluir</Button></div></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between gap-3">
              <div><h2 className="font-heading text-sm font-semibold text-foreground">Candidatos cadastrados sem resultado</h2><p className="text-xs text-muted-foreground">Use Gerar resultado quando o teste travar no fim, mas todas as respostas estiverem salvas.</p></div>
              <span className="text-xs text-muted-foreground">{filteredPending.length} encontrado(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-border"><Th>Candidato</Th><Th>Empresa</Th><Th>Funcao/Cargo</Th><Th>Progresso</Th><Th>Status</Th><Th align="right">Acao</Th></tr></thead>
                <tbody>
                  {filteredPending.length === 0 ? <tr><td colSpan={6} className="text-center p-10 text-sm text-muted-foreground">Nenhum cadastro pendente encontrado.</td></tr> : filteredPending.map((participant) => {
                    const answered = answerCount(participant.answers);
                    const ready = canGenerateResult(participant);
                    return (
                      <tr key={participant.id} className="border-b border-border/50 hover:bg-white/[0.02]">
                        <Td><p className="font-medium text-foreground">{participant.full_name || "Sem nome"}</p><p className="text-[11px] text-muted-foreground">{participant.email || "—"}</p></Td>
                        <Td><p>{participant.company || "—"}</p><button onClick={() => { setEditCompanyTarget({ kind: "participant", id: participant.id, email: participant.email, name: participant.full_name, company: participant.company }); setEditCompanyValue(participant.company || ""); }} className="text-[11px] text-primary hover:underline">Editar empresa</button></Td>
                        <Td>{participant.role || "—"}</Td>
                        <Td><span className={ready ? "text-emerald-300" : "text-amber-300"}>{answered}/{QUESTIONS.length}</span></Td>
                        <Td>{ready ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">Pronto para gerar</span> : <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">Incompleto</span>}</Td>
                        <Td align="right"><div className="flex justify-end gap-1"><Link to={`/test/${participant.id}`}><Button variant="ghost" size="sm" className="h-8 gap-1 text-primary text-xs">Abrir</Button></Link>{ready && <Button size="sm" disabled={generatingId === participant.id} onClick={() => generateResultForParticipant(participant)} className="h-8 gap-1 text-xs"><FileCheck2 className="w-3 h-3" /> {generatingId === participant.id ? "Gerando..." : "Gerar resultado"}</Button>}<Button variant="ghost" size="sm" disabled={deletingId === participant.id} onClick={() => deleteCandidate({ kind: "participant", id: participant.id, email: participant.email, name: participant.full_name })} className="h-8 text-xs text-destructive">Excluir</Button></div></Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>

      {editCompanyTarget && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl"><div className="flex items-start justify-between gap-4 mb-4"><div><h2 className="font-heading text-base font-semibold text-foreground">Editar empresa</h2><p className="text-xs text-muted-foreground mt-1">{editCompanyTarget.name || "Participante"}</p></div><button onClick={() => setEditCompanyTarget(null)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button></div><label className="text-xs text-muted-foreground">Empresa</label><Input value={editCompanyValue} onChange={(event) => setEditCompanyValue(event.target.value)} className="mt-1 bg-background" placeholder="Nome da empresa" autoFocus /><div className="flex justify-end gap-2 mt-5"><Button variant="outline" onClick={() => setEditCompanyTarget(null)} disabled={savingCompany}>Cancelar</Button><Button onClick={saveCompanyEdit} disabled={savingCompany}>{savingCompany ? "Salvando..." : "Salvar empresa"}</Button></div></div></div>}

      {sidebarOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} /><aside className="absolute left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border p-5"><button onClick={() => setSidebarOpen(false)} className="mb-6 text-muted-foreground"><X className="w-5 h-5" /></button><nav className="space-y-0.5">{NAV_ITEMS.map((item) => <Link key={item.label} to={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground"><item.icon className="w-4 h-4" /> {item.label}</Link>)}</nav></aside></div>}
    </div>
  );
}

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] || "#6366f1";
  return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ backgroundColor: color }}>T{type} - {TYPE_NAMES[type] || "—"}</span>;
}

function ConfidenceBadge({ value }) {
  const score = Number(value) || 0;
  const info = confidenceLevel(score);
  return <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold ${info.className}`}>{info.label} <span className="font-medium opacity-80">{score}%</span></span>;
}

function ClarityLegend() {
  return <div className="border-b border-border bg-background/30 px-4 py-3"><div className="grid gap-2 text-[11px] text-muted-foreground md:grid-cols-3"><div><span className="font-semibold text-red-300">Clareza baixa:</span> perfil com tipos proximos; interpretar com cautela.</div><div><span className="font-semibold text-amber-300">Clareza moderada:</span> tendencia utilizavel, mas nao absoluta.</div><div><span className="font-semibold text-emerald-300">Clareza alta:</span> tipo dominante bem destacado.</div></div></div>;
}

function MetricCard({ icon: Icon, label, value }) {
  return <div className="bg-card border border-border rounded-2xl p-5"><div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div><p className="text-2xl font-bold text-foreground mt-3">{value}</p><p className="text-[11px] text-muted-foreground mt-0.5">{label}</p></div>;
}

function Th({ children, align = "left" }) {
  return <th className={`text-${align} p-3 text-[11px] font-semibold text-muted-foreground whitespace-nowrap`}>{children}</th>;
}

function Td({ children, align = "left" }) {
  return <td className={`text-${align} p-3 text-sm text-muted-foreground align-middle whitespace-nowrap`}>{children}</td>;
}
