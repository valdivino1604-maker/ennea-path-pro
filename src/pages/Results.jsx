import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Brain, Clock, FileDown, GitBranch, Radar, Share2, Star, Target, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import BasicView from "@/components/results/BasicView";
import { TYPE_COLORS, TYPE_DETAILS, TYPE_NAMES } from "@/lib/enneagramData";
import { getResult } from "@/lib/cloudStore";

function safeParse(value) {
  try {
    return JSON.parse(value || "{}");
  } catch {
    return {};
  }
}

function normalizeRanking(scores) {
  if (Array.isArray(scores.ranking) && scores.ranking.length) {
    return scores.ranking.map((item) => ({
      type: Number(item.type),
      name: item.name || TYPE_NAMES[Number(item.type)] || `Tipo ${item.type}`,
      score: Number(item.score ?? item.value ?? 0),
      percentage: Number(item.percentage ?? item.percent ?? 0)
    })).sort((a, b) => b.percentage - a.percentage || b.score - a.score);
  }

  const rawScores = scores.scores || {};
  const percentages = scores.percentages || {};
  return Object.keys(TYPE_NAMES).map((type) => ({
    type: Number(type),
    name: TYPE_NAMES[Number(type)],
    score: Number(rawScores[type] || 0),
    percentage: Number(percentages[type] || 0)
  })).sort((a, b) => b.percentage - a.percentage || b.score - a.score);
}

function clarityLabel(value) {
  const score = Number(value) || 0;
  if (score < 40) return { label: "Baixa", text: "Tipos proximos; interpretar com cautela.", className: "text-red-300 bg-red-500/10 border-red-500/20" };
  if (score < 65) return { label: "Moderada", text: "Tendencia utilizavel, mas nao absoluta.", className: "text-amber-300 bg-amber-500/10 border-amber-500/20" };
  return { label: "Alta", text: "Tipo dominante bem destacado.", className: "text-emerald-300 bg-emerald-500/10 border-emerald-500/20" };
}

function associatedRole(index) {
  if (index === 0) return "Principal";
  if (index === 1) return "Associado forte";
  if (index === 2) return "Associado complementar";
  if (index === 3) return "Influência secundária";
  return "Traço residual";
}

function interpretationFor(index) {
  if (index === 0) return "Define o padrão central de motivação, reação e tomada de decisão.";
  if (index === 1) return "Pode aparecer em pressão, trabalho ou decisões importantes.";
  if (index === 2) return "Complementa o perfil principal e ajuda a explicar nuances do comportamento.";
  if (index === 3) return "Aparece em situações específicas, mas não deve ser lido como perfil central.";
  return "Influência menor; serve apenas como sinal de apoio na leitura geral.";
}

export default function Results() {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResult(resultId)
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Resultado nao encontrado.</p>
        <Link to="/">
          <Button variant="ghost" className="mt-4">Voltar ao inicio</Button>
        </Link>
      </div>
    );
  }

  const scores = safeParse(result.scores);
  const ranking = normalizeRanking(scores);
  const dominantType = Number(result.dominant_type);
  const dominantDetail = TYPE_DETAILS[dominantType];
  const duration = result.duration_seconds || 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const clarity = clarityLabel(result.confidence_level);
  const topAssociated = ranking.filter((item) => item.type !== dominantType).slice(0, 4);
  const mainPercentage = ranking.find((item) => item.type === dominantType)?.percentage || result.confidence_level || 0;
  const secondPercentage = topAssociated[0]?.percentage || 0;
  const distance = Math.max(0, Math.round(mainPercentage - secondPercentage));

  const handleShare = () => {
    const shareData = {
      title: `Resultado Eneagrama - ${result.dominant_type_name}`,
      text: `Resultado: Tipo ${dominantType} - ${result.dominant_type_name}.`,
      url: window.location.href
    };

    if (navigator.share) navigator.share(shareData);
    else navigator.clipboard.writeText(window.location.href);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Inicio
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="text-7xl shrink-0">{dominantDetail?.emoji}</div>
            <div className="text-center lg:text-left flex-1">
              <p className="text-sm text-muted-foreground">Resultado ultra completo do teste</p>
              <h1 className="font-display text-2xl sm:text-4xl font-bold text-foreground mt-1">
                Tipo {dominantType} - {result.dominant_type_name}
              </h1>
              <p className="text-muted-foreground text-sm mt-2 max-w-3xl">{dominantDetail?.subtitle} • {dominantDetail?.motivation}</p>
              {result.recalculated && (
                <p className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 inline-block">
                  Resultado recalculado com a nova regra de desempate. {result.result_note || scores.resultNote || "Analise tambem o ranking completo."}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-4 justify-center lg:justify-start">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border ${clarity.className}`}>
                  <Trophy className="w-4 h-4" /> Clareza {clarity.label} ({result.confidence_level}%)
                </span>
                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-sm font-medium">
                  <Star className="w-4 h-4" /> Asa {result.dominant_type}w{result.wing}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-sm font-medium">
                  <GitBranch className="w-4 h-4" /> Distancia para 2º: {distance} pts
                </span>
                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-sm font-medium">
                  <Clock className="w-4 h-4" /> {minutes}m {seconds}s
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" /> Compartilhar
              </Button>
              <Button size="sm" className="gap-2 rounded-xl" onClick={() => window.print()}>
                <FileDown className="w-4 h-4" /> PDF
              </Button>
            </div>
          </div>
        </motion.div>

        <UltraProfileDashboard
          ranking={ranking}
          dominantType={dominantType}
          dominantDetail={dominantDetail}
          clarity={clarity}
          topAssociated={topAssociated}
        />

        <BasicView result={result} dominantDetail={dominantDetail} ranking={ranking} scores={scores} />
      </div>
    </div>
  );
}

function UltraProfileDashboard({ ranking, dominantType, dominantDetail, clarity, topAssociated }) {
  const maxPercentage = Math.max(...ranking.map((item) => item.percentage), 1);
  const topFive = ranking.slice(0, 5);

  return (
    <div className="space-y-6 mb-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><BarChart3 className="w-4 h-4 text-primary" /></div>
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">Gráfico dos 9 perfis</h2>
              <p className="text-xs text-muted-foreground">Distribuição completa de aderência por tipo.</p>
            </div>
          </div>
          <div className="space-y-3">
            {ranking.map((item) => {
              const isMain = item.type === dominantType;
              const width = Math.max(6, Math.round((item.percentage / maxPercentage) * 100));
              return (
                <div key={item.type}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-7 h-7 rounded-lg text-[11px] font-bold text-white flex items-center justify-center shrink-0" style={{ backgroundColor: TYPE_COLORS[item.type] || "#6366f1" }}>T{item.type}</span>
                      <span className={`text-sm truncate ${isMain ? "font-bold text-foreground" : "text-muted-foreground"}`}>{item.name}</span>
                    </div>
                    <span className={`text-xs font-bold ${isMain ? "text-primary" : "text-muted-foreground"}`}>{item.percentage}%</span>
                  </div>
                  <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${width}%`, backgroundColor: TYPE_COLORS[item.type] || "#6366f1" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center"><Radar className="w-4 h-4 text-purple-300" /></div>
            <div>
              <h2 className="font-heading text-base font-semibold text-foreground">Mapa central</h2>
              <p className="text-xs text-muted-foreground">Leitura gerencial do perfil.</p>
            </div>
          </div>
          <div className="space-y-3">
            <MapLine label="Perfil principal" value={`Tipo ${dominantType} - ${TYPE_NAMES[dominantType]}`} />
            <MapLine label="Clareza" value={`${clarity.label} - ${clarity.text}`} />
            <MapLine label="Motivação" value={dominantDetail?.motivation || "—"} />
            <MapLine label="Medo central" value={dominantDetail?.fears || "—"} />
            <MapLine label="Estilo de liderança" value={dominantDetail?.leadership || "—"} />
          </div>
        </section>
      </div>

      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center"><Users className="w-4 h-4 text-blue-300" /></div>
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">Mapa de perfis associados abaixo do principal</h2>
            <p className="text-xs text-muted-foreground">Mostra os tipos que mais influenciam o comportamento além do tipo dominante.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {topAssociated.map((item, index) => {
            const detail = TYPE_DETAILS[item.type];
            return (
              <div key={item.type} className="rounded-2xl border border-border bg-background/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-9 h-9 rounded-xl text-sm font-bold text-white flex items-center justify-center shrink-0" style={{ backgroundColor: TYPE_COLORS[item.type] || "#6366f1" }}>T{item.type}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{item.name}</p>
                      <p className="text-[10px] text-primary font-bold">{associatedRole(index + 1)}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">{item.percentage}%</span>
                </div>
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.max(5, item.percentage)}%`, backgroundColor: TYPE_COLORS[item.type] || "#6366f1" }} />
                </div>
                <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">{interpretationFor(index + 1)}</p>
                <p className="text-[11px] text-foreground/80 mt-2 leading-relaxed">{detail?.leadership || detail?.description || "—"}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Brain className="w-4 h-4 text-emerald-300" /></div>
          <div>
            <h2 className="font-heading text-base font-semibold text-foreground">Síntese executiva do perfil composto</h2>
            <p className="text-xs text-muted-foreground">Como ler o conjunto: principal + associados.</p>
          </div>
        </div>
        <div className="grid lg:grid-cols-3 gap-4">
          <ExecutiveCard icon={Target} title="Núcleo dominante" text={`O Tipo ${dominantType} é o eixo central. Ele explica a motivação principal, a forma de reagir sob pressão e o estilo mais provável de liderança.`} />
          <ExecutiveCard icon={GitBranch} title="Perfis associados" text={`Os tipos ${topFive.map((item) => `T${item.type}`).join(", ")} formam o mapa comportamental ampliado. Quanto mais próximos do principal, maior a influência na prática.`} />
          <ExecutiveCard icon={Trophy} title="Uso gerencial" text="Use o resultado para desenvolvimento, alocação, comunicação e liderança. Não use como sentença fixa; perfis próximos indicam nuances importantes." />
        </div>
      </section>
    </div>
  );
}

function MapLine({ label, value }) {
  return (
    <div className="border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">{label}</p>
      <p className="text-xs text-foreground mt-1 leading-relaxed">{value}</p>
    </div>
  );
}

function ExecutiveCard({ icon: Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}
