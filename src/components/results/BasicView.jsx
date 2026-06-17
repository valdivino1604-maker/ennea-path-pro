import React from "react";
import { Zap, AlertTriangle, Lightbulb, Target, Briefcase, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ProfessionalAptitude from "@/components/results/ProfessionalAptitude";

const colorTokens = {
  emerald: { bg: "bg-emerald-500/5", border: "border-emerald-500/30", text: "text-emerald-400" },
  rose: { bg: "bg-rose-500/5", border: "border-rose-500/30", text: "text-rose-400" },
  purple: { bg: "bg-purple-500/5", border: "border-purple-500/30", text: "text-purple-400" },
  blue: { bg: "bg-blue-500/5", border: "border-blue-500/30", text: "text-blue-400" },
  amber: { bg: "bg-amber-500/5", border: "border-amber-500/30", text: "text-amber-400" },
};

export default function BasicView({ result, dominantDetail, ranking, scores }) {
  const dominantType = result.dominant_type;
  const strengthsList = dominantDetail?.strengths?.split(/[,.]/).filter(Boolean).map(s => s.trim()).filter(s => s.length > 2) || [];
  const challengesList = dominantDetail?.weaknesses?.split(/[,.]/).filter(Boolean).map(s => s.trim()).filter(s => s.length > 2) || [];
  const recommendations = dominantDetail?.recommendations || [];

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Resumo da Personalidade</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{dominantDetail?.description}</p>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid sm:grid-cols-2 gap-4">
        <CardSection title="5 Pontos Fortes" icon={Zap} items={strengthsList.slice(0, 5)} color="emerald" />
        <CardSection title="5 Pontos de Atenção" icon={AlertTriangle} items={challengesList.slice(0, 5)} color="rose" />
      </div>

      {/* Basic Indicators */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Indicadores Básicos</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Liderança", icon: Target, text: dominantDetail?.leadership || "—", color: "emerald" },
            { label: "Empreendedorismo", icon: Briefcase, text: dominantDetail?.strengths?.split(",")[0]?.trim() || "—", color: "blue" },
            { label: "Inteligência Emocional", icon: Lightbulb, text: dominantDetail?.communication || "—", color: "purple" },
            { label: "Comunicação e Influência", icon: Zap, text: dominantDetail?.communication || "—", color: "amber" },
          ].map(ind => {
            const tc = colorTokens[ind.color];
            return (
              <div key={ind.label} className={`p-3 rounded-xl ${tc.bg} ${tc.border} border`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ind.icon className={`w-3.5 h-3.5 ${tc.text}`} />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{ind.label}</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{ind.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Professional Aptitude (Basic) */}
      <ProfessionalAptitude dominantType={dominantType} dominantDetail={dominantDetail} ranking={ranking} isPremium={false} />

      {/* Mini PDI */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Mini Plano de Desenvolvimento</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {(recommendations.slice(0, 3)).map((rec, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-border/50">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary mb-2">{i + 1}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upsell Card */}
      <div className="bg-gradient-to-br from-primary/10 via-purple-500/10 to-amber-500/10 border border-primary/20 rounded-2xl p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <h3 className="font-heading text-lg font-bold text-foreground">Desbloqueie o Plano Premium</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
          Acesse análise executiva completa, ranking de carreira, score executivo, compatibilidade entre perfis e plano de desenvolvimento de 90 dias.
        </p>
        <Button size="lg" className="mt-5 gap-2 rounded-xl bg-primary hover:bg-primary/90">
          Fazer Upgrade <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function CardSection({ title, icon: Icon, items, color }) {
  const tc = colorTokens[color];
  return (
    <div className={`border rounded-2xl p-4 ${tc.bg} ${tc.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${tc.text}`} />
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
            <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${tc.text}`} style={{ backgroundColor: "currentColor" }} />
            {item}
          </li>
        ))}
        {items.length === 0 && <p className="text-[11px] text-muted-foreground/50 italic">—</p>}
      </ul>
    </div>
  );
}