import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bot, Sparkles, Send, Loader2, User, Zap, Lightbulb, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from "@/api/base44Client";
import { TYPE_NAMES, TYPE_COLORS, TYPE_DETAILS } from "@/lib/enneagramData";

export default function AILeadership() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [messages, setMessages] = useState([]);
  const [topic, setTopic] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    base44.entities.TestResult.filter({ completed: true }, '-created_date', 500).then(r => {
      const latest = {};
      r.forEach(item => {
        if (!latest[item.participant_email]) latest[item.participant_email] = item;
      });
      setResults(Object.values(latest));
      setLoading(false);
    });
  }, []);

  const person = results.find(r => r.id === selectedId);
  const detail = person ? TYPE_DETAILS[person.dominant_type] : null;

  const handleGenerate = async () => {
    if (!person || !topic.trim()) return;
    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um coach de liderança especializado em Eneagrama. Uma pessoa do Tipo ${person.dominant_type} (${person.dominant_type_name}) com asa ${person.wing}w quer orientação sobre: "${topic}".

Contexto do perfil:
- Motivação: ${detail.motivation}
- Forças: ${detail.strengths}
- Fraquezas: ${detail.weaknesses}
- Estilo de liderança: ${detail.leadership}
- Comunicação: ${detail.communication}

Dê uma resposta prática e acionável, em português, com:
1. Uma análise de como este tipo lida com o tema
2. 3 estratégias específicas para desenvolver liderança neste aspecto
3. Uma dica final de autoconhecimento

Mantenha a resposta concisa (máximo 250 palavras), tom profissional mas acolhedor.`,
        model: "gpt_5_mini"
      });
      setMessages(prev => [...prev, { role: "user", content: topic }, { role: "assistant", content: response.data }]);
      setTopic("");
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const suggestedTopics = [
    "Como delegar melhor",
    "Dar feedback difícil",
    "Motivar equipe em crise",
    "Gerenciar conflitos",
    "Tomar decisões sob pressão",
    "Desenvolver inteligência emocional"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <Link to="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Bot className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">IA para Liderança</h1>
            <p className="text-sm text-muted-foreground">Coach de liderança com IA treinada em Eneagrama.</p>
          </div>
        </div>

        {/* Select Person */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">Selecionar Perfil</label>
          <Select value={selectedId} onValueChange={(v) => { setSelectedId(v); setMessages([]); }}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Escolha um perfil para coaching..." />
            </SelectTrigger>
            <SelectContent>
              {results.map(r => (
                <SelectItem key={r.id} value={r.id}>
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white" style={{ backgroundColor: TYPE_COLORS[r.dominant_type] }}>T{r.dominant_type}</span>
                    {r.participant_name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {person && detail && (
          <>
            {/* Profile Card */}
            <div className="bg-card border border-border rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{detail.emoji}</span>
                <div>
                  <h2 className="font-heading text-lg font-bold text-foreground">{person.participant_name}</h2>
                  <p className="text-sm text-muted-foreground">Tipo {person.dominant_type} — {detail.name} · Asa {person.wing}w</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 gap-3 mt-4">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-border/50">
                  <div className="flex items-center gap-1.5 mb-1"><Zap className="w-3 h-3 text-primary" /><span className="text-[10px] font-semibold text-foreground">Liderança</span></div>
                  <p className="text-[11px] text-muted-foreground">{detail.leadership}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-border/50">
                  <div className="flex items-center gap-1.5 mb-1"><Users className="w-3 h-3 text-primary" /><span className="text-[10px] font-semibold text-foreground">Comunicação</span></div>
                  <p className="text-[11px] text-muted-foreground">{detail.communication}</p>
                </div>
                <div className="p-3 rounded-xl bg-white/[0.03] border border-border/50">
                  <div className="flex items-center gap-1.5 mb-1"><Target className="w-3 h-3 text-primary" /><span className="text-[10px] font-semibold text-foreground">Motivação</span></div>
                  <p className="text-[11px] text-muted-foreground">{detail.motivation}</p>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-heading text-sm font-semibold text-foreground flex items-center gap-2">
                  <Bot className="w-4 h-4 text-violet-400" /> Coach de Liderança IA
                </h3>
              </div>

              {/* Messages */}
              <div className="p-4 min-h-[200px] max-h-[400px] overflow-y-auto space-y-4">
                {messages.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-50" />
                    <p className="text-sm text-muted-foreground">Pergunte sobre liderança, gestão ou desenvolvimento</p>
                  </div>
                )}
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                    {m.role === "assistant" && (
                      <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                        <Bot className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl p-3 ${m.role === "user" ? "bg-primary/15 text-foreground" : "bg-white/[0.04] text-muted-foreground"}`}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    </div>
                    {m.role === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                  </div>
                ))}
                {generating && (
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-violet-400" />
                    </div>
                    <div className="bg-white/[0.04] rounded-xl p-3">
                      <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* Suggested Topics */}
              {messages.length === 0 && (
                <div className="px-4 pb-3">
                  <p className="text-[10px] text-muted-foreground mb-2">Sugestões:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedTopics.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setTopic(t)}
                        className="text-[10px] px-2.5 py-1.5 rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleGenerate()}
                    placeholder="Como posso melhorar minha comunicação como líder?"
                    className="flex-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                  />
                  <Button onClick={handleGenerate} disabled={generating || !topic.trim()} size="sm" className="rounded-xl px-4">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {!person && !loading && (
          <div className="text-center py-20 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>Selecione um perfil para iniciar o coaching com IA</p>
          </div>
        )}
      </div>
    </div>
  );
}