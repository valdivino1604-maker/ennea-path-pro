import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, CheckCircle2, ClipboardCheck, Download, Grid3X3, MessageSquare, Save, Target, TrendingUp, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { TYPE_COLORS, TYPE_NAMES } from "@/lib/enneagramData";

const COMPETENCIES = [
  "Entrega e produtividade",
  "Qualidade tecnica",
  "Comunicacao",
  "Trabalho em equipe",
  "Lideranca",
  "Adaptabilidade",
  "Proatividade",
  "Disciplina e organizacao"
];

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function safeParse(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function average(values) {
  const valid = values.map(Number).filter((v) => Number.isFinite(v) && v > 0);
  if (!valid.length) return 0;
  return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10;
}

function nineBox(performance, potential) {
  const p = Number(performance) || 0;
  const po = Number(potential) || 0;
  const pBand = p >= 4 ? "alta" : p >= 3 ? "media" : "baixa";
  const poBand = po >= 4 ? "alto" : po >= 3 ? "medio" : "baixo";
  if (pBand === "alta" && poBand === "alto") return "Talento-chave";
  if (pBand === "alta" && poBand === "medio") return "Alta performance";
  if (pBand === "alta" && poBand === "baixo") return "Especialista confiavel";
  if (pBand === "media" && poBand === "alto") return "Potencial em desenvolvimento";
  if (pBand === "media" && poBand === "medio") return "Contribuidor consistente";
  if (pBand === "media" && poBand === "baixo") return "Manter e orientar";
  if (pBand === "baixa" && poBand === "alto") return "Aposta com risco";
  if (pBand === "baixa" && poBand === "medio") return "Plano corretivo";
  return "Baixa aderencia atual";
}

function developmentSuggestion(type, score) {
  const weak = Number(score) < 3;
  const base = {
    1: weak ? "Trabalhar flexibilidade, delegacao e tolerancia a erro." : "Usar padronizacao e qualidade para elevar o time.",
    2: weak ? "Definir limites, indicadores e cobranca objetiva." : "Usar empatia para integrar e desenvolver pessoas.",
    3: weak ? "Equilibrar velocidade com escuta e consistencia." : "Direcionar para metas, entrega e projetos de impacto.",
    4: weak ? "Criar rotina, prioridade e criterios objetivos." : "Aproveitar criatividade e leitura emocional do ambiente.",
    5: weak ? "Aumentar comunicacao, exposicao e colaboracao." : "Aplicar analise tecnica em decisoes criticas.",
    6: weak ? "Reduzir inseguranca com contexto, prioridade e plano claro." : "Usar visao de risco e planejamento como diferencial.",
    7: weak ? "Focar conclusao, disciplina e limite de prioridades." : "Usar criatividade e energia para inovacao.",
    8: weak ? "Treinar escuta, negociacao e calibragem de intensidade." : "Usar decisao e coragem para destravar problemas.",
    9: weak ? "Criar prazos, responsabilizacao e postura ativa." : "Usar mediacao e estabilidade para harmonizar equipes."
  };
  return base[type] || "Definir plano de desenvolvimento individual com metas objetivas.";
}

function fromDbReview(row) {
  if (!row) return {};
  return {
    id: row.id,
    result_id: row.result_id,
    competencies: safeParse(row.competencies),
    performance: Number(row.performance_score || 0),
    potential: Number(row.potential_score || 0),
    goals: Number(row.goals_score || 0),
    final: Number(row.final_score || 0),
    nineBox: row.nine_box || "",
    managerFeedback: row.manager_feedback || "",
    selfReview: row.self_review || "",
    pdi: row.pdi || "",
    cycle: row.cycle || "",
    status: row.status || "draft",
    updated_at: row.updated_date || ""
  };
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export default function PerformanceReview() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [reviews, setReviews] = useState({});

  useEffect(() => {
    Promise.all([
      base44.entities.TestResult.filter({ completed: true }, "-created_date", 1000),
      base44.entities.PerformanceReview.filter({}, "-updated_date", 1000)
    ])
      .then(([resultRows, reviewRows]) => {
        const cleanResults = Array.isArray(resultRows) ? resultRows : [];
        setResults(cleanResults);
        const mapped = {};
        (Array.isArray(reviewRows) ? reviewRows : []).forEach((row) => {
          if (row.result_id) mapped[row.result_id] = fromDbReview(row);
        });
        setReviews(mapped);
        if (cleanResults[0]?.id) setSelectedId(cleanResults[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  const people = useMemo(() => {
    const map = new Map();
    results.forEach((row) => {
      const key = normalizeText(row.participant_email || row.participant_name || row.id);
      if (!map.has(key)) map.set(key, row);
    });
    return Array.from(map.values());
  }, [results]);

  const filteredPeople = useMemo(() => {
    const q = normalizeText(search);
    return people.filter((p) => normalizeText(`${p.participant_name} ${p.participant_email} ${p.participant_company} ${p.participant_role}`).includes(q));
  }, [people, search]);

  const person = people.find((p) => p.id === selectedId) || filteredPeople[0];
  const review = person ? (reviews[person.id] || {}) : {};
  const competencyScores = COMPETENCIES.map((c) => Number(review.competencies?.[c] || 0));
  const performanceScore = Number(review.performance || 0) || average(competencyScores) || 3;
  const potentialScore = Number(review.potential || 0) || 3;
  const goalsScore = Number(review.goals || 0) || 3;
  const finalScore = average([performanceScore, potentialScore, goalsScore]);
  const box = nineBox(performanceScore, potentialScore);

  async function persistReview(personRow, nextReview) {
    if (!personRow) return;
    setSaving(true);
    setSaveError("");
    try {
      const performance = Number(nextReview.performance || 0) || average(COMPETENCIES.map((c) => Number(nextReview.competencies?.[c] || 0))) || 3;
      const potential = Number(nextReview.potential || 0) || 3;
      const goals = Number(nextReview.goals || 0) || 3;
      const final = average([performance, potential, goals]);
      const saved = await base44.entities.PerformanceReview.create({
        result_id: personRow.id,
        participant_id: personRow.participant_id || "",
        participant_name: personRow.participant_name || "",
        participant_email: personRow.participant_email || "",
        participant_company: personRow.participant_company || "",
        participant_role: personRow.participant_role || "",
        dominant_type: Number(personRow.dominant_type) || null,
        performance_score: performance,
        potential_score: potential,
        goals_score: goals,
        final_score: final,
        nine_box: nineBox(performance, potential),
        competencies: nextReview.competencies || {},
        manager_feedback: nextReview.managerFeedback || "",
        self_review: nextReview.selfReview || "",
        pdi: nextReview.pdi || "",
        cycle: nextReview.cycle || new Date().getFullYear().toString(),
        status: nextReview.status || "draft"
      });
      setReviews((prev) => ({ ...prev, [personRow.id]: { ...nextReview, ...fromDbReview(saved) } }));
    } catch (error) {
      setSaveError(error.message || "Nao foi possivel salvar a avaliacao.");
    } finally {
      setSaving(false);
    }
  }

  function updateReview(patch) {
    if (!person) return;
    const nextReview = { ...review, ...patch, updated_at: new Date().toISOString() };
    setReviews((prev) => ({ ...prev, [person.id]: nextReview }));
    persistReview(person, nextReview);
  }

  function updateCompetency(name, value) {
    updateReview({ competencies: { ...(review.competencies || {}), [name]: Number(value) } });
  }

  function exportCsv() {
    const rows = [["Nome", "Email", "Empresa", "Cargo", "Tipo", "Desempenho", "Potencial", "Metas", "Nota final", "9-box", "PDI"]];
    people.forEach((p) => {
      const r = reviews[p.id] || {};
      const comp = average(COMPETENCIES.map((c) => Number(r.competencies?.[c] || 0)));
      const perf = Number(r.performance || 0) || comp || 0;
      const pot = Number(r.potential || 0);
      const goals = Number(r.goals || 0);
      const final = average([perf, pot, goals]);
      rows.push([p.participant_name, p.participant_email, p.participant_company, p.participant_role, `Tipo ${p.dominant_type}`, perf, pot, goals, final, nineBox(perf, pot), r.pdi || ""]);
    });
    const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `avaliacao-desempenho-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-emerald-300 inline-flex items-center gap-1"><Save className="w-3 h-3" /> Salvando no D1...</span>}
            <Button onClick={exportCsv} className="gap-2 rounded-xl"><Download className="w-4 h-4" /> Exportar avaliações</Button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center"><ClipboardCheck className="w-5 h-5 text-primary" /></div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Avaliação de Desempenho</h1>
            <p className="text-sm text-muted-foreground">Metas, competências, feedback, PDI e matriz 9-box salvos no banco D1.</p>
          </div>
        </div>

        {saveError && <div className="mb-6 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">{saveError}</div>}

        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          <aside className="bg-card border border-border rounded-2xl p-4 h-fit">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar colaborador..." className="bg-background mb-4" />
            <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
              {filteredPeople.map((p) => (
                <button key={p.id} onClick={() => setSelectedId(p.id)} className={`w-full text-left rounded-xl border p-3 transition-colors ${person?.id === p.id ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:bg-white/[0.03]"}`}>
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg text-[11px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: TYPE_COLORS[p.dominant_type] || "#6366f1" }}>T{p.dominant_type}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{p.participant_name || "Sem nome"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{p.participant_role || "Sem cargo"}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {!person ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center text-muted-foreground">Nenhum colaborador concluido encontrado.</div>
          ) : (
            <main className="space-y-6">
              <section className="bg-card border border-border rounded-2xl p-5">
                <div className="flex flex-col xl:flex-row xl:items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Colaborador avaliado</p>
                    <h2 className="font-heading text-xl font-bold text-foreground">{person.participant_name}</h2>
                    <p className="text-sm text-muted-foreground">{person.participant_company || "Sem empresa"} - {person.participant_role || "Sem cargo"} - Tipo {person.dominant_type} - {TYPE_NAMES[person.dominant_type]}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <Metric icon={BarChart3} label="Desempenho" value={performanceScore} />
                    <Metric icon={TrendingUp} label="Potencial" value={potentialScore} />
                    <Metric icon={Target} label="Metas" value={goalsScore} />
                    <Metric icon={Grid3X3} label="9-box" value={box} small />
                  </div>
                </div>
              </section>

              <section className="grid lg:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-2xl p-5 lg:col-span-2">
                  <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2"><UserCheck className="w-4 h-4 text-primary" /> Competências</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {COMPETENCIES.map((item) => (
                      <div key={item} className="rounded-xl border border-border bg-background/40 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-medium text-foreground">{item}</label>
                          <span className="text-xs font-bold text-primary">{review.competencies?.[item] || 0}/5</span>
                        </div>
                        <input type="range" min="1" max="5" value={review.competencies?.[item] || 3} onChange={(e) => updateCompetency(item, e.target.value)} className="w-full" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                  <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2"><Grid3X3 className="w-4 h-4 text-primary" /> Calibração 9-box</h3>
                  <ScoreInput label="Desempenho geral" value={performanceScore} onChange={(v) => updateReview({ performance: Number(v) })} />
                  <ScoreInput label="Potencial futuro" value={potentialScore} onChange={(v) => updateReview({ potential: Number(v) })} />
                  <ScoreInput label="Entrega de metas" value={goalsScore} onChange={(v) => updateReview({ goals: Number(v) })} />
                  <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 mt-4">
                    <p className="text-xs text-muted-foreground">Classificação</p>
                    <p className="text-lg font-bold text-primary mt-1">{box}</p>
                    <p className="text-xs text-muted-foreground mt-2">Nota final estimada: {finalScore}/5</p>
                  </div>
                </div>
              </section>

              <section className="grid lg:grid-cols-2 gap-6">
                <TextPanel title="Feedback do gestor" icon={MessageSquare} value={review.managerFeedback || ""} onChange={(v) => updateReview({ managerFeedback: v })} placeholder="Registre fatos, comportamentos observados, impacto e combinados..." />
                <TextPanel title="Autoavaliação" icon={CheckCircle2} value={review.selfReview || ""} onChange={(v) => updateReview({ selfReview: v })} placeholder="Resumo do próprio colaborador sobre entregas, desafios e evolução..." />
              </section>

              <section className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> PDI - Plano de Desenvolvimento Individual</h3>
                <textarea value={review.pdi || developmentSuggestion(Number(person.dominant_type), performanceScore)} onChange={(e) => updateReview({ pdi: e.target.value })} className="w-full min-h-[130px] rounded-xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              </section>
            </main>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value, small }) {
  return <div className="rounded-xl border border-border bg-background/40 p-3 min-w-[120px]"><div className="flex items-center gap-1.5 text-muted-foreground mb-1"><Icon className="w-3.5 h-3.5 text-primary" /><span className="text-[10px]">{label}</span></div><p className={`${small ? "text-xs" : "text-xl"} font-bold text-foreground leading-tight`}>{value}</p></div>;
}

function ScoreInput({ label, value, onChange }) {
  return <div className="mb-4"><div className="flex items-center justify-between mb-2"><label className="text-xs text-muted-foreground">{label}</label><span className="text-xs font-bold text-primary">{value}/5</span></div><input type="range" min="1" max="5" value={value} onChange={(e) => onChange(e.target.value)} className="w-full" /></div>;
}

function TextPanel({ title, icon: Icon, value, onChange, placeholder }) {
  return <div className="bg-card border border-border rounded-2xl p-5"><h3 className="font-heading text-base font-semibold text-foreground mb-4 flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /> {title}</h3><textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full min-h-[150px] rounded-xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" /></div>;
}
