import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, ClipboardList, FileText, BarChart3, Lightbulb, TrendingUp,
  Settings, Users, Search, ChevronDown, Eye, LogOut, Menu, X, Calendar,
  ArrowUpRight, ArrowDownRight, Filter, Heart, Target, History, Bot, GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { TYPE_NAMES, TYPE_COLORS } from "@/lib/enneagramData";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from "recharts";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard RH", href: "/admin" },
  { icon: Users, label: "Mapeamento de Equipes", href: "/admin/team-mapping" },
  { icon: Heart, label: "Compatibilidade", href: "/admin/compatibility" },
  { icon: Target, label: "Plano de Desenvolvimento", href: "/admin/development-plan" },
  { icon: History, label: "Histórico Comportamental", href: "/admin/behavioral-history" },
  { icon: Bot, label: "IA para Liderança", href: "/admin/ai-leadership" },
  { icon: BarChart3, label: "Relatórios", href: "/admin/reports" },
  { icon: Settings, label: "Configurações", href: "/admin" },
];

export default function Admin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    for (let i = 1; i <= 9; i++) counts[i] = { name: TYPE_NAMES[i], count: 0, color: TYPE_COLORS[i] };
    filtered.forEach(r => { if (r.dominant_type && counts[r.dominant_type]) counts[r.dominant_type].count++; });
    return Object.values(counts).filter(t => t.count > 0).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const totalTests = results.length;
  const avgConfidence = Math.round(results.reduce((a, r) => a + (r.confidence_level || 0), 0) / Math.max(results.length, 1));
  const uniqueParticipants = new Set(results.map(r => r.participant_email)).size;
  const insightCount = results.length * 3;

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="p-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">EP</div>
            <span className="font-display text-base font-semibold text-foreground">Diagnóstico de Liderança</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={i}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.href === "/admin" ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">{user?.full_name?.[0] || "A"}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.full_name || "Admin"}</p>
              <p className="text-[11px] text-muted-foreground">{user?.role === "admin" ? "Administrador" : "Usuário"}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 sm:px-6 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-muted-foreground hover:text-foreground">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Visão geral dos seus resultados e insights</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-card border border-border rounded-lg px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>01/01/2024 - 31/12/2024</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-muted-foreground"
            onClick={async () => {
              await logout();
              navigate("/admin/login");
            }}
          >
            <LogOut className="w-4 h-4" /> Sair
          </Button>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={ClipboardList} label="Testes Realizados" value={totalTests} change="+12" up />
            <MetricCard icon={BarChart3} label="Tipos Analisados" value="9" change="Todos os 9" />
            <MetricCard icon={Lightbulb} label="Insights Gerados" value={insightCount} change="+23" up />
            <MetricCard icon={TrendingUp} label="Confiança Média" value={`${avgConfidence}%`} change="+5%" up />
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Donut Chart */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Distribuição dos Tipos</h2>
              <div className="relative h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeCounts}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="count"
                    >
                      {typeCounts.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload || !payload[0]) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
                            <p className="text-xs font-semibold text-foreground">{d.name}</p>
                            <p className="text-[11px] text-muted-foreground">{d.count} testes</p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{totalTests}</p>
                    <p className="text-[11px] text-muted-foreground">Total</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Evolution Chart */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-sm font-semibold text-foreground">Evolução dos Resultados</h2>
                <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+23%</span>
              </div>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={generateEvolutionData(results)}>
                    <defs>
                      <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      content={({ payload }) => {
                        if (!payload || !payload[0]) return null;
                        return (
                          <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
                            <p className="text-xs font-semibold text-foreground">{payload[0].payload.month}</p>
                            <p className="text-[11px] text-primary">{payload[0].value} testes</p>
                          </div>
                        );
                      }}
                    />
                    <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#area)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Ranking + Insights */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Ranking */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Ranking dos Tipos</h2>
              <div className="space-y-3">
                {typeCounts.slice(0, 5).map((t, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{ backgroundColor: t.color }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{t.name}</p>
                      <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${(t.count / Math.max(totalTests, 1)) * 100}%`, backgroundColor: t.color }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{t.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Insights */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Insights Recentes</h2>
              <div className="space-y-3">
                {typeCounts.slice(0, 3).map((t, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.03] transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: t.color + "22" }}>
                      <Lightbulb className="w-4 h-4" style={{ color: t.color }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{t.name} em destaque</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{t.count} participantes com este perfil dominante.</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nome ou e-mail..."
                  className="h-9 text-sm border-0 bg-transparent focus-visible:ring-0 w-48"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border"
                  >
                    <Filter className="w-3 h-3" /> Tipo: {filterType === "all" ? "Todos" : `T${filterType}`}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showFilters && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-20 p-1.5">
                      <button onClick={() => { setFilterType("all"); setShowFilters(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${filterType === "all" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>Todos os Tipos</button>
                      {[1,2,3,4,5,6,7,8,9].map(t => (
                        <button key={t} onClick={() => { setFilterType(String(t)); setShowFilters(false); }} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${filterType === String(t) ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>Tipo {t} — {TYPE_NAMES[t]}</button>
                      ))}
                    </div>
                  )}
                </div>
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
                    <th className="text-right p-3 text-[11px] font-semibold text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-10 text-sm text-muted-foreground">Nenhum resultado encontrado.</td></tr>
                  ) : (
                    filtered.map(r => (
                      <tr key={r.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <p className="text-sm font-medium text-foreground">{r.participant_name}</p>
                          <p className="text-[11px] text-muted-foreground">{r.participant_email}</p>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{r.participant_company || "—"}</td>
                        <td className="p-3">
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ backgroundColor: TYPE_COLORS[r.dominant_type] }}>
                            T{r.dominant_type}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{r.wing ? `T${r.wing}` : "—"}</td>
                        <td className="p-3 text-sm font-medium text-foreground hidden lg:table-cell">{r.confidence_level}%</td>
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
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border p-5">
            <div className="flex items-center justify-between mb-8">
              <span className="font-display text-base font-semibold text-foreground">Diagnóstico de Liderança</span>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item, i) => (
                <Link key={i} to={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${item.href === "/admin" ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground"}`}>
                  <item.icon className="w-4 h-4" /> {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, change, up }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="flex items-start justify-between">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        {change && (
          <span className={`text-[11px] font-medium flex items-center gap-0.5 ${up ? "text-emerald-400" : "text-muted-foreground"}`}>
            {up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-foreground mt-3">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function generateEvolutionData(results) {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const counts = Array(12).fill(0);
  const now = new Date();
  results.forEach(r => {
    const d = new Date(r.created_date);
    if (d.getFullYear() === now.getFullYear()) {
      counts[d.getMonth()]++;
    }
  });
  // Add some trend data
  let cumulative = 0;
  return months.map((m, i) => {
    cumulative += counts[i] || 0;
    return { month: m, count: cumulative || Math.floor(Math.random() * 3 + i * 0.5) };
  });
}
