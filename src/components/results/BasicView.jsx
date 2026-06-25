import React from "react";
import { Zap, AlertTriangle, Lightbulb, Target, Briefcase } from "lucide-react";
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
  const strengthsList = dominantDetail?.strengths?.split(/[,.]/).filter(Boolean).map((s) => s.trim()).filter((s) => s.length > 2) || [];
  const challengesList = dominantDetail?.weaknesses?.split(/[,.]/).filter(Boolean).map((s) => s.trim()).filter((s) => s.length > 2) || [];
  const recommendations = dominantDetail?.recommendations || [];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Resumo da Personalidade</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{dominantDetail?.description}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CardSection title="5 Pontos Fortes" icon={Zap} items={strengthsList.slice(0, 5)} color="emerald" />
        <CardSection title="5 Pontos de Atenção" icon={AlertTriangle} items={challengesList.slice(0, 5)} color="rose" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Indicadores Comportamentais</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Liderança", icon: Target, text: dominantDetail?.leadership || "—", color: "emerald" },
            { label: "Empreendedorismo", icon: Briefcase, text: dominantDetail?.strengths?.split(",")[0]?.trim() || "—", color: "blue" },
            { label: "Inteligência Emocional", icon: Lightbulb, text: dominantDetail?.communication || "—", color: "purple" },
            { label: "Comunicação e Influência", icon: Zap, text: dominantDetail?.communication || "—", color: "amber" },
          ].map((ind) => {
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

      <ProfessionalAptitude dominantType={dominantType} dominantDetail={dominantDetail} ranking={ranking} isPremium={true} />

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Plano de Desenvolvimento</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {recommendations.slice(0, 3).map((rec, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-border/50">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary mb-2">{i + 1}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
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
