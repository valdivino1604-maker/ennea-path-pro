import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, Bot, Heart, History, LayoutDashboard, LogOut, Settings, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/AuthContext";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard RH", href: "/admin" },
  { icon: Users, label: "Mapeamento de Equipes", href: "/admin/team-mapping" },
  { icon: Heart, label: "Compatibilidade", href: "/admin/compatibility" },
  { icon: Target, label: "Plano de Desenvolvimento", href: "/admin/development-plan" },
  { icon: History, label: "Historico Comportamental", href: "/admin/behavioral-history" },
  { icon: Bot, label: "IA para Lideranca", href: "/admin/ai-leadership" },
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
              <Status label="Editar empresa" value="Ativo" />
              <Status label="Excluir candidato" value="Ativo" />
              <Status label="Coluna funcao/cargo" value="Ativo" />
              <Status label="Legenda de clareza" value="Ativo" />
              <Status label="Exportacao CSV" value="Pendente" />
              <Status label="Editar funcao" value="Pendente" />
            </div>
          </section>

          <section className="bg-card border border-border rounded-2xl p-5">
            <h2 className="font-heading text-base font-semibold text-foreground">Melhorias recomendadas</h2>
            <p className="text-xs text-muted-foreground mt-1">Prioridades para deixar o sistema mais forte para uso gerencial.</p>
            <div className="mt-5 grid lg:grid-cols-2 gap-3">
              <Improvement title="Padronizar empresas" text="Evitar nomes duplicados como Metal Vida, MetalVida e Metal vida." priority="Alta" />
              <Improvement title="Editar funcao/cargo" text="Permitir alterar o cargo do candidato pelo Admin." priority="Alta" />
              <Improvement title="Exportar Excel/CSV" text="Exportar resultados filtrados por empresa, tipo, cargo e data." priority="Alta" />
              <Improvement title="Relatorio individual em PDF" text="Gerar PDF com tipo, asa, pontos fortes, riscos e recomendacoes." priority="Alta" />
              <Improvement title="Filtro por data" text="Filtrar testes por semana, mes ou periodo personalizado." priority="Media" />
              <Improvement title="Historico de alteracoes" text="Registrar edicoes e exclusoes feitas no painel." priority="Media" />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function Status({ label, value }) {
  const active = value === "Ativo" || value === "Operacional";
  return <div className="rounded-xl border border-border bg-background/40 p-3"><p className="text-[11px] text-muted-foreground">{label}</p><p className={`text-sm font-semibold mt-1 ${active ? "text-emerald-300" : "text-amber-300"}`}>{value}</p></div>;
}

function Improvement({ title, text, priority }) {
  const color = priority === "Alta" ? "text-red-300 bg-red-500/10 border-red-500/20" : "text-amber-300 bg-amber-500/10 border-amber-500/20";
  return <div className="border border-border rounded-xl p-4 bg-background/40"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-foreground">{title}</h3><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${color}`}>{priority}</span></div><p className="text-xs text-muted-foreground mt-2 leading-relaxed">{text}</p></div>;
}
