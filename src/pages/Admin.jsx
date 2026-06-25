import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Clock,
  Eye,
  Filter,
  Heart,
  History,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  Search,
  Settings,
  Target,
  TrendingUp,
  UserRound,
  Users,
  X,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { TYPE_COLORS, TYPE_NAMES } from "@/lib/enneagramData";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard RH", href: "/admin" },
  { icon: Users, label: "Mapeamento de Equipes", href: "/admin/team-mapping" },
  { icon: Heart, label: "Compatibilidade", href: "/admin/compatibility" },
  { icon: Target, label: "Plano de Desenvolvimento", href: "/admin/development-plan" },
  { icon: History, label: "Histórico Comportamental", href: "/admin/behavioral-history" },
  { icon: Bot, label: "IA para Liderança", href: "/admin/ai-leadership" },
  { icon: BarChart3, label: "Relatórios", href: "/admin/reports" },
  { icon: Settings, label: "Configurações", href: "/admin" }
];

function matchesSearch(item, search, fields) {
  if (!search) return true;
  const needle = search.toLowerCase();
  return fields.some((field) => String(item?.[field] || "").toLowerCase().includes(needle));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR");
}

function hasMeaningfulAnswers(participant) {
  try {
    const answers = JSON.parse(participant?.answers || "{}");
    return Object.keys(answers).length > 0;
  } catch {
    return false;
  }
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [results, setResults] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.TestResult.filter({ completed: true }, "-created_date", 1000),
      base44.entities.TestParticipant.filter({}, "-created_date", 1000)
    ])
      .then(([resultRows, participantRows]) => {
        setResults(Array.isArray(resultRows) ? resultRows : []);
        setParticipants(Array.isArray(participantRows) ? participantRows : []);
      })
      .catch((err) => {
        setLoadError(err.message || "Nao foi possivel carregar os dados do painel.");
      })
      .finally(() => setLoading(false));
  }, []);

  const completedParticipantKeys = useMemo(() => {
    const keys = new Set();
    results.forEach((result) => {
      if (result.participant_id) keys.add(`id:${result.participant_id}`);
      if (result.participant_email) keys.add(`email:${String(result.participant_email).toLowerCase()}`);
    });
    return keys;
  }, [results]);

  const pendingParticipants = useMemo(() => {
    return participants.filter((participant) => {
      const byId = participant.id && completedParticipantKeys.has(`id:${participant.id}`);
      const byEmail = participant.email && completedParticipantKeys.has(`email:${String(participant.email).toLowerCase()}`);
      return !byId && !byEmail;
    });
  }, [participants, completedParticipantKeys]);

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      if (!matchesSearch(result, search, ["participant_name", "participant_email", "participant_company", "participant_role"])) return false;
      if (filterType !== "all" && result.dominant_type !== parseInt(filterType, 10)) return false;
      return true;
    });
  }, [results, search, filterType]);

  const filteredPending = useMemo(() => {
    return pendingParticipants.filter((participant) =>
      matchesSearch(participant, search, ["full_name", "email", "company", "role", "phone"])
    );
  }, [pendingParticipants, search]);

  const typeCounts = useMemo(() => {
    const counts = {};
    for (let i = 1; i <= 9; i++) counts[i] = { name: TYPE_NAMES[i], count: 0, color: TYPE_COLORS[i] };
    filteredResults.forEach((result) => {
      if (result.dominant_type && counts[result.dominant_type]) counts[result.dominant_type].count += 1;
    });
    return Object.values(counts).filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
  }, [filteredResults]);

  const avgConfidence = Math.round(
    results.reduce((total, result) => total + (Number(result.confidence_level) || 0), 0) / Math.max(results.length, 1)
  );

  if (loading) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex overflow-hidden">
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="p-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">EP</div>
            <span className="font-display text-base font-semibold text-foreground">Diagnóstico de Liderança</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
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
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
              {user?.full_name?.[0] || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.full_name || "Admin"}</p>
              <p className="text-[11px] text-muted-foreground">{user?.role || "master"}</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 sm:px-6 py-3 flex items-center gap-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden text-muted-foreground hover:text-foreground">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-lg font-bold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Resultados concluídos e candidatos cadastrados no banco</p>
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
          {loadError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">
              {loadError}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard icon={Users} label="Candidatos cadastrados" value={participants.length} />
            <MetricCard icon={ClipboardList} label="Testes concluídos" value={results.length} />
            <MetricCard icon={Clock} label="Sem resultado" value={pendingParticipants.length} />
            <MetricCard icon={TrendingUp} label="Confiança média" value={`${avgConfidence}%`} />
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, e-mail, empresa, cargo ou telefone..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value)}
                className="h-10 rounded-lg bg-background border border-border px-3 text-sm text-foreground"
              >
                <option value="all">Todos os tipos</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((type) => (
                  <option key={type} value={type}>Tipo {type} — {TYPE_NAMES[type]}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Distribuição dos tipos concluídos</h2>
              {typeCounts.length === 0 ? (
                <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">Nenhum resultado concluído no filtro atual.</div>
              ) : (
                <div className="relative h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={typeCounts} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="count">
                        {typeCounts.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip
                        content={({ payload }) => {
                          if (!payload || !payload[0]) return null;
                          const item = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-xl">
                              <p className="text-xs font-semibold text-foreground">{item.name}</p>
                              <p className="text-[11px] text-muted-foreground">{item.count} teste(s)</p>
                            </div>
                          );
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Resumo operacional</h2>
              <div className="space-y-3 text-sm">
                <SummaryLine label="Cadastrados no banco" value={participants.length} />
                <SummaryLine label="Com resultado concluído" value={results.length} />
                <SummaryLine label="Cadastrados sem resultado" value={pendingParticipants.length} />
                <SummaryLine label="Com teste iniciado e não finalizado" value={pendingParticipants.filter(hasMeaningfulAnswers).length} />
              </div>
              {pendingParticipants.length > 0 && (
                <p className="mt-4 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                  Estes candidatos estavam no banco, mas não apareciam porque ainda não tinham resultado concluído salvo.
                </p>
              )}
            </div>
          </div>

          <section className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-sm font-semibold text-foreground">Resultados concluídos</h2>
                <p className="text-xs text-muted-foreground">Candidatos que finalizaram o teste</p>
              </div>
              <span className="text-xs text-muted-foreground">{filteredResults.length} encontrado(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground">Participante</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground hidden sm:table-cell">Empresa</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground">Tipo</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground hidden md:table-cell">Confiança</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground hidden lg:table-cell">Data</th>
                    <th className="text-right p-3 text-[11px] font-semibold text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.length === 0 ? (
                    <tr><td colSpan={6} className="text-center p-10 text-sm text-muted-foreground">Nenhum resultado concluído encontrado.</td></tr>
                  ) : (
                    filteredResults.map((result) => (
                      <tr key={result.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                        <td className="p-3">
                          <p className="text-sm font-medium text-foreground">{result.participant_name || "Sem nome"}</p>
                          <p className="text-[11px] text-muted-foreground">{result.participant_email || "—"}</p>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{result.participant_company || "—"}</td>
                        <td className="p-3">
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ backgroundColor: TYPE_COLORS[result.dominant_type] || "#6366f1" }}>
                            T{result.dominant_type} — {TYPE_NAMES[result.dominant_type] || "—"}
                          </span>
                        </td>
                        <td className="p-3 text-sm font-medium text-foreground hidden md:table-cell">{result.confidence_level || 0}%</td>
                        <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">{formatDate(result.created_date)}</td>
                        <td className="p-3 text-right">
                          <Link to={`/results/${result.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:text-primary/80 text-xs"><Eye className="w-3 h-3" /> Ver</Button>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-sm font-semibold text-foreground">Candidatos cadastrados sem resultado</h2>
                <p className="text-xs text-muted-foreground">Pessoas que estão no banco, mas ainda não finalizaram o teste</p>
              </div>
              <span className="text-xs text-muted-foreground">{filteredPending.length} encontrado(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground">Candidato</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground hidden sm:table-cell">Empresa/Cargo</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground hidden md:table-cell">Telefone</th>
                    <th className="text-left p-3 text-[11px] font-semibold text-muted-foreground">Status</th>
                    <th className="text-right p-3 text-[11px] font-semibold text-muted-foreground">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-10 text-sm text-muted-foreground">Nenhum cadastro pendente encontrado.</td></tr>
                  ) : (
                    filteredPending.map((participant) => {
                      const started = hasMeaningfulAnswers(participant);
                      return (
                        <tr key={participant.id} className="border-b border-border/50 hover:bg-white/[0.02] transition-colors">
                          <td className="p-3">
                            <p className="text-sm font-medium text-foreground">{participant.full_name || "Sem nome"}</p>
                            <p className="text-[11px] text-muted-foreground">{participant.email || "—"}</p>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">
                            <p>{participant.company || "—"}</p>
                            <p className="text-[11px]">{participant.role || "—"}</p>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground hidden md:table-cell">{participant.phone || "—"}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${started ? "bg-amber-500/15 text-amber-300" : "bg-muted text-muted-foreground"}`}>
                              {started ? <Clock className="w-3 h-3" /> : <UserRound className="w-3 h-3" />}
                              {started ? "Iniciado" : "Só cadastrado"}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <Link to={`/test/${participant.id}`}>
                              <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary hover:text-primary/80 text-xs">
                                <CheckCircle2 className="w-3 h-3" /> Abrir teste
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border p-5">
            <div className="flex items-center justify-between mb-8">
              <span className="font-display text-base font-semibold text-foreground">Diagnóstico de Liderança</span>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <nav className="space-y-0.5">
              {NAV_ITEMS.map((item) => (
                <Link key={item.label} to={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${item.href === "/admin" ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground"}`}>
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

function MetricCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5">
      <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <p className="text-2xl font-bold text-foreground mt-3">{value}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}

function SummaryLine({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-border/50 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}
