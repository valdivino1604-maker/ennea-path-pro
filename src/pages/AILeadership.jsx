import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, Bot, Building2, Brain, CheckCircle2, GitBranch, Lightbulb, Loader2, ShieldAlert, Target, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { TYPE_NAMES, TYPE_COLORS, TYPE_DETAILS } from "@/lib/enneagramData";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function companyLabel(value) {
  const label = String(value || "").trim();
  return label || "Sem empresa";
}

function companyKey(value) {
  return normalizeText(companyLabel(value));
}

function getLatestByEmail(rows) {
  const latest = {};
  rows.forEach((item) => {
    const key = normalizeText(item.participant_email || item.id);
    if (!latest[key]) latest[key] = item;
  });
  return Object.values(latest);
}

function groupByType(rows) {
  const counts = {};
  for (let i = 1; i <= 9; i++) counts[i] = 0;
  rows.forEach((item) => {
    const type = Number(item.dominant_type);
    if (type) counts[type] = (counts[type] || 0) + 1;
  });
  return counts;
}

function classifyGroup(counts, total) {
  const ordered = Object.entries(counts)
    .map(([type, count]) => ({ type: Number(type), count, percentage: total ? Math.round((count / total) * 100) : 0 }))
    .sort((a, b) => b.count - a.count || a.type - b.type);

  const dominant = ordered.filter((item) => item.count > 0).slice(0, 3);
  const missing = ordered.filter((item) => item.count === 0).map((item) => item.type);
  const excess = ordered.filter((item) => item.percentage >= 35 && item.count >= 2);
  return { ordered, dominant, missing, excess };
}

function riskForType(type) {
  const risks = {
    1: "Excesso de cobrança, rigidez e baixa tolerância a erro.",
    2: "Risco de dependência emocional, excesso de ajuda e dificuldade de cobrar desempenho.",
    3: "Competição interna, foco excessivo em imagem e pressão por resultado.",
    4: "Oscilação emocional, personalização de críticas e conflitos por reconhecimento.",
    5: "Isolamento, pouca comunicação e lentidão por análise excessiva.",
    6: "Medo de errar, excesso de cautela e busca constante por validação.",
    7: "Dispersão, dificuldade de concluir e excesso de ideias sem execução.",
    8: "Confronto, disputa de controle e comunicação dura.",
    9: "Evitação de conflito, lentidão decisória e acomodação."
  };
  return risks[type] || "Risco comportamental não identificado.";
}

function strengthForType(type) {
  const strengths = {
    1: "qualidade, padrão, organização e melhoria contínua",
    2: "cuidado com pessoas, integração e apoio ao time",
    3: "meta, entrega, produtividade e ambição",
    4: "criatividade, autenticidade e sensibilidade ao clima",
    5: "análise, estratégia, conhecimento técnico e profundidade",
    6: "prevenção de risco, segurança, lealdade e planejamento",
    7: "inovação, energia, visão de oportunidade e adaptação",
    8: "decisão, força de execução, proteção e liderança firme",
    9: "mediação, estabilidade, escuta e pacificação"
  };
  return strengths[type] || "força não identificada";
}

function recommendationForMissing(type) {
  const recommendations = {
    1: "Criar processos, checklists e critérios claros de qualidade.",
    2: "Fortalecer rituais de integração, escuta e apoio entre pessoas.",
    3: "Definir metas objetivas, ranking de entregas e indicadores de desempenho.",
    4: "Abrir espaço para criatividade, diferenciação e leitura do clima emocional.",
    5: "Trazer mais análise técnica, estudo profundo e validação por dados.",
    6: "Mapear riscos, criar planos de contingência e revisar decisões críticas.",
    7: "Estimular inovação, ideias novas e visão de oportunidade.",
    8: "Definir responsáveis fortes para decisão, cobrança e destravamento.",
    9: "Criar mediação, alinhamento e mecanismos para reduzir atritos."
  };
  return recommendations[type] || "Reforçar competência complementar.";
}

function buildGroupAnalysis(rows) {
  const total = rows.length;
  const counts = groupByType(rows);
  const info = classifyGroup(counts, total);
  const main = info.dominant[0];
  const second = info.dominant[1];
  const missingImportant = info.missing.slice(0, 4);

  const risks = [];
  if (info.excess.length) {
    info.excess.forEach((item) => risks.push(`Concentração de Tipo ${item.type}: ${riskForType(item.type)}`));
  }
  if (info.missing.includes(8)) risks.push("Pouca energia de confronto e decisão pode deixar problemas difíceis sem dono.");
  if (info.missing.includes(5)) risks.push("Baixa presença analítica pode fragilizar decisões técnicas e estratégicas.");
  if (info.missing.includes(3)) risks.push("Ausência de perfil realizador pode reduzir ritmo, cobrança e foco em entrega.");
  if (info.missing.includes(9)) risks.push("Sem perfil pacificador, conflitos podem escalar mais rápido.");
  if (!risks.length) risks.push("O grupo tem distribuição relativamente equilibrada; o risco maior está na comunicação entre estilos diferentes.");

  const recommendations = [];
  if (main) recommendations.push(`Use o Tipo ${main.type} como força predominante do grupo: ${strengthForType(main.type)}.`);
  if (second) recommendations.push(`O Tipo ${second.type} aparece como apoio comportamental relevante: ${strengthForType(second.type)}.`);
  missingImportant.forEach((type) => recommendations.push(`Tipo ${type} ausente/fraco: ${recommendationForMissing(type)}`));
  recommendations.push("Defina papéis por perfil: quem decide, quem revisa, quem executa, quem integra e quem antecipa riscos.");
  recommendations.push("Não use o eneagrama para rotular pessoas; use para melhorar comunicação, liderança e alocação de responsabilidades.");

  return { counts, ...info, risks, recommendations, total };
}

export default function AILeadership() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState("all");
  const [analysis, setAnalysis] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    base44.entities.TestResult.filter({ completed: true }, "-created_date", 1000)
      .then((rows) => setResults(getLatestByEmail(Array.isArray(rows) ? rows : [])))
      .finally(() => setLoading(false));
  }, []);

  const companyOptions = useMemo(() => {
    const map = new Map();
    results.forEach((item) => {
      const label = companyLabel(item.participant_company);
      const key = companyKey(label);
      if (!map.has(key)) map.set(key, label);
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  }, [results]);

  const filteredResults = useMemo(() => {
    if (selectedCompany === "all") return results;
    return results.filter((item) => companyKey(item.participant_company) === selectedCompany);
  }, [results, selectedCompany]);

  const preview = useMemo(() => buildGroupAnalysis(filteredResults), [filteredResults]);
  const maxCount = Math.max(...Object.values(preview.counts || {}), 1);

  const handleGenerate = () => {
    setGenerating(true);
    setTimeout(() => {
      setAnalysis(buildGroupAnalysis(filteredResults));
      setGenerating(false);
    }, 400);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-8">
          <div className="w-11 h-11 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-foreground">IA de Análise de Grupo</h1>
            <p className="text-sm text-muted-foreground">Diagnóstico gerencial automático da equipe com base nos resultados de Eneagrama.</p>
          </div>
          <Button onClick={handleGenerate} disabled={generating || filteredResults.length === 0} className="gap-2 rounded-xl">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            {generating ? "Analisando..." : "Gerar análise do grupo"}
          </Button>
        </div>

        <section className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="grid lg:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">Empresa / Equipe</label>
              <Select value={selectedCompany} onValueChange={(value) => { setSelectedCompany(value); setAnalysis(null); }}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as empresas</SelectItem>
                  {companyOptions.map(([key, label]) => <SelectItem key={key} value={key}>{label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Metric icon={Users} label="Pessoas analisadas" value={filteredResults.length} />
            <Metric icon={Building2} label="Empresas no banco" value={companyOptions.length} />
          </div>
        </section>

        {filteredResults.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground bg-card border border-border rounded-2xl">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Nenhum resultado encontrado para esta seleção.</p>
          </div>
        ) : (
          <>
            <section className="grid lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <BarChart3 className="w-4 h-4 text-primary" />
                  <h2 className="font-heading text-base font-semibold text-foreground">Mapa de distribuição do grupo</h2>
                </div>
                <div className="space-y-3">
                  {preview.ordered.map((item) => (
                    <div key={item.type}>
                      <div className="flex items-center justify-between mb-1 gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-7 h-7 rounded-lg text-[11px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: TYPE_COLORS[item.type] }}>T{item.type}</span>
                          <span className="text-sm text-foreground truncate">{TYPE_NAMES[item.type]}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-bold">{item.count} pessoa(s) · {item.percentage}%</span>
                      </div>
                      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(4, (item.count / maxCount) * 100)}%`, backgroundColor: TYPE_COLORS[item.type] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-5">
                  <Target className="w-4 h-4 text-primary" />
                  <h2 className="font-heading text-base font-semibold text-foreground">Leitura rápida</h2>
                </div>
                <div className="space-y-3">
                  <Insight label="Tipo predominante" value={preview.dominant[0] ? `Tipo ${preview.dominant[0].type} - ${TYPE_NAMES[preview.dominant[0].type]}` : "Sem predominância"} />
                  <Insight label="Tipos fortes" value={preview.dominant.map((item) => `T${item.type}`).join(", ") || "—"} />
                  <Insight label="Tipos ausentes" value={preview.missing.length ? preview.missing.map((type) => `T${type}`).join(", ") : "Nenhum"} />
                  <Insight label="Concentração de risco" value={preview.excess.length ? preview.excess.map((item) => `T${item.type} (${item.percentage}%)`).join(", ") : "Baixa"} />
                </div>
              </div>
            </section>

            {(analysis || preview) && (
              <section className="space-y-6">
                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <ShieldAlert className="w-4 h-4 text-amber-300" />
                    <h2 className="font-heading text-base font-semibold text-foreground">Riscos de gestão e conflito</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {(analysis || preview).risks.map((risk, index) => (
                      <div key={index} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground leading-relaxed">
                        {risk}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <Lightbulb className="w-4 h-4 text-emerald-300" />
                    <h2 className="font-heading text-base font-semibold text-foreground">Recomendações da IA para o grupo</h2>
                  </div>
                  <div className="grid md:grid-cols-2 gap-3">
                    {(analysis || preview).recommendations.map((item, index) => (
                      <div key={index} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">{index + 1}</span>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-5">
                    <GitBranch className="w-4 h-4 text-blue-300" />
                    <h2 className="font-heading text-base font-semibold text-foreground">Mapa de papéis sugeridos</h2>
                  </div>
                  <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredResults.slice(0, 18).map((person) => {
                      const type = Number(person.dominant_type);
                      const detail = TYPE_DETAILS[type];
                      return (
                        <div key={person.id} className="rounded-xl border border-border bg-background/40 p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-7 h-7 rounded-lg text-[11px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: TYPE_COLORS[type] }}>T{type}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">{person.participant_name || "Sem nome"}</p>
                              <p className="text-[10px] text-muted-foreground truncate">{person.participant_role || "Sem função"}</p>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground leading-relaxed"><strong className="text-foreground">Melhor uso:</strong> {strengthForType(type)}.</p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed mt-1"><strong className="text-foreground">Cuidado:</strong> {riskForType(type)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="w-4 h-4 text-primary" />
        <span className="text-[11px]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function Insight({ label, value }) {
  return (
    <div className="border-b border-border/50 pb-3 last:border-0 last:pb-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
      <p className="text-sm text-foreground mt-1 leading-relaxed">{value}</p>
    </div>
  );
}
