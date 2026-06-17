import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, BarChart3, Brain, CheckCircle2, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TYPE_COLORS } from "@/lib/enneagramData";

const types = [
  { n: 1, name: "Perfeccionista" },
  { n: 2, name: "Prestativo" },
  { n: 3, name: "Realizador" },
  { n: 4, name: "Individualista" },
  { n: 5, name: "Investigador" },
  { n: 6, name: "Leal" },
  { n: 7, name: "Entusiasta" },
  { n: 8, name: "Desafiador" },
  { n: 9, name: "Pacificador" }
];

const benefits = [
  {
    icon: Brain,
    title: "Autoconhecimento",
    desc: "Identifique motivacoes, medos, pontos fortes e padroes de comportamento."
  },
  {
    icon: BarChart3,
    title: "Resultado instantaneo",
    desc: "Veja o tipo dominante, asa, ranking dos tipos e nivel de aderencia."
  },
  {
    icon: Users,
    title: "Lideranca e equipes",
    desc: "Use o resultado para melhorar comunicacao, relacoes e desenvolvimento profissional."
  }
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Teste profissional de Eneagrama
            </div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
              Diagnostico de Lideranca e Equipes
            </h1>
            <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Descubra seu perfil comportamental, pontos fortes e caminhos de desenvolvimento sem precisar entrar pelo Base44.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
              <Link to="/register">
                <Button size="lg" className="text-base px-8 py-6 rounded-xl gap-2 font-semibold">
                  Iniciar teste <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                90 perguntas, resultado no final
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-14 sm:py-18">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Os 9 tipos do Eneagrama</h2>
            <p className="mt-2 text-sm text-muted-foreground">Cada tipo mostra uma forma diferente de perceber, decidir e liderar.</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-9 gap-3">
            {types.map((type, index) => (
              <motion.div
                key={type.n}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.03 }}
                className="bg-card border border-border rounded-xl p-3 text-center"
              >
                <div
                  className="w-9 h-9 rounded-full mx-auto mb-2 flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: TYPE_COLORS[type.n] }}
                >
                  {type.n}
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{type.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 border-t border-border">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid sm:grid-cols-3 gap-4">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="bg-card border border-border rounded-xl p-5"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <benefit.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-heading text-sm font-semibold text-foreground">{benefit.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-foreground">Pronto para comecar?</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            O cadastro e as respostas ficam salvos neste navegador para o app funcionar fora da Base44.
          </p>
          <Link to="/register">
            <Button size="lg" className="mt-7 text-base px-8 py-6 rounded-xl gap-2 font-semibold">
              Comecar agora <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="font-display text-lg font-semibold text-foreground">Diagnostico de Lideranca e Equipes</p>
          <p className="mt-1 text-sm text-muted-foreground">Aplicativo publicado fora da Base44</p>
        </div>
      </footer>
    </div>
  );
}
