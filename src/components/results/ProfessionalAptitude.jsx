import React from "react";
import { Briefcase, Building2, ThumbsDown, TrendingUp, Star, Zap, Target, Award, Lightbulb, ArrowUp } from "lucide-react";
import { CAREER_DATA, TYPE_NAMES } from "@/lib/enneagramData";

const colorTokens = {
  emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", badge: "bg-emerald-500/15 text-emerald-400" },
  blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", text: "text-blue-400", badge: "bg-blue-500/15 text-blue-400" },
  purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", text: "text-purple-400", badge: "bg-purple-500/15 text-purple-400" },
  amber: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-400", badge: "bg-amber-500/15 text-amber-400" },
  rose: { bg: "bg-rose-500/10", border: "border-rose-500/30", text: "text-rose-400", badge: "bg-rose-500/15 text-rose-400" },
  teal: { bg: "bg-teal-500/10", border: "border-teal-500/30", text: "text-teal-400", badge: "bg-teal-500/15 text-teal-400" },
  orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", text: "text-orange-400", badge: "bg-orange-500/15 text-orange-400" },
};

export default function ProfessionalAptitude({ dominantType, dominantDetail, ranking, isPremium = false }) {
  const careerData = CAREER_DATA[dominantType];
  if (!careerData) return null;

  const topCareers = careerData.topCareers.slice(0, isPremium ? 8 : 5);
  const secondaryTypes = ranking?.filter(r => r.type !== dominantType).slice(0, 2) || [];

  const getMatchColor = (match) => {
    if (match >= 95) return "emerald";
    if (match >= 90) return "blue";
    if (match >= 85) return "amber";
    return "purple";
  };

  return (
    <div className="space-y-6">
      {/* Top Careers Ranking */}
      <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-blue-400" />
          </div>
          <h2 className="font-heading text-base font-semibold text-foreground">Aptidão Profissional</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
          Com base no seu perfil <strong className="text-foreground">Tipo {dominantType} — {dominantDetail?.name}</strong>, 
          estas são as carreiras onde você tem maior probabilidade de se destacar e encontrar realização profissional.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          {topCareers.map((c, i) => {
            const mc = getMatchColor(c.match);
            const tc = colorTokens[mc];
            return (
              <div key={c.career} className={`p-4 rounded-xl bg-white/[0.04] border ${tc.border} ${i < 3 ? "border-l-2" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary shrink-0">{i + 1}</span>
                      <span className="text-sm font-semibold text-foreground truncate">{c.career}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{c.reason}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${tc.badge} shrink-0`}>{c.match}%</span>
                </div>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${c.match}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isPremium && (
        <>
          {/* Secondary Type Career Influence */}
          {secondaryTypes.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Star className="w-4 h-4 text-purple-400" />
                </div>
                <h2 className="font-heading text-base font-semibold text-foreground">Influência de Tipos Secundários</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Seus tipos secundários também influenciam sua aptidão profissional, ampliando seu leque de possibilidades:
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {secondaryTypes.map(st => {
                  const stCareer = CAREER_DATA[st.type];
                  const stDetail = dominantDetail ? null : null;
                  return (
                    <div key={st.type} className="p-3 rounded-xl bg-white/[0.02] border border-border/50">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-semibold text-foreground">{TYPE_NAMES[st.type]}</span>
                        <span className="text-[10px] text-primary font-bold">{st.percentage}%</span>
                      </div>
                      {stCareer && (
                        <div className="flex flex-wrap gap-1.5">
                          {stCareer.topCareers.slice(0, 3).map(c => (
                            <span key={c.career} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{c.career}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skills & Growth */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Habilidades Naturais</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {careerData.skills.map(skill => (
                  <span key={skill} className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-medium">{skill}</span>
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Alavanca de Crescimento</h3>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{careerData.growth}</p>
            </div>
          </div>

          {/* Environment Fit */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-card border border-emerald-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-foreground">Ambiente Ideal</h3>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{careerData.environment}</p>
            </div>
            <div className="bg-card border border-rose-500/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ThumbsDown className="w-4 h-4 text-rose-400" />
                <h3 className="text-sm font-semibold text-foreground">Ambientes a Evitar</h3>
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">{careerData.avoid}</p>
            </div>
          </div>

          {/* Career Growth Trajectory */}
          <div className="bg-card border border-border rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <ArrowUp className="w-4 h-4 text-amber-400" />
              </div>
              <h2 className="font-heading text-base font-semibold text-foreground">Trajetória de Crescimento</h2>
            </div>
            <div className="relative pl-6 border-l-2 border-primary/30 space-y-6">
              {[
                { phase: "Curto Prazo (0-6 meses)", items: [
                  `Foco nas habilidades de ${careerData.skills.slice(0, 2).join(" e ")}`,
                  `Busque posições que valorizem ${careerData.skills[0].toLowerCase()}`,
                  `Invista em certificações técnicas da sua área`
                ]},
                { phase: "Médio Prazo (6-18 meses)", items: [
                  `Assuma projetos que exijam ${careerData.skills[2] || "liderança"}`,
                  `Desenvolva networking estratégico no seu setor`,
                  `Busque mentoria com profissionais seniores`
                ]},
                { phase: "Longo Prazo (18+ meses)", items: [
                  `Consolide-se como referência em ${topCareers[0]?.career || "sua área"}`,
                  `Considere transição para liderança ou consultoria`,
                  `Amplie impacto através de ensino e mentoria`
                ]}
              ].map((phase, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[27px] w-3 h-3 rounded-full bg-primary border-2 border-card" />
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{phase.phase}</span>
                  <ul className="mt-2 space-y-1.5">
                    {phase.items.map((item, j) => (
                      <li key={j} className="text-[11px] text-muted-foreground flex items-start gap-2">
                        <Zap className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}