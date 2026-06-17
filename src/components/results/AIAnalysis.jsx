import React, { useState, useEffect, useRef } from "react";
import { Sparkles, Loader2, Brain, Target, Briefcase, Calendar, TrendingUp, AlertTriangle, Star, Shield, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { base44 } from "@/api/base44Client";
import { TYPE_NAMES, TYPE_COLORS } from "@/lib/enneagramData";

const colorTokens = {
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/10", text: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/10", text: "text-blue-400", badge: "bg-blue-500/15 text-blue-400" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/10", text: "text-rose-400", badge: "bg-rose-500/15 text-rose-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/10", text: "text-amber-400", badge: "bg-amber-500/15 text-amber-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/10", text: "text-purple-400", badge: "bg-purple-500/15 text-purple-400" },
  teal: { bg: "bg-teal-500/10", border: "border-teal-500/10", text: "text-teal-400", badge: "bg-teal-500/15 text-teal-400" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/10", text: "text-orange-400", badge: "bg-orange-500/15 text-orange-400" },
};

const scoreColorClasses = {
  emerald: "bg-emerald-500/15 text-emerald-400",
  blue: "bg-blue-500/15 text-blue-400",
  amber: "bg-amber-500/15 text-amber-400",
  rose: "bg-rose-500/15 text-rose-400",
};

export default function AIAnalysis({ result, scores, ranking, dominantDetail, autoGenerate = false }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const generatedRef = useRef(false);

  const generateAnalysis = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const rankingSummary = ranking.map((r, i) =>
        `${i + 1}º Tipo ${r.type} (${TYPE_NAMES[r.type]}): ${r.percentage}%`
      ).join("\n");

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em Eneagrama, desenvolvimento humano e análise comportamental aplicada ao mundo corporativo.

Analise os resultados REAIS do teste de Eneagrama abaixo e gere 4 análises completas.

DADOS DO PARTICIPANTE:
- Nome: ${result.participant_name}
- Tipo Dominante: ${result.dominant_type} — ${result.dominant_type_name}
- Asa: ${result.wing}w (${result.wing_name})
- Confiança: ${result.confidence_level}%

RANKING COMPLETO (9 tipos):
${rankingSummary}

PERFIL DO TIPO DOMINANTE:
- Motivação: ${dominantDetail?.motivation || "N/A"}
- Medos: ${dominantDetail?.fears || "N/A"}
- Forças: ${dominantDetail?.strengths || "N/A"}
- Fraquezas: ${dominantDetail?.weaknesses || "N/A"}
- Liderança: ${dominantDetail?.leadership || "N/A"}
- Comunicação: ${dominantDetail?.communication || "N/A"}
- Desenvolvimento: ${dominantDetail?.development || "N/A"}

---

## ANÁLISE 1: INSIGHTS AUTOMÁTICOS

Com base nas pontuações reais, identifique:

1. maior_forca: A maior força comportamental
2. segunda_forca: A segunda maior força comportamental
3. principal_risco: Principal risco comportamental
4. competencia_profissional: Principal competência profissional
5. limitacao_profissional: Principal limitação profissional
6. ambiente_ideal: Ambiente ideal de trabalho
7. ambiente_desgaste: Ambiente que gera maior desgaste

Para cada item: titulo (nome curto) e descricao (2-3 frases baseadas nos resultados REAIS).

---

## ANÁLISE 2: SCORE EXECUTIVO

Calcule um score de 0 a 100: 30% Liderança + 20% Visão Estratégica + 20% Execução + 15% Comunicação e Influência + 15% Inteligência Emocional.

Forneça: score, lideranca, visao_estrategica, execucao, comunicacao, inteligencia_emocional (notas 0-100), classificacao ("Emergente" 0-39, "Em Desenvolvimento" 40-59, "Gestor" 60-79, "Executivo" 80-89, "Alta Liderança Executiva" 90-100), interpretacao (parágrafo), potencial_lideranca e potencial_executivo ("Baixo", "Médio", "Alto" ou "Muito Alto").

---

## ANÁLISE 3: RANKING DE CARREIRA

Para cada carreira atribua nota 0-100: Empreendedor, Executivo, Gestor, Comercial, Marketing, Engenharia, Consultoria, Professor, Advogado, Analista, Desenvolvedor, Pesquisador, Recursos Humanos, Financeiro, Operações.

Ordene da maior para menor. Para os 5 primeiros, inclua "porque" (1-2 frases).

---

## ANÁLISE 4: PLANO DE AÇÃO

acoes_30, acoes_60, acoes_90: cada array com 3 ações (acao, porque, como_medir). Práticas, mensuráveis, personalizadas. NUNCA genéricas.

---

Retorne APENAS JSON válido (sem markdown).`,
        response_json_schema: {
          type: "object",
          properties: {
            insights: {
              type: "object",
              properties: {
                maior_forca: { type: "object", properties: { titulo: { type: "string" }, descricao: { type: "string" } }, required: ["titulo", "descricao"] },
                segunda_forca: { type: "object", properties: { titulo: { type: "string" }, descricao: { type: "string" } }, required: ["titulo", "descricao"] },
                principal_risco: { type: "object", properties: { titulo: { type: "string" }, descricao: { type: "string" } }, required: ["titulo", "descricao"] },
                competencia_profissional: { type: "object", properties: { titulo: { type: "string" }, descricao: { type: "string" } }, required: ["titulo", "descricao"] },
                limitacao_profissional: { type: "object", properties: { titulo: { type: "string" }, descricao: { type: "string" } }, required: ["titulo", "descricao"] },
                ambiente_ideal: { type: "object", properties: { titulo: { type: "string" }, descricao: { type: "string" } }, required: ["titulo", "descricao"] },
                ambiente_desgaste: { type: "object", properties: { titulo: { type: "string" }, descricao: { type: "string" } }, required: ["titulo", "descricao"] }
              },
              required: ["maior_forca", "segunda_forca", "principal_risco", "competencia_profissional", "limitacao_profissional", "ambiente_ideal", "ambiente_desgaste"]
            },
            score_executivo: {
              type: "object",
              properties: {
                score: { type: "number" }, lideranca: { type: "number" }, visao_estrategica: { type: "number" }, execucao: { type: "number" },
                comunicacao: { type: "number" }, inteligencia_emocional: { type: "number" }, classificacao: { type: "string" },
                interpretacao: { type: "string" }, potencial_lideranca: { type: "string" }, potencial_executivo: { type: "string" }
              },
              required: ["score", "lideranca", "visao_estrategica", "execucao", "comunicacao", "inteligencia_emocional", "classificacao", "interpretacao", "potencial_lideranca", "potencial_executivo"]
            },
            ranking_carreira: {
              type: "array",
              items: { type: "object", properties: { carreira: { type: "string" }, nota: { type: "number" }, porque: { type: "string" } }, required: ["carreira", "nota"] }
            },
            plano_acao: {
              type: "object",
              properties: {
                acoes_30: { type: "array", items: { type: "object", properties: { acao: { type: "string" }, porque: { type: "string" }, como_medir: { type: "string" } }, required: ["acao", "porque", "como_medir"] } },
                acoes_60: { type: "array", items: { type: "object", properties: { acao: { type: "string" }, porque: { type: "string" }, como_medir: { type: "string" } }, required: ["acao", "porque", "como_medir"] } },
                acoes_90: { type: "array", items: { type: "object", properties: { acao: { type: "string" }, porque: { type: "string" }, como_medir: { type: "string" } }, required: ["acao", "porque", "como_medir"] } }
              },
              required: ["acoes_30", "acoes_60", "acoes_90"]
            }
          },
          required: ["insights", "score_executivo", "ranking_carreira", "plano_acao"]
        },
        model: "gpt_5_mini"
      });

      setAnalysis(response.data);
    } catch (err) {
      setError("Erro ao gerar análises. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoGenerate && !generatedRef.current) {
      generatedRef.current = true;
      generateAnalysis();
    }
  }, [autoGenerate]);

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-12 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
        <p className="text-sm font-medium text-foreground">Gerando análises com IA...</p>
        <p className="text-xs text-muted-foreground mt-1">Analisando perfil de {result.participant_name}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" size="sm" className="mt-4" onClick={generateAnalysis}>Tentar novamente</Button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Brain className="w-7 h-7 text-primary" />
        </div>
        <h3 className="font-heading text-lg font-semibold text-foreground">Análises Avançadas com IA</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Gere insights comportamentais, score executivo, ranking de carreira e um plano de ação personalizado baseado nos resultados reais do seu teste.
        </p>
        <Button onClick={generateAnalysis} size="lg" className="mt-6 gap-2 rounded-xl">
          <Sparkles className="w-4 h-4" /> Gerar Análises
        </Button>
      </div>
    );
  }

  const { insights, score_executivo, ranking_carreira, plano_acao } = analysis;
  const se = score_executivo || {};

  const scoreColor = se.score >= 80 ? "emerald" : se.score >= 60 ? "blue" : se.score >= 40 ? "amber" : "rose";
  const scoreStrokeColor = se.score >= 80 ? "hsl(160, 60%, 50%)" : se.score >= 60 ? "hsl(252, 70%, 62%)" : se.score >= 40 ? "hsl(42, 85%, 55%)" : "hsl(0, 70%, 55%)";

  const insightItems = [
    { key: "maior_forca", label: "Maior Força", icon: Star, color: "emerald" },
    { key: "segunda_forca", label: "2ª Força", icon: TrendingUp, color: "blue" },
    { key: "principal_risco", label: "Principal Risco", icon: AlertTriangle, color: "rose" },
    { key: "competencia_profissional", label: "Competência Profissional", icon: Target, color: "purple" },
    { key: "limitacao_profissional", label: "Limitação Profissional", icon: Shield, color: "amber" },
    { key: "ambiente_ideal", label: "Ambiente Ideal", icon: Sparkles, color: "teal" },
    { key: "ambiente_desgaste", label: "Ambiente Desgaste", icon: AlertTriangle, color: "orange" },
  ];

  const scorePillars = [
    { label: "Liderança", value: se.lideranca, weight: "30%" },
    { label: "Visão Estratégica", value: se.visao_estrategica, weight: "20%" },
    { label: "Execução", value: se.execucao, weight: "20%" },
    { label: "Comunicação", value: se.comunicacao, weight: "15%" },
    { label: "Int. Emocional", value: se.inteligencia_emocional, weight: "15%" },
  ];

  const actionPeriods = [
    { period: "30 dias", actions: plano_acao?.acoes_30 || [], color: "emerald" },
    { period: "60 dias", actions: plano_acao?.acoes_60 || [], color: "blue" },
    { period: "90 dias", actions: plano_acao?.acoes_90 || [], color: "purple" },
  ];

  return (
    <div className="space-y-6">
      {/* Insights Automáticos */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Lightbulb className="w-4 h-4 text-purple-400" />
          </div>
          <h2 className="font-heading text-base font-semibold text-foreground">Insights Comportamentais</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {insightItems.map(item => {
            const data = insights?.[item.key];
            const tc = colorTokens[item.color];
            if (!data) return null;
            return (
              <div key={item.key} className={`p-4 rounded-xl bg-white/[0.03] border ${tc.border}`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <item.icon className={`w-3.5 h-3.5 ${tc.text}`} />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{item.label}</span>
                </div>
                <p className="text-sm font-semibold text-foreground mb-1">{data.titulo}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{data.descricao}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Score Executivo */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <h2 className="font-heading text-base font-semibold text-foreground">Score Executivo</h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
          <div className="shrink-0 relative w-32 h-32 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke={scoreStrokeColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${(se.score / 100) * 327} 327`} />
            </svg>
            <div className="text-center">
              <p className="text-3xl font-bold text-foreground">{se.score}</p>
              <p className="text-[10px] text-muted-foreground">/100</p>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <span className={`inline-flex text-xs font-bold px-3 py-1 rounded-full ${scoreColorClasses[scoreColor]}`}>
              {se.classificacao}
            </span>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{se.interpretacao}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {scorePillars.map(p => (
            <div key={p.label} className="text-center">
              <p className="text-lg font-bold text-foreground">{p.value}</p>
              <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: `${p.value}%` }} />
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">{p.label}</p>
              <p className="text-[9px] text-muted-foreground/60">{p.weight}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
            <span className="text-xs text-muted-foreground">Potencial para Liderança</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColorClasses[se.potencial_lideranca === "Muito Alto" ? "emerald" : se.potencial_lideranca === "Alto" ? "blue" : se.potencial_lideranca === "Médio" ? "amber" : "rose"]}`}>
              {se.potencial_lideranca}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03]">
            <span className="text-xs text-muted-foreground">Potencial para Cargos Executivos</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreColorClasses[se.potencial_executivo === "Muito Alto" ? "emerald" : se.potencial_executivo === "Alto" ? "blue" : se.potencial_executivo === "Médio" ? "amber" : "rose"]}`}>
              {se.potencial_executivo}
            </span>
          </div>
        </div>
      </div>

      {/* Ranking de Carreira */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="font-heading text-base font-semibold text-foreground">Ranking de Carreira</h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(ranking_carreira || []).slice(0, 15).map((c, i) => (
            <div key={c.carreira} className={`p-3 rounded-xl border ${i < 5 ? "bg-white/[0.04] border-white/10" : "bg-white/[0.02] border-border/50"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">{i + 1}</span>
                  <span className="text-xs font-medium text-foreground">{c.carreira}</span>
                </div>
                <span className={`text-xs font-bold ${c.nota >= 80 ? "text-emerald-400" : c.nota >= 60 ? "text-blue-400" : c.nota >= 40 ? "text-amber-400" : "text-rose-400"}`}>{c.nota}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full bg-primary" style={{ width: `${c.nota}%` }} />
              </div>
              {c.porque && <p className="text-[10px] text-muted-foreground leading-relaxed mt-1.5">{c.porque}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Plano de Ação */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>
          <h2 className="font-heading text-base font-semibold text-foreground">Plano de Ação Personalizado</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          {actionPeriods.map(period => {
            const tc = colorTokens[period.color];
            return (
              <div key={period.period} className={`p-4 rounded-xl ${tc.bg} ${tc.border} border`}>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tc.badge}`}>Próximos {period.period}</span>
                <div className="mt-3 space-y-3">
                  {period.actions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className={`w-5 h-5 rounded-full ${tc.bg} flex items-center justify-center text-[10px] font-bold ${tc.text} shrink-0 mt-0.5`}>{i + 1}</span>
                      <div>
                        <p className="text-xs font-medium text-foreground">{a.acao}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.porque}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic">📏 {a.como_medir}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}