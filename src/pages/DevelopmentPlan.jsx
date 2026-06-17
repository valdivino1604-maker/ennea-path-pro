import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Target, CheckCircle2, Clock, TrendingUp, Calendar, ChevronRight, Sparkles, Loader2, Zap, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { base44 } from "@/api/base44Client";
import { TYPE_NAMES, TYPE_COLORS, TYPE_DETAILS } from "@/lib/enneagramData";

const EMOJIS = { 1: "⚖️", 2: "💝", 3: "🏆", 4: "🎨", 5: "🔬", 6: "🛡️", 7: "🎉", 8: "💪", 9: "☮️" };

export default function DevelopmentPlan() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [activePillar, setActivePillar] = useState(0);
  const [pdiPillars, setPdiPillars] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [scores, setScores] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    base44.entities.TestResult.filter({ completed: true }, '-created_date', 500).then(r => {
      const latest = {};
      r.forEach(item => {
        if (!latest[item.participant_email]) latest[item.participant_email] = item;
      });
      setResults(Object.values(latest));
      setLoading(false);
    });
  }, []);

  const person = results.find(r => r.id === selectedId);
  const detail = person ? TYPE_DETAILS[person.dominant_type] : null;

  const handleSelect = (id) => {
    setSelectedId(id);
    setPdiPillars(null);
    setScores(null);
    setActivePillar(0);
  };

  const handleGeneratePDI = async () => {
    if (!person) return;
    setGenerating(true);
    try {
      let parsedScores = null;
      try {
        parsedScores = JSON.parse(person.scores || "{}");
      } catch (e) { parsedScores = {}; }

      setScores(parsedScores);

      const rankingSummary = (parsedScores.ranking || [])
        .map((r, i) => `${i + 1}º Tipo ${r.type} (${TYPE_NAMES[r.type]}): ${r.percentage}%`)
        .join("\n");

      const detailData = detail || TYPE_DETAILS[1];

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em Eneagrama e desenvolvimento humano. Analise os resultados reais do teste de uma pessoa e crie um Plano de Desenvolvimento Individual (PDI) personalizado.

DADOS DA PESSOA:
- Nome: ${person.participant_name}
- Tipo Dominante: ${person.dominant_type} — ${person.dominant_type_name}
- Asa: ${person.wing}w (${person.wing_name})
- Confiança do diagnóstico: ${person.confidence_level}%

RANKING COMPLETO DOS 9 TIPOS:
${rankingSummary}

PERFIL DO TIPO DOMINANTE:
- Motivação: ${detailData.motivation}
- Medos: ${detailData.fears}
- Forças: ${detailData.strengths}
- Fraquezas: ${detailData.weaknesses}
- Liderança: ${detailData.leadership}
- Comunicação: ${detailData.communication}
- Desenvolvimento: ${detailData.development}

Com base nesses resultados REAIS (não genéricos), crie um PDI com exatamente 3 pilares de desenvolvimento. Cada pilar deve considerar o ranking real dos tipos — por exemplo, se o Tipo 8 está em 2º lugar e o dominante é Tipo 3, recomende integrar assertividade do Tipo 8.

Retorne APENAS um JSON válido (sem markdown, sem \`\`\`) neste formato exato:
{
  "pillars": [
    {
      "area": "Nome da área (2-3 palavras)",
      "goal": "Objetivo claro e específico baseado nos resultados reais",
      "actions": ["Ação 1 bem específica", "Ação 2", "Ação 3"],
      "timeline": "X meses"
    },
    ... (total de 3 pilares)
  ]
}

IMPORTANTE: 
- As ações devem ser práticas, mensuráveis e personalizadas ao perfil específico.
- Use o ranking real para recomendar integração de características de tipos complementares.
- Escreva tudo em português.`,
        response_json_schema: {
          type: "object",
          properties: {
            pillars: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  goal: { type: "string" },
                  actions: { type: "array", items: { type: "string" } },
                  timeline: { type: "string" }
                },
                required: ["area", "goal", "actions", "timeline"]
              }
            }
          },
          required: ["pillars"]
        },
        model: "gpt_5_mini"
      });

      const aiPillars = (response.data?.pillars || []).map(p => ({ ...p, progress: 0 }));
      if (aiPillars.length > 0) setPdiPillars(aiPillars);
    } catch (err) {
      console.error("Erro ao gerar PDI:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!person || !pdiPillars) return;
    setDownloading(true);
    try {
      const response = await base44.functions.invoke('generatePDIPDF', {
        resultId: person.id,
        pillars: pdiPillars,
        participantName: person.participant_name,
        dominantType: person.dominant_type,
        dominantTypeName: person.dominant_type_name,
        wing: person.wing,
        confidence: person.confidence_level
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pdi-${(person.participant_name || 'participante').replace(/\s+/g, '-').toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao baixar PDF:', err);
    } finally {
      setDownloading(false);
    }
  };

  const active = pdiPillars?.[activePillar];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Plano de Desenvolvimento Individual</h1>
            <p className="text-sm text-muted-foreground">PDI gerado por IA com base nos resultados reais do Eneagrama.</p>
          </div>
        </div>

        {/* Select Person */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Selecionar Colaborador</label>
          <Select value={selectedId} onValueChange={handleSelect}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Escolha um membro da equipe..." />
            </SelectTrigger>
            <SelectContent>
              {results.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: TYPE_COLORS[r.dominant_type] }}>T{r.dominant_type}</span>
                    {r.participant_name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {person && detail && !pdiPillars && !generating && (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-6">
              <span className="text-4xl">{EMOJIS[person.dominant_type]}</span>
              <div className="text-left">
                <h2 className="font-heading text-lg font-bold text-foreground">{person.participant_name}</h2>
                <p className="text-sm text-muted-foreground">Tipo {person.dominant_type} — {detail.name} · Asa {person.wing}w</p>
                <p className="text-xs text-muted-foreground mt-1">Confiança do diagnóstico: {person.confidence_level}%</p>
              </div>
            </div>

            <Button
              onClick={handleGeneratePDI}
              size="lg"
              className="gap-2 rounded-xl px-10 py-6 text-base font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30"
            >
              <Sparkles className="w-5 h-5" /> Gerar PDI com IA
            </Button>
            <p className="mt-4 text-xs text-muted-foreground max-w-sm mx-auto">
              A IA analisará todos os resultados do teste e criará um plano de desenvolvimento personalizado com base no seu perfil real.
            </p>
          </div>
        )}

        {generating && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground">Gerando PDI personalizado...</p>
            <p className="text-xs text-muted-foreground mt-1">A IA está analisando os resultados de {person?.participant_name}</p>
          </div>
        )}

        {person && pdiPillars && (
          <>
            {/* Profile Summary */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{EMOJIS[person.dominant_type]}</span>
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">{person.participant_name}</h2>
                  <p className="text-sm text-muted-foreground">Tipo {person.dominant_type} — {TYPE_NAMES[person.dominant_type]}</p>
                </div>
                <div className="ml-auto flex items-center gap-3">
                  <Button onClick={handleDownloadPDF} disabled={downloading} variant="outline" size="sm" className="gap-1.5 text-xs">
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    {downloading ? "Gerando..." : "PDF"}
                  </Button>
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-1 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> IA
                  </span>
                  <div className="text-right">
                    <p className="text-[11px] text-muted-foreground">PDI gerado em</p>
                    <p className="text-xs font-medium text-foreground">{new Date().toLocaleDateString("pt-BR")}</p>
                  </div>
                </div>
              </div>

              {/* Score Summary from AI analysis context */}
              {scores?.ranking && (
                <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border">
                  {scores.ranking.slice(0, 5).map((r, i) => (
                    <span key={r.type} className="text-[10px] px-2 py-1 rounded-full border flex items-center gap-1" style={{ borderColor: TYPE_COLORS[r.type] + "40", color: TYPE_COLORS[r.type] }}>
                      {i + 1}º T{r.type} {r.percentage}%
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Pillars Navigation */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {pdiPillars.map((pillar, i) => (
                <button
                  key={i}
                  onClick={() => setActivePillar(i)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-left transition-all min-w-[140px] ${
                    i === activePillar ? "bg-primary/15 border border-primary/30" : "bg-card border border-border hover:border-white/10"
                  }`}
                >
                  <p className="text-xs font-semibold text-foreground">{pillar.area}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{pillar.timeline}</p>
                </button>
              ))}
            </div>

            {/* Active Pillar */}
            {active && (
              <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="font-heading text-base font-semibold text-foreground">{active.area}</h3>
                </div>

                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
                  <p className="text-xs text-muted-foreground mb-1">Objetivo</p>
                  <p className="text-sm font-medium text-foreground">{active.goal}</p>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Progresso</span>
                    <span className="text-xs font-bold text-primary">{active.progress}%</span>
                  </div>
                  <Progress value={active.progress} className="h-2" />
                </div>

                <div className="space-y-3 mb-6">
                  <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Ações Recomendadas
                  </h4>
                  {active.actions.map((action, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-border/50">
                      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">{i + 1}</span>
                      <p className="text-sm text-muted-foreground">{action}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Prazo: {active.timeline}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Revisão quinzenal</span>
                </div>
              </div>
            )}

            {/* All Pillars Summary */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading text-sm font-semibold text-foreground">Resumo do PDI</h3>
                <Button onClick={handleDownloadPDF} disabled={downloading} variant="outline" size="sm" className="gap-1.5 text-xs">
                  <Download className="w-3.5 h-3.5" />
                  {downloading ? "Gerando PDF..." : "Baixar PDF"}
                </Button>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {pdiPillars.map((pillar, i) => (
                  <div key={i} className="p-4 rounded-xl border border-border/50 bg-card">
                    <p className="text-xs font-semibold text-foreground">{pillar.area}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{pillar.goal}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[10px] text-muted-foreground">{pillar.timeline}</span>
                      <Button variant="ghost" size="sm" className="text-[10px] h-auto py-1 px-2 text-primary" onClick={() => setActivePillar(i)}>
                        Abrir <ChevronRight className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!person && !loading && (
          <div className="text-center py-20 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Selecione um colaborador para gerar o PDI</p>
          </div>
        )}
      </div>
    </div>
  );
}