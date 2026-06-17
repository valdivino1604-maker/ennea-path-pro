import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users, Search, Heart, ArrowRightLeft, Zap, AlertTriangle, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { TYPE_NAMES, TYPE_COLORS, getCompatibility, getCompatibilityLabel } from "@/lib/enneagramData";

const RELATIONSHIP_TIPS = {
  "80-100": "Alta sinergia natural. Comunicação fluida e compreensão mútua instintiva. Ótima parceria para projetos criativos e de longo prazo.",
  "65-79": "Boa compatibilidade. Respeito mútuo com desafios complementares. O crescimento acontece através das diferenças que se complementam.",
  "50-64": "Compatibilidade moderada. Exige comunicação consciente e esforço para entender perspectivas diferentes. Potencial de aprendizado mútuo significativo.",
  "0-49": "Relação desafiadora. Visões de mundo muito distintas. Requer paciência, escuta ativa e disposição para negociar diferenças fundamentais."
};

export default function Compatibility() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [personA, setPersonA] = useState("");
  const [personB, setPersonB] = useState("");
  const [searchA, setSearchA] = useState("");
  const [searchB, setSearchB] = useState("");

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

  const personAData = results.find(r => r.id === personA);
  const personBData = results.find(r => r.id === personB);

  const compat = useMemo(() => {
    if (!personAData || !personBData) return null;
    const score = getCompatibility(personAData.dominant_type, personBData.dominant_type);
    const labelData = getCompatibilityLabel(score);
    let tipKey = "0-49";
    if (score >= 80) tipKey = "80-100";
    else if (score >= 65) tipKey = "65-79";
    else if (score >= 50) tipKey = "50-64";
    return { score, ...labelData, tip: RELATIONSHIP_TIPS[tipKey] };
  }, [personAData, personBData]);

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
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Compatibilidade entre Perfis</h1>
            <p className="text-sm text-muted-foreground">Analise a sinergia entre dois perfis do Eneagrama.</p>
          </div>
        </div>

        {/* Selection */}
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pessoa A</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-9 mb-2 bg-background text-sm" value={searchA} onChange={e => setSearchA(e.target.value)} />
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {results.filter(r => !searchA || r.participant_name?.toLowerCase().includes(searchA.toLowerCase())).slice(0, 20).map(r => (
                <button
                  key={r.id}
                  onClick={() => { setPersonA(r.id); setSearchA(""); }}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${personA === r.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-white/[0.03] text-muted-foreground"}`}
                >
                  <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: TYPE_COLORS[r.dominant_type] }}>T{r.dominant_type}</span>
                  {r.participant_name}
                </button>
              ))}
            </div>
            {personAData && (
              <div className="mt-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                <p className="text-sm font-semibold text-foreground">{personAData.participant_name}</p>
                <p className="text-[11px] text-muted-foreground">Tipo {personAData.dominant_type} — {TYPE_NAMES[personAData.dominant_type]}</p>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pessoa B</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input placeholder="Buscar..." className="pl-9 mb-2 bg-background text-sm" value={searchB} onChange={e => setSearchB(e.target.value)} />
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {results.filter(r => !searchB || r.participant_name?.toLowerCase().includes(searchB.toLowerCase())).slice(0, 20).map(r => (
                <button
                  key={r.id}
                  onClick={() => { setPersonB(r.id); setSearchB(""); }}
                  className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition-colors ${personB === r.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-white/[0.03] text-muted-foreground"}`}
                >
                  <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: TYPE_COLORS[r.dominant_type] }}>T{r.dominant_type}</span>
                  {r.participant_name}
                </button>
              ))}
            </div>
            {personBData && (
              <div className="mt-3 p-3 rounded-xl border border-primary/20 bg-primary/5">
                <p className="text-sm font-semibold text-foreground">{personBData.participant_name}</p>
                <p className="text-[11px] text-muted-foreground">Tipo {personBData.dominant_type} — {TYPE_NAMES[personBData.dominant_type]}</p>
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {compat && (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center gap-4 mb-4">
                <span className="text-4xl">{personAData && TYPE_NAMES[personAData.dominant_type]?.split(" ")[1] || "?"}</span>
                <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
                <span className="text-4xl">{personBData && TYPE_NAMES[personBData.dominant_type]?.split(" ")[1] || "?"}</span>
              </div>
              <div className="inline-flex items-center gap-2 mb-2">
                <span className={`text-sm font-bold ${compat.color} ${compat.bg} px-3 py-1 rounded-full`}>{compat.label}</span>
              </div>
              <div className="text-5xl font-bold text-foreground mt-2">{compat.score}%</div>
              <p className="text-sm text-muted-foreground mt-1">Índice de Compatibilidade</p>
            </div>

            <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-6">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${compat.score}%`, background: `linear-gradient(90deg, ${compat.score >= 65 ? "#10b981" : compat.score >= 50 ? "#3b82f6" : "#ef4444"}, ${compat.score >= 65 ? "#3b82f6" : "#f59e0b"})` }} />
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-border/50">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-primary mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{compat.tip}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 mb-2">
                  <Zap className="w-3 h-3" /> Pontos Fortes
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A combinação T{personAData?.dominant_type} + T{personBData?.dominant_type} traz {compat.score >= 65 ? "excelente complementaridade" : "oportunidades de aprendizado"} em projetos onde {compat.score >= 65 ? "ambos os estilos se complementam naturalmente" : "a diversidade de perspectivas enriquece o resultado"}.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                <h4 className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-400 mb-2">
                  <AlertTriangle className="w-3 h-3" /> Atenção
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {compat.score >= 65 ? "Evitem cair na zona de conforto e busquem desafios externos para crescerem juntos." : "Invistam em comunicação clara e não assumam que o outro entende suas motivações implicitamente."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}