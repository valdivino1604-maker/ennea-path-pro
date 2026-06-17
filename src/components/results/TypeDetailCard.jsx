import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Target, AlertTriangle, Zap, Shield, MessageCircle, Heart, TrendingUp, Lightbulb, Star } from "lucide-react";

const sections = [
  { key: "motivation", label: "Motivação Principal", icon: Target },
  { key: "fears", label: "Medos Principais", icon: AlertTriangle },
  { key: "strengths", label: "Forças", icon: Zap },
  { key: "weaknesses", label: "Fraquezas", icon: Shield },
  { key: "leadership", label: "Estilo de Liderança", icon: Star },
  { key: "communication", label: "Comunicação", icon: MessageCircle },
  { key: "relationships", label: "Relacionamentos", icon: Heart },
  { key: "development", label: "Desenvolvimento Pessoal", icon: TrendingUp },
];

export default function TypeDetailCard({ typeNum, detail, percentage, isDominant }) {
  const [expanded, setExpanded] = useState(isDominant);

  return (
    <div className={`rounded-2xl border-2 transition-all ${isDominant ? "border-primary bg-primary/5" : "border-border bg-card"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{detail.emoji}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-foreground">Tipo {typeNum} — {detail.name}</span>
              {isDominant && (
                <span className="text-[10px] font-bold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">DOMINANTE</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{detail.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-primary">{percentage}%</span>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{detail.description}</p>

              <div className="grid sm:grid-cols-2 gap-3">
                {sections.map(s => (
                  <div key={s.key} className="p-3 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-2 mb-1.5">
                      <s.icon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs font-semibold text-foreground">{s.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{detail[s.key]}</p>
                  </div>
                ))}
              </div>

              {detail.recommendations && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Recomendações</span>
                  </div>
                  <ul className="space-y-1.5">
                    {detail.recommendations.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}