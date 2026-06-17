import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, History, Calendar, Clock, TrendingUp, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { TYPE_NAMES, TYPE_COLORS } from "@/lib/enneagramData";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";

export default function BehavioralHistory() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState("");

  useEffect(() => {
    base44.entities.TestResult.filter({ completed: true }, '-created_date', 500).then(r => {
      setResults(r);
      setLoading(false);
    });
  }, []);

  const participants = useMemo(() => {
    const map = {};
    results.forEach(r => {
      if (!map[r.participant_email]) map[r.participant_email] = { name: r.participant_name, email: r.participant_email, count: 0 };
      map[r.participant_email].count++;
    });
    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [results]);

  const personHistory = useMemo(() => {
    return results.filter(r => r.participant_email === selectedEmail).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
  }, [results, selectedEmail]);

  const evolutionData = useMemo(() => {
    return personHistory.map((r, i) => {
      try {
        const scores = JSON.parse(r.scores || "{}");
        return {
          test: `Teste ${i + 1}`,
          date: new Date(r.created_date).toLocaleDateString("pt-BR"),
          dominantType: r.dominant_type,
          ...Object.fromEntries(Object.entries(scores.percentages || {}).map(([k, v]) => [`T${k}`, v]))
        };
      } catch { return null; }
    }).filter(Boolean);
  }, [personHistory]);

  const currentType = personHistory.length > 0 ? personHistory[0].dominant_type : null;
  const hasMultiple = personHistory.length > 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10">
        <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <History className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Histórico Comportamental</h1>
            <p className="text-sm text-muted-foreground">Acompanhe a evolução comportamental ao longo do tempo.</p>
          </div>
        </div>

        {/* Participant Selection */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Selecionar Participante</label>
          <Select value={selectedEmail} onValueChange={setSelectedEmail}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Escolha um participante..." />
            </SelectTrigger>
            <SelectContent>
              {participants.map(p => (
                <SelectItem key={p.email} value={p.email}>
                  {p.name} ({p.count} teste{p.count > 1 ? 's' : ''})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {personHistory.length > 0 && (
          <>
            {/* Summary */}
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-[11px] text-muted-foreground">Total de Testes</p>
                <p className="text-2xl font-bold text-foreground mt-1">{personHistory.length}</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-[11px] text-muted-foreground">Tipo Atual</p>
                <p className="text-2xl font-bold text-foreground mt-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: TYPE_COLORS[personHistory[personHistory.length - 1].dominant_type] }}>
                    T{personHistory[personHistory.length - 1].dominant_type}
                  </span>
                  {personHistory[personHistory.length - 1].dominant_type_name}
                </p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-[11px] text-muted-foreground">Período</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {new Date(personHistory[0].created_date).toLocaleDateString("pt-BR")} — {new Date(personHistory[personHistory.length - 1].created_date).toLocaleDateString("pt-BR")}
                </p>
              </div>
            </div>

            {/* Evolution Chart */}
            {hasMultiple && evolutionData.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5 mb-6">
                <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Evolução dos Tipos</h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={evolutionData}>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <XAxis dataKey="test" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                      <Tooltip
                        content={({ payload, label }) => {
                          if (!payload || !payload.length) return null;
                          return (
                            <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
                              <p className="text-xs font-semibold text-foreground">{label}</p>
                              {payload.map((p, i) => (
                                <p key={i} className="text-[11px]" style={{ color: p.color }}>{p.name}: {p.value}%</p>
                              ))}
                            </div>
                          );
                        }}
                      />
                      {[1,2,3,4,5,6,7,8,9].map(t => (
                        <Line key={t} type="monotone" dataKey={`T${t}`} stroke={TYPE_COLORS[t]} strokeWidth={t === (personHistory[personHistory.length - 1]?.dominant_type) ? 2.5 : 1} dot={false} strokeDasharray={t === (personHistory[personHistory.length - 1]?.dominant_type) ? "" : "4 4"} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Linha do Tempo</h3>
              <div className="relative pl-6 border-l-2 border-border space-y-6">
                {personHistory.map((r, i) => (
                  <div key={r.id} className="relative">
                    <div className="absolute -left-[29px] w-4 h-4 rounded-full border-2 border-border bg-card" style={{ borderColor: TYPE_COLORS[r.dominant_type] }} />
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ backgroundColor: TYPE_COLORS[r.dominant_type] }}>
                            T{r.dominant_type} — {r.dominant_type_name}
                          </span>
                          {i === 0 && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Mais antigo</span>}
                          {i === personHistory.length - 1 && <span className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded">Mais recente</span>}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(r.created_date).toLocaleDateString("pt-BR")}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {Math.floor((r.duration_seconds || 0) / 60)}min</span>
                          <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {r.confidence_level}% confiança</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Asa: T{r.wing} — {r.wing_name}</p>
                      </div>
                      <Link to={`/results/${r.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary">
                          Ver <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {!selectedEmail && (
          <div className="text-center py-20 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Selecione um participante para visualizar o histórico</p>
          </div>
        )}
      </div>
    </div>
  );
}