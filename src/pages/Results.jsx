import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Trophy, Star, Clock, Share2, LayoutDashboard, FileText, BarChart3, TrendingUp as TrendingUpIcon, Sparkles, Crown, Download, FileDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { TYPE_DETAILS, TYPE_NAMES, TYPE_COLORS, CAREER_DATA } from "@/lib/enneagramData";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from "recharts";
import BasicView from "@/components/results/BasicView";
import AIAnalysis from "@/components/results/AIAnalysis";
import ProfessionalAptitude from "@/components/results/ProfessionalAptitude";

const ADMIN_ID = "6a31ede4977440ad85d90422"; // Valdivino

export default function Results() {
  const { resultId } = useParams();
  const { user, isAuthenticated, isLoadingAuth, authChecked } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notAuthorized, setNotAuthorized] = useState(false);

  useEffect(() => {
    base44.entities.TestResult.filter({ id: resultId }).then(r => {
      if (r.length > 0) setResult(r[0]);
      setLoading(false);
    });
  }, [resultId]);

  // Check authorization when both result and auth are ready
  useEffect(() => {
    if (!authChecked) return;
    if (!isAuthenticated) {
      setNotAuthorized(true);
      return;
    }
    if (result && user) {
      const isAdmin = user.id === ADMIN_ID;
      const isOwnResult = user.email?.toLowerCase() === result.participant_email?.toLowerCase();
      setNotAuthorized(!isAdmin && !isOwnResult);
    }
  }, [result, authChecked, isAuthenticated, user]);

  if (loading || isLoadingAuth || !authChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (notAuthorized || !result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">{!result ? "Resultado não encontrado." : "Acesso restrito. Você não tem permissão para ver este resultado."}</p>
        <Link to="/"><Button variant="ghost" className="mt-4">Voltar ao início</Button></Link>
      </div>
    );
  }

  const scores = JSON.parse(result.scores || "{}");
  const percentages = scores.percentages || {};
  const ranking = scores.ranking || [];
  const dominantType = result.dominant_type;
  const dominantDetail = TYPE_DETAILS[dominantType];
  const duration = result.duration_seconds || 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const plan = result.plan || "basico";

  const radarData = Object.entries(percentages).map(([type, value]) => ({
    type: `T${type}`,
    fullName: TYPE_NAMES[parseInt(type)],
    value
  }));

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Meu resultado Eneagrama - ${result.dominant_type_name}`,
        text: `Descobri que meu tipo dominante é Tipo ${dominantType} — ${result.dominant_type_name}!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDownloadPDF = async () => {
    const careerD = CAREER_DATA[dominantType];
    const strengthsList = dominantDetail?.strengths?.split(/[,.]/).filter(Boolean).map(s => s.trim()).filter(s => s.length > 2) || [];
    const challengesList = dominantDetail?.weaknesses?.split(/[,.]/).filter(Boolean).map(s => s.trim()).filter(s => s.length > 2) || [];

    try {
      const response = await base44.functions.invoke('generateResultsPDF', {
        participantName: result.participant_name,
        participantEmail: result.participant_email,
        participantCompany: result.participant_company,
        participantRole: result.participant_role,
        dominantType, dominantTypeName: result.dominant_type_name,
        wing: result.wing, wingName: result.wing_name,
        confidence: result.confidence_level,
        scores, ranking,
        strengths: strengthsList,
        weaknesses: challengesList,
        recommendations: dominantDetail?.recommendations || [],
        description: dominantDetail?.description,
        motivation: dominantDetail?.motivation,
        fears: dominantDetail?.fears,
        leadership: dominantDetail?.leadership,
        communication: dominantDetail?.communication,
        development: dominantDetail?.development,
        careerData: careerD?.topCareers || [],
        environment: careerD?.environment,
        avoid: careerD?.avoid,
        skills: careerD?.skills,
        growth: careerD?.growth
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeName = (result.participant_name || 'resultado').replace(/\s+/g, '-').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      a.download = `diagnostico-${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        {/* Hero Result */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-6xl shrink-0">{dominantDetail?.emoji}</div>
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <p className="text-sm text-muted-foreground">Resultado do Teste</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan === "premium" ? "bg-amber-500/15 text-amber-400" : "bg-muted text-muted-foreground"}`}>
                  {plan === "premium" ? <><Crown className="w-3 h-3 inline mr-0.5" /> Premium</> : "Básico"}
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
                Tipo {dominantType} — {result.dominant_type_name}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">{dominantDetail?.subtitle}</p>
              <div className="flex flex-wrap items-center gap-3 mt-4 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary px-3 py-1.5 rounded-lg text-sm font-bold">
                  <Trophy className="w-4 h-4" /> {result.confidence_level}% Aderência
                </span>
                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-sm font-medium">
                  <Star className="w-4 h-4" /> {result.dominant_type}w{result.wing}
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
              <Button size="sm" className="gap-2 rounded-xl" onClick={handleDownloadPDF}>
                <FileDown className="w-4 h-4" /> PDF
              </Button>
            </div>
          </div>
        </motion.div>

        {plan === "basico" ? (
          <BasicView result={result} dominantDetail={dominantDetail} ranking={ranking} scores={scores} />
        ) : (
          /* PREMIUM PLAN */
          <Tabs defaultValue="overview" className="mb-6">
            <div className="border-b border-border mb-6">
              <TabsList className="bg-transparent h-auto p-0 gap-0 space-x-0">
                {[
                  { value: "overview", label: "Visão Geral", icon: LayoutDashboard },
                  { value: "analysis", label: "Análise Detalhada", icon: FileText },
                  { value: "ai", label: "Análises com IA", icon: Sparkles },
                  { value: "evolution", label: "Evolução", icon: TrendingUpIcon }
                ].map(tab => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none px-4 py-2.5 text-xs font-medium text-muted-foreground data-[state=active]:text-primary bg-transparent border-b-2 border-transparent"
                  >
                    <tab.icon className="w-3.5 h-3.5 mr-1.5" /> {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Perfil de Personalidade</h3>
                    <div className="h-[320px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="type" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }} />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                          <Tooltip
                            content={({ payload }) => {
                              if (!payload || !payload[0]) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
                                  <p className="text-xs font-semibold text-foreground">{d.fullName}</p>
                                  <p className="text-[11px] text-primary font-medium">{d.value}%</p>
                                </div>
                              );
                            }}
                          />
                          <Radar name="Pontuação" dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Sobre o Tipo {dominantType}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{dominantDetail?.description}</p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-4">
                    <CardList title="Forças" icon={Trophy} items={(dominantDetail?.strengths?.split(/[,.]/).filter(Boolean).map(s => s.trim()).filter(s => s.length > 2) || [])} color="emerald" />
                    <CardList title="Desafios" icon={Trophy} items={(dominantDetail?.weaknesses?.split(/[,.]/).filter(Boolean).map(s => s.trim()).filter(s => s.length > 2) || [])} color="rose" />
                    <CardList title="Recomendações" icon={Trophy} items={dominantDetail?.recommendations || []} color="purple" />
                  </div>

                  <ProfessionalAptitude dominantType={dominantType} dominantDetail={dominantDetail} ranking={ranking} isPremium={true} />

                  <AIAnalysis result={result} scores={scores} ranking={ranking} dominantDetail={dominantDetail} autoGenerate={true} />
                </div>

                <div className="space-y-6">
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Ranking dos Tipos</h3>
                    <div className="space-y-3">
                      {ranking.map((r, i) => (
                        <div key={r.type} className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: TYPE_COLORS[r.type] }}>{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-medium text-foreground truncate">Tipo {r.type}</p>
                              <span className="text-xs font-bold text-muted-foreground">{r.percentage}%</span>
                            </div>
                            <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all" style={{ width: `${r.percentage}%`, backgroundColor: TYPE_COLORS[r.type] }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-5">
                    <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Participante</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Nome</span><span className="font-medium text-foreground">{result.participant_name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">E-mail</span><span className="font-medium text-foreground">{result.participant_email}</span></div>
                      {result.participant_company && <div className="flex justify-between"><span className="text-muted-foreground">Empresa</span><span className="font-medium text-foreground">{result.participant_company}</span></div>}
                      {result.participant_role && <div className="flex justify-between"><span className="text-muted-foreground">Cargo</span><span className="font-medium text-foreground">{result.participant_role}</span></div>}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis">
              <div className="space-y-4">
                {ranking.map(r => (
                  <TypeAnalysisSection
                    key={r.type}
                    typeNum={r.type}
                    detail={TYPE_DETAILS[r.type]}
                    percentage={r.percentage}
                    isDominant={r.type === dominantType}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ai">
              <AIAnalysis result={result} scores={scores} ranking={ranking} dominantDetail={dominantDetail} autoGenerate={true} />
            </TabsContent>

            <TabsContent value="evolution">
              <div className="bg-card border border-border rounded-2xl p-8 text-center">
                <TrendingUpIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-heading text-lg font-semibold text-foreground">Acompanhamento de Evolução</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                  Realize novos testes periodicamente para comparar sua evolução ao longo do tempo e acompanhar seu desenvolvimento pessoal.
                </p>
                <Link to="/register">
                  <Button className="mt-6 gap-2 rounded-xl">Novo Teste</Button>
                </Link>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

function CardList({ title, icon: Icon, items, color }) {
  const colorMap = {
    emerald: "border-emerald-500/30 bg-emerald-500/5",
    rose: "border-rose-500/30 bg-rose-500/5",
    purple: "border-purple-500/30 bg-purple-500/5",
  };
  const iconMap = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    purple: "text-purple-400",
  };
  return (
    <div className={`border rounded-2xl p-4 ${colorMap[color] || ""}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconMap[color] || ""}`} />
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      </div>
      <ul className="space-y-1.5">
        {items.slice(0, 6).map((item, i) => (
          <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
            <span className={`mt-1 w-1 h-1 rounded-full shrink-0 ${iconMap[color] || ""}`} style={{ backgroundColor: "currentColor" }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TypeAnalysisSection({ typeNum, detail, percentage, isDominant }) {
  const [expanded, setExpanded] = useState(isDominant);
  const strengthsList = detail?.strengths?.split(/[,.]/).filter(Boolean).map(s => s.trim()).filter(s => s.length > 2) || [];
  const challengesList = detail?.weaknesses?.split(/[,.]/).filter(Boolean).map(s => s.trim()).filter(s => s.length > 2) || [];

  return (
    <div className={`bg-card border rounded-2xl transition-all ${isDominant ? "border-primary/50" : "border-border"}`}>
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center gap-3 text-left">
        <span className="text-xl">{detail?.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-heading text-sm font-bold text-foreground">Tipo {typeNum} — {detail?.name}</span>
            {isDominant && <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">DOMINANTE</span>}
          </div>
          <p className="text-[11px] text-muted-foreground">{detail?.subtitle}</p>
        </div>
        <span className="text-sm font-bold text-primary">{percentage}%</span>
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{detail?.description}</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { label: "Motivação", icon: Trophy, text: detail?.motivation },
              { label: "Medos", icon: Trophy, text: detail?.fears },
              { label: "Liderança", icon: Star, text: detail?.leadership },
              { label: "Comunicação", icon: Star, text: detail?.communication },
              { label: "Relacionamentos", icon: Star, text: detail?.relationships },
              { label: "Desenvolvimento", icon: Trophy, text: detail?.development },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl bg-white/[0.03] border border-border/50">
                <div className="flex items-center gap-1.5 mb-1">
                  <s.icon className="w-3 h-3 text-primary" />
                  <span className="text-[11px] font-semibold text-foreground">{s.label}</span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <CardListMini title="Forças" items={strengthsList} color="emerald" />
            <CardListMini title="Desafios" items={challengesList} color="rose" />
            <CardListMini title="Recomendações" items={detail?.recommendations || []} color="purple" />
          </div>
        </div>
      )}
    </div>
  );
}

function CardListMini({ title, items, color }) {
  const iconMap = { emerald: "text-emerald-400", rose: "text-rose-400", purple: "text-purple-400" };
  return (
    <div className="p-3 rounded-xl bg-white/[0.02] border border-border/50">
      <h5 className="text-[11px] font-semibold text-foreground mb-2">{title}</h5>
      <ul className="space-y-1">
        {items.slice(0, 4).map((item, i) => (
          <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
            <span className={`mt-0.5 w-1 h-1 rounded-full shrink-0 ${iconMap[color]}`} style={{ backgroundColor: "currentColor" }} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}