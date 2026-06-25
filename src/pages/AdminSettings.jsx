import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Bot, ClipboardCheck, Download, Heart, History, LayoutDashboard, LogOut, Settings, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard RH", href: "/admin" },
  { icon: Users, label: "Mapeamento de Equipes", href: "/admin/team-mapping" },
  { icon: Heart, label: "Compatibilidade", href: "/admin/compatibility" },
  { icon: Target, label: "Plano de Desenvolvimento", href: "/admin/development-plan" },
  { icon: History, label: "Historico Comportamental", href: "/admin/behavioral-history" },
  { icon: Bot, label: "IA para Lideranca", href: "/admin/ai-leadership" },
  { icon: ClipboardCheck, label: "Avaliacao de Desempenho", href: "/admin/performance-review" },
  { icon: BarChart3, label: "Relatorios", href: "/admin/reports" },
  { icon: Settings, label: "Configuracoes", href: "/admin/settings" }
];

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex flex-col w-60 bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="p-5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">EP</div>
            <span className="font-display text-base font-semibold text-foreground">Diagnostico de Lideranca</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} to={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${item.href === "/admin/settings" ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"}`}>
              <item.icon className="w-4 h-4" /> {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <p className="text-sm font-medium text-foreground truncate">{user?.full_name || "Admin"}</p>
          <p className="text-[11px] text-muted-foreground">{user?.role || "master"}</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/admin"><Button variant="ghost" size="sm" className="gap-2 text-muted-foreground"><ArrowLeft className="w-4 h-4" /> Voltar</Button></Link>
          <div className="flex-1">
            <h1 className="font-display text-xl font-bold text-foreground">Configuracoes</h1>
            <p className="text-xs text-muted-foreground">Painel de controle e melhorias administrativas do sistema</p>
          </div>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground" onClick={async () => { await logout(); navigate("/admin/login"); }}><LogOut className="w-4 h-4" /> Sair</Button>
        </header>

        <div className="p-4 sm:p-6 space-y-6">
          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">Status do sistema</h2>
            <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <Status label="Dashboard" value="Operacional" />
              <Status label="Filtro por empresa" value="Ativo" />
              <Status label="Editar nome/empresa" value="Ativo" />
              <Status label="Editar funcao/cargo" value="Ativo" />
              <Status label="Excluir candidato" value="Ativo" />
              <Status label="Exportacao CSV" value="Ativo" />
              <Status label="Filtro por data" value="Ativo" />
              <Status label="Historico de alteracoes" value="Ativo local" />
              <Status label="Relatorio individual PDF" value="Ativo" />
              <Status label="Avaliacao de desempenho" value="Ativo D1" />
              <Status label="9-box e PDI" value="Ativo D1" />
              <Status label="IA de grupo" value="Ativo" />
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">Modulos gerenciais</h2>
            <p className="text-xs text-muted-foreground mt-1">Acesse os recursos principais do sistema.</p>
            <div className="mt-5 grid lg:grid-cols-2 gap-3">
              <Module title="Avaliação de Desempenho" text="Competências, metas, potencial, 9-box, feedback e PDI salvos no banco D1." href="/admin/performance-review" icon={ClipboardCheck} />
              <Module title="Exportar CSV" text="Exporte resultados filtrados por empresa, tipo, cargo e data pelo Dashboard." href="/admin" icon={Download} />
              <Module title="IA de Análise de Grupo" text="Leitura gerencial de distribuição de tipos, riscos, ausências e recomendações." href="/admin/ai-leadership" icon={Bot} />
              <Module title="Relatórios" text="Painel de relatórios e indicadores do sistema." href="/admin/reports" icon={BarChart3} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Status({ label, value }) {
  const active = value === "Ativo" || value === "Operacional" || value === "Ativo D1" || value === "Ativo local";
  return <div className="rounded-xl border border-border bg-background/40 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className={`text-sm font-semibold mt-1 ${active ? "text-emerald-300" : "text-amber-300"}`}>{value}</p></div>;
}

function Module({ title, text, href, icon: Icon }) {
  return <Link to={href} className="border border-border rounded-xl p-4 bg-background/40 hover:bg-white/[0.04] transition-colors"><div className="flex items-center gap-2"><Icon className="w-4 h-4 text-primary" /><h3 className="text-sm font-semibold text-foreground">{title}</h3></div><p className="text-xs text-muted-foreground mt-2 leading-relaxed">{text}</p></Link>;
}
