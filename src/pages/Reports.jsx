import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Download, Eye, Search, Filter, BarChart3, Users, TrendingUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { TYPE_NAMES, TYPE_COLORS } from "@/lib/enneagramData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

export default function Reports() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    base44.entities.TestResult.filter({ completed: true }, '-created_date', 500).then(r => {
      setResults(r);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    return results.filter(r => {
      if (search && !r.participant_name?.toLowerCase().includes(search.toLowerCase()) && !r.participant_email?.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && r.dominant_type !== parseInt(filterType)) return false;
      return true;
    });
  }, [results, search, filterType]);

  const typeCounts = useMemo(() => {
    const counts = {};
    for (let i = 1; i <= 9; i++) counts[i] = { name: TYPE_NAMES[i], count: 0, color: TYPE_COLORS[i], type: i };
    filtered.forEach(r => { if (r.dominant_type && counts[r.dominant_type]) counts[r.dominant_type].count++; });
    return Object.values(counts).filter(t => t.count > 0).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const totalTests = results.length;
  const avgConfidence = Math.round(results.reduce((a, r) => a + (r.confidence_level || 0), 0) / Math.max(results.length, 1));
  const uniqueParticipants = new Set(results.map(r => r.participant_email)).size;

  const downloadResultsCSV = () => {
    const headers = ["Nome", "Email", "Empresa", "Cargo", "Tipo Dominante", "Asa", "Confiança (%)", "Duração (s)", "Data"];
    const rows = filtered.map(r => [
      r.participant_name || "",
      r.participant_email || "",
      r.participant_company || "",
      r.participant_role || "",
      `T${r.dominant_type} - ${r.dominant_type_name}`,
      `T${r.wing} - ${r.wing_name}`,
      r.confidence_level || 0,
      r.duration_seconds || 0,
      new Date(r.created_date).toLocaleDateString("pt-BR")
    ]);
    const csv = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-eneagrama-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-10">
        <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">Relatórios</h1>
              <p className="text-sm text-muted-foreground">Análises, exportações e visualizações consolidadas.</p>
            </div>
          </div>
          <Button onClick={downloadResultsCSV} variant="outline" className="gap-2 text-xs">
            <Download className="w-3.5 h-3.5" /> Exportar CSV
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KpiCard icon={FileText} label="Total de Testes" value={totalTests} color="primary" />
          <KpiCard icon={Users} label="Participantes Únicos" value={uniqueParticipants} color="emerald" />
          <KpiCard icon={TrendingUp} label="Confiança Média" value={`${avgConfidence}%`} color="amber" />
          <KpiCard icon={BarChart3} label="Tipos Identificados" value={typeCounts.length} color="violet" />
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Distribuição por Tipo</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeCounts} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="count" label={({ type, count }) => `T${type}`} labelLine={false}>
                    {typeCounts.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={({ payload }) => payload?.[0] ? (
                    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
                      <p className="text-xs font-semibold text-foreground">{payload[0].payload.name}</p>
                      <p className="text-[11px] text-muted-foreground">{payload[0].value} testes</p>
                    </div>
                  ) : null} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Ranking de Tipos</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeCounts} layout="vertical" margin={{ left: 60 }}>
                  <XAxis type="number" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--foreground))", fontSize: 11 }} width={100} />
                  <Tooltip content={({ payload }) => payload?.[0] ? (
                    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
                      <p className="text-xs font-semibold text-foreground">{payload[0].payload.name}</p>
                      <p className="text-[11px] text-muted-foreground">{payload[0].value} testes</p>
                    </div>
                  ) : null} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {typeCounts.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar nome ou e-mail..." className="h-9 text-sm border-0 bg-transparent focus-visible:ring-0 w-56" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="relative">
              <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border">
                <Filter className="w-3 h-3" /> Tipo: {filterType === "all" ? "Todos" : `T${filterType}`}
                <ChevronDown className="w-3 h-3" />
              </button>
              {showFilters && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-20 p-1.5">
                  <button onClick={() => { setFilterType("all"); setShowFilters(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${filterType === "all" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>Todos</button>
                  {[1,2,3,4,5,6,7,8,9].map(t => (
                    <button key={t} onClick={() => { setFilterType(String(t)); setShowFilters(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${filterType === String(t) ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>Tipo {t} — {TYPE_NAMES[t]}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground">Participante</th>
                  <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground hidden sm:table-cell">Empresa</th>
                  <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground">Tipo</th>
                  <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground hidden md:table-cell">Asa</th>
                  <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground hidden lg:table-cell">Confiança</th>
                  <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground hidden lg:table-cell">Duração</th>
                  <th className="text-right p-3 text-[11px] font-semibold text-muted-foreground">Ação</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-10 text-sm text-muted-foreground">Nenhum resultado encontrado.</td></tr>
                ) : (
                  filtered.map(r => (
                    <tr key={r.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                      <td className="p-3">
                        <p className="text-sm font-medium text-foreground">{r.participant_name}</p>
                        <p className="text-[11px] text-muted-foreground">{r.participant_email}</p>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{r.participant_company || "—"}</td>
                      <td className="p-3">
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ backgroundColor: TYPE_COLORS[r.dominant_type] }}>T{r.dominant_type}</span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{r.wing ? `T${r.wing}` : "—"}</td>
                      <td className="p-3 text-sm font-medium text-foreground hidden lg:table-cell">{r.confidence_level}%</td>
                      <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{Math.floor((r.duration_seconds || 0) / 60)}min</td>
                      <td className="p-3 text-right">
                        <Link to={`/results/${r.id}`}>
                          <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:text-primary/80 text-xs"><Eye className="w-3 h-3" /> Ver</Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t border-border text-center">
            <p className="text-[11px] text-muted-foreground">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, color }) {
  const colorMap = {
    primary: { bg: "bg-primary/10", text: "text-primary" },
    emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-400" },
    violet: { bg: "bg-violet-500/10", text: "text-violet-400" },
  };
  const c = colorMap[color] || colorMap.primary;
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${c.text}`} />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground mt-3">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}