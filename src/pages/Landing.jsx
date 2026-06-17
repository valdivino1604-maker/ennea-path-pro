import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Brain, BarChart3, Users, Sparkles, Mail, Lock, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TYPE_COLORS } from "@/lib/enneagramData";
import { useAuth } from "@/lib/AuthContext";
import { base44 } from "@/api/base44Client";
import GoogleIcon from "@/components/GoogleIcon";

const types = [
  { n: 1, name: "Perfeccionista", emoji: "⚖️" },
  { n: 2, name: "Prestativo", emoji: "💝" },
  { n: 3, name: "Realizador", emoji: "🏆" },
  { n: 4, name: "Individualista", emoji: "🎨" },
  { n: 5, name: "Investigador", emoji: "🔬" },
  { n: 6, name: "Leal", emoji: "🛡️" },
  { n: 7, name: "Entusiasta", emoji: "🎉" },
  { n: 8, name: "Desafiador", emoji: "💪" },
  { n: 9, name: "Pacificador", emoji: "☮️" }
];

const benefits = [
  { icon: Brain, title: "Autoconhecimento Profundo", desc: "Descubra motivações, medos e padrões de comportamento enraizados." },
  { icon: BarChart3, title: "Análise Detalhada", desc: "Gráficos, rankings e recomendações personalizadas para seu crescimento." },
  { icon: Users, title: "Relações Aprimoradas", desc: "Entenda como você se conecta e melhore todas as suas relações." },
];

function LoginGate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,255,0.12),transparent_50%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-6 h-6 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Diagnóstico de Liderança</h1>
            <p className="mt-2 text-sm text-muted-foreground">Entre ou crie sua conta para continuar</p>
          </div>

          <Button
            variant="outline"
            className="w-full h-12 text-sm font-medium mb-5"
            onClick={handleGoogle}
          >
            <GoogleIcon className="w-5 h-5 mr-2" />
            Entrar com Google
          </Button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground">ou com e-mail</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs text-muted-foreground">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" autoComplete="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-10 h-11 bg-background" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-xs text-muted-foreground">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className="pl-10 h-11 bg-background" required />
              </div>
            </div>
            <Button type="submit" className="w-full h-12 font-medium" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Entrando...</> : "Entrar"}
            </Button>
          </form>
        </div>

        <p className="text-center mt-6 text-[11px] text-muted-foreground">
          Ao entrar, você concorda com nossos Termos de Uso e Política de Privacidade.
        </p>
      </motion.div>
    </div>
  );
}

const ADMIN_ID = "6a31ede4977440ad85d90422"; // Valdivino

export default function Landing() {
  const { user, isAuthenticated, isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginGate />;
  }

  // Admin goes straight to dashboard
  if (user?.id === ADMIN_ID) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(120,80,255,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(100,200,200,0.08),transparent_40%)]" />
        <div className="relative max-w-6xl mx-auto px-4 pt-20 pb-24 sm:pt-32 sm:pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/15 border border-primary/20 text-primary text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              Teste Profissional de Eneagrama
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground tracking-tight leading-tight">
              Diagnóstico de <span className="text-primary">Liderança e Equipes</span>
            </h1>
            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Descubra seu Perfil de Personalidade
            </p>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto mt-2">
              Uma análise profunda para autoconhecimento e desenvolvimento pessoal e profissional.
            </p>
            <div className="mt-10">
              <Link to="/register">
                <Button size="lg" className="text-base px-10 py-6 rounded-xl gap-2 font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all bg-primary hover:bg-primary/90">
                  Iniciar Teste <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              90 perguntas · ~15 minutos · Resultado instantâneo
            </p>
          </motion.div>
        </div>
      </section>

      {/* 9 Types Grid */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Os 9 Tipos do Eneagrama</h2>
            <p className="mt-3 text-muted-foreground">Cada tipo representa uma perspectiva única sobre o mundo.</p>
          </motion.div>
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-9 gap-3">
            {types.map((t, i) => (
              <motion.div
                key={t.n}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="flex flex-col items-center p-4 rounded-2xl bg-card border border-border hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-default"
              >
                <span className="text-2xl sm:text-3xl mb-2">{t.emoji}</span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-white" style={{ backgroundColor: TYPE_COLORS[t.n] }}>
                  Tipo {t.n}
                </span>
                <span className="text-[11px] text-muted-foreground text-center mt-1">{t.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Por que fazer o teste?</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {benefits.map((b, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border hover:border-white/10 transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-base font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Pronto para se descobrir?</h2>
            <p className="mt-4 text-muted-foreground">O teste leva aproximadamente 15 minutos. Ao final, você receberá uma análise completa do seu perfil.</p>
            <Link to="/register">
              <Button size="lg" className="mt-8 text-base px-10 py-6 rounded-xl gap-2 font-semibold shadow-lg shadow-primary/30">
                Começar Agora <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-display text-lg font-semibold text-foreground">Diagnóstico de Liderança e Equipes</p>
          <p className="mt-1 text-sm text-muted-foreground">Plataforma profissional de diagnóstico comportamental</p>
        </div>
      </footer>
    </div>
  );
}