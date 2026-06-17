import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowLeft, Users, Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { TYPE_NAMES, TYPE_COLORS, getCompatibility, getCompatibilityLabel } from "@/lib/enneagramData";

export default function TeamMapping() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    base44.entities.TestResult.filter({ completed: true }, '-created_date', 500).then(r => {
      const latest = {};
      r.forEach(item => {
        if (!latest[item.participant_email] || new Date(item.created_date) > new Date(latest[item.participant_email].created_date)) {
          latest[item.participant_email] = item;
        }
      });
      setResults(Object.values(latest));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    if (!search) return results;
    const q = search.toLowerCase();
    return results.filter(r => r.participant_name?.toLowerCase().includes(q) || r.participant_email?.toLowerCase().includes(q));
  }, [results, search]);

  const toggleSelect = (r) => {
    setSelected(p => p.find(s => s.id === r.id) ? p.filter(s => s.id !== r.id) : [...p, r]);
  };

  const teamTypes = useMemo(() => {
    const counts = {};
    selected.forEach(r => {
      const t = r.dominant_type;
      if (!counts[t]) counts[t] = { type: t, count: 0, members: [] };
      counts[t].count++;
      counts[t].members.push(r.participant_name);
    });
    return Object.values(counts).sort((a, b) => b.count - a.count);
  }, [selected]);

  const compatPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < selected.length; i++) {
      for (let j = i + 1; j < selected.length; j++) {
        const score = getCompatibility(selected[i].dominant_type, selected[j].dominant_type);
        pairs.push({ a: selected[i], b: selected[j], score });
      }
    }
    return pairs.sort((a, b) => b.score - a.score);
  }, [selected]);

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

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Mapeamento de Equipes</h1>
            <p className="text-sm text-muted-foreground">Visualize a composição e compatibilidade da sua equipe.</p>
          </div>
        </div>

        {/* Select Members */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar membro da equipe..." className="h-9 bg-background border-border flex-1" value={search} onChange={e => setSearch(e.target.value)} />
            {selected.length > 0 && <span className="text-xs text-primary font-medium">{selected.length} selecionados</span>}
          </div>

          {/* Selected tags */}
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selected.map(s => (
                <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: TYPE_COLORS[s.dominant_type] }}>
                  {s.participant_name}
                  <button onClick={() => toggleSelect(s)}><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
          )}

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {filtered.map(r => {
              const isSelected = selected.find(s => s.id === r.id);
              return (
                <button
                  key={r.id}
                  onClick={() => toggleSelect(r)}
                  className={`flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isSelected ? "bg-white/[0.06] border border-white/10" : "bg-white/[0.02] border border-border/50 hover:border-white/10"
                  }`}
                >
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ backgroundColor: TYPE_COLORS[r.dominant_type] }}>
                    T{r.dominant_type}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.participant_name}</p>
                    <p className="text-[11px] text-muted-foreground">{r.participant_company || TYPE_NAMES[r.dominant_type]}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selected.length > 0 && (
          <>
            {/* Team Composition */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-6">
              <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Composição da Equipe ({selected.length} membros)</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {teamTypes.map(t => (
                  <div key={t.type} className="p-4 rounded-xl border border-border/50 bg-white/[0.02]">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: TYPE_COLORS[t.type] }}>T{t.type}</span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{TYPE_NAMES[t.type]}</p>
                        <p className="text-[11px] text-muted-foreground">{t.count} membro{t.count > 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {t.members.slice(0, 3).map((m, i) => (
                        <span key={i} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full truncate max-w-[120px]">{m}</span>
                      ))}
                      {t.members.length > 3 && <span className="text-[10px] text-muted-foreground">+{t.members.length - 3}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compatibility Matrix */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Matriz de Compatibilidade</h2>
              <div className="space-y-2">
                {compatPairs.slice(0, 15).map((pair, i) => {
                  const { label, color, bg } = getCompatibilityLabel(pair.score);
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-border/50">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{pair.a.participant_name}</span>
                        <span className="text-[10px] text-muted-foreground">↔</span>
                        <span className="text-xs font-medium text-foreground truncate max-w-[120px]">{pair.b.participant_name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pair.score}%`, backgroundColor: pair.score >= 80 ? "#10b981" : pair.score >= 65 ? "#3b82f6" : pair.score >= 50 ? "#f59e0b" : "#ef4444" }} />
                        </div>
                        <span className={`text-xs font-bold ${color}`}>{pair.score}%</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${color} ${bg}`}>{label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}