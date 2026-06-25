import React from "react";
import { Zap, AlertTriangle, Lightbulb, Target, Briefcase, Users, MessageSquare, ShieldAlert } from "lucide-react";
import ProfessionalAptitude from "@/components/results/ProfessionalAptitude";

const colorTokens = {
  emerald: { bg: "bg-emerald-500/5", border: "border-emerald-500/30", text: "text-emerald-400" },
  rose: { bg: "bg-rose-500/5", border: "border-rose-500/30", text: "text-rose-400" },
  purple: { bg: "bg-purple-500/5", border: "border-purple-500/30", text: "text-purple-400" },
  blue: { bg: "bg-blue-500/5", border: "border-blue-500/30", text: "text-blue-400" },
  amber: { bg: "bg-amber-500/5", border: "border-amber-500/30", text: "text-amber-400" },
};

const teamFeedback = {
  1: {
    team: "Contribui com padrao, qualidade, disciplina e senso de justica. Em equipe, ajuda a corrigir falhas e organizar processos.",
    feedback: "Deve receber feedback objetivo, com criterios claros. Evite tom acusatorio; mostre fatos, impacto e padrao esperado.",
    risk: "Pode ficar rigido, critico e centralizador, dificultando delegacao.",
    correction: "Estimular flexibilidade, delegacao e reconhecimento do progresso antes da critica."
  },
  2: {
    team: "Fortalece relacionamento, apoio, integracao e clima humano. Tende a perceber necessidades do grupo com facilidade.",
    feedback: "Precisa de feedback respeitoso, direto e cuidadoso. Reforce valor pessoal antes de tratar pontos de melhoria.",
    risk: "Pode evitar cobranca, buscar aprovacao ou se sobrecarregar ajudando demais.",
    correction: "Definir limites, responsabilidades e indicadores objetivos para nao misturar cuidado com permissividade."
  },
  3: {
    team: "Move o grupo para meta, produtividade, desempenho e resultado. Ajuda a equipe a sair da teoria e executar.",
    feedback: "Recebe melhor feedback ligado a performance, resultado e melhoria de eficiencia. Seja direto e mostre oportunidade de evolucao.",
    risk: "Pode atropelar pessoas, competir demais ou valorizar imagem acima de consistencia.",
    correction: "Equilibrar metas com escuta, maturidade da equipe e qualidade das relacoes."
  },
  4: {
    team: "Traz criatividade, sensibilidade, originalidade e leitura emocional do ambiente. Ajuda a perceber tensoes invisiveis.",
    feedback: "Precisa de feedback cuidadoso, sem desqualificar sua identidade. Separe comportamento de valor pessoal.",
    risk: "Pode personalizar criticas, oscilar emocionalmente ou perder energia em rotinas repetitivas.",
    correction: "Dar espaco criativo, mas com rotina minima, entregas claras e criterios objetivos."
  },
  5: {
    team: "Agrega analise, profundidade, conhecimento tecnico e decisao baseada em dados. Bom para diagnosticos complexos.",
    feedback: "Prefere feedback racional, especifico e sem pressao emocional. Dê tempo para processar e responder.",
    risk: "Pode se isolar, comunicar pouco ou demorar por analise excessiva.",
    correction: "Criar rituais curtos de comunicacao, prazos claros e momentos obrigatorios de compartilhamento."
  },
  6: {
    team: "Ajuda o grupo a antecipar riscos, organizar seguranca e testar consistencia das decisoes.",
    feedback: "Precisa de ambiente confiavel. Seja claro, previsivel e mostre que o feedback e para desenvolvimento, nao ameaca.",
    risk: "Pode ficar ansioso, indeciso ou resistente quando percebe falta de seguranca.",
    correction: "Dar contexto, prioridades, criterios de decisao e plano de acao para reduzir inseguranca."
  },
  7: {
    team: "Traz energia, criatividade, visao de oportunidade e capacidade de animar o grupo.",
    feedback: "Recebe melhor feedback pratico, leve e orientado a foco. Mostre o ganho de concluir antes de iniciar novas ideias.",
    risk: "Pode dispersar, evitar assuntos dificeis ou iniciar mais do que termina.",
    correction: "Usar metas curtas, entregas visiveis, responsavel por fechamento e limite de prioridades simultaneas."
  },
  8: {
    team: "Traz decisao, coragem, protecao e capacidade de enfrentar problemas duros sem fugir.",
    feedback: "Prefere comunicacao direta, objetiva e sem rodeios. Evite indiretas; fale com firmeza e respeito.",
    risk: "Pode dominar, confrontar demais ou intimidar perfis mais sensiveis.",
    correction: "Canalizar forca para protecao e execucao, exigindo escuta ativa antes de decidir."
  },
  9: {
    team: "Favorece harmonia, mediacao, estabilidade e escuta. Ajuda a reduzir atritos e criar consenso.",
    feedback: "Precisa de feedback calmo, claro e com pedido objetivo. Evite ambiguidade, pois pode concordar sem agir.",
    risk: "Pode evitar conflito, adiar decisoes e perder prioridade por acomodacao.",
    correction: "Definir prazos, responsaveis, prioridade unica e acompanhamento ate a entrega."
  }
};

export default function BasicView({ result, dominantDetail, ranking, scores }) {
  const dominantType = Number(result.dominant_type);
  const strengthsList = dominantDetail?.strengths?.split(/[,.]/).filter(Boolean).map((s) => s.trim()).filter((s) => s.length > 2) || [];
  const challengesList = dominantDetail?.weaknesses?.split(/[,.]/).filter(Boolean).map((s) => s.trim()).filter((s) => s.length > 2) || [];
  const recommendations = dominantDetail?.recommendations || [];
  const applied = teamFeedback[dominantType];

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-3">Resumo da Personalidade</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{dominantDetail?.description}</p>
        <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mt-4">
          Nota gerencial: o Eneagrama deve ser usado para autoconhecimento, comunicacao e desenvolvimento. Nao use o tipo como rotulo fixo ou como unica base para promocao, desligamento ou decisao de carreira.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <CardSection title="5 Pontos Fortes" icon={Zap} items={strengthsList.slice(0, 5)} color="emerald" />
        <CardSection title="5 Pontos de Atenção" icon={AlertTriangle} items={challengesList.slice(0, 5)} color="rose" />
      </div>

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Indicadores Comportamentais</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Liderança", icon: Target, text: dominantDetail?.leadership || "—", color: "emerald" },
            { label: "Empreendedorismo", icon: Briefcase, text: dominantDetail?.strengths?.split(",")[0]?.trim() || "—", color: "blue" },
            { label: "Inteligência Emocional", icon: Lightbulb, text: dominantDetail?.communication || "—", color: "purple" },
            { label: "Comunicação e Influência", icon: Zap, text: dominantDetail?.communication || "—", color: "amber" },
          ].map((ind) => {
            const tc = colorTokens[ind.color];
            return (
              <div key={ind.label} className={`p-3 rounded-xl ${tc.bg} ${tc.border} border`}>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ind.icon className={`w-3.5 h-3.5 ${tc.text}`} />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{ind.label}</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{ind.text}</p>
              </div>
            );
          })}
        </div>
      </div>

      {applied && (
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Aplicação em Equipe e Feedback</h3>
          <div className="grid md:grid-cols-2 gap-3">
            <GuidanceCard icon={Users} title="Trabalho em equipe" text={applied.team} color="blue" />
            <GuidanceCard icon={MessageSquare} title="Feedback adequado" text={applied.feedback} color="emerald" />
            <GuidanceCard icon={ShieldAlert} title="Risco de liderança" text={applied.risk} color="rose" />
            <GuidanceCard icon={Target} title="Correção gerencial" text={applied.correction} color="amber" />
          </div>
        </div>
      )}

      <ProfessionalAptitude dominantType={dominantType} dominantDetail={dominantDetail} ranking={ranking} isPremium={true} />

      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="font-heading text-sm font-semibold text-foreground mb-4">Plano de Desenvolvimento</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {recommendations.slice(0, 3).map((rec, i) => (
            <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-border/50">
              <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary mb-2">{i + 1}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{rec}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GuidanceCard({ title, text, icon: Icon, color }) {
  const tc = colorTokens[color] || colorTokens.blue;
  return (
    <div className={`border rounded-2xl p-4 ${tc.bg} ${tc.border}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${tc.text}`} />
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}

function CardSection({ title, icon: Icon, items, color }) {
  const tc = colorTokens[color];
  return (
    <div className={`border rounded-2xl p-4 ${tc.bg} ${tc.border}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${tc.text}`} />
        <h4 className="text-xs font-semibold text-foreground">{title}</h4>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
            <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${tc.text}`} style={{ backgroundColor: "currentColor" }} />
            {item}
          </li>
        ))}
        {items.length === 0 && <p className="text-[11px] text-muted-foreground/50 italic">—</p>}
      </ul>
    </div>
  );
}
