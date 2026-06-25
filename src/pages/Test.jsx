import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { QUESTIONS, LIKERT_OPTIONS, calculateResults } from "@/lib/testEngine";
import { createResult, getParticipant, updateParticipant } from "@/lib/cloudStore";

export default function Test() {
  const { participantId } = useParams();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef();
  const saveTimeoutRef = useRef();

  // Carregar progresso salvo
  useEffect(() => {
    (async () => {
      try {
        const p = await getParticipant(participantId);
        if (p) {
          if (p.answers) {
            try {
              const savedAnswers = JSON.parse(p.answers);
              setAnswers(savedAnswers);
            } catch (e) {}
          }
          if (p.current_index != null) {
            setCurrentIndex(Math.max(0, Math.min(p.current_index, QUESTIONS.length - 1)));
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setRestoring(false);
      }
    })();
  }, [participantId]);

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(saveTimeoutRef.current);
    };
  }, [startTime]);

  // Auto-save com debounce
  const saveProgress = (newAnswers, newIndex) => {
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await updateParticipant(participantId, {
          answers: JSON.stringify(newAnswers),
          current_index: newIndex
        });
      } catch (e) {
        console.error(e);
      } finally {
        setSaving(false);
      }
    }, 600);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const totalQuestions = QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const progress = Math.round((answeredCount / totalQuestions) * 100);
  const currentQuestion = QUESTIONS[currentIndex];

  const handleAnswer = (value) => {
    const newAnswers = { ...answers, [currentQuestion.id]: value };
    setAnswers(newAnswers);
    saveProgress(newAnswers, currentIndex);
    if (currentIndex < totalQuestions - 1) {
      setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
    }
  };

  const handleNavigate = (newIndex) => {
    setCurrentIndex(newIndex);
    saveProgress(answers, newIndex);
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) return;
    setSubmitting(true);
    try {
      const results = calculateResults(answers);
      const p = await getParticipant(participantId);

      const savedResult = await createResult({
        participant_id: participantId,
        participant_name: p.full_name || "",
        participant_email: p.email || "",
        participant_company: p.company || "",
        participant_role: p.role || "",
        participant_birth_date: p.birth_date || "",
        plan: p.plan || "basico",
        answers: JSON.stringify(answers),
        scores: JSON.stringify(results),
        dominant_type: results.dominantType,
        dominant_type_name: results.dominantTypeName,
        wing: results.wing,
        wing_name: results.wingName,
        confidence_level: results.confidence,
        duration_seconds: elapsed,
        completed: true
      });

      // Limpar progresso salvo
      await updateParticipant(participantId, {
        answers: "{}",
        current_index: 0
      });

      navigate(`/results/${savedResult.id}`);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (restoring) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display text-sm font-semibold text-foreground">Diagnóstico de Liderança</span>
            <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
              {saving && (
                <span className="text-emerald-400 flex items-center gap-1"><Save className="w-3 h-3" /> Salvando...</span>
              )}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatTime(elapsed)}</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {answeredCount}/{totalQuestions}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Progress value={progress} className="h-1.5 flex-1 [&>div]:bg-primary" />
            <span className="text-[11px] font-medium text-primary min-w-[36px] text-right">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
            >
              <div className="text-center mb-2">
                <span className="text-[10px] font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                  Pergunta {currentIndex + 1} de {totalQuestions}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-semibold text-foreground text-center mt-6 mb-10 leading-relaxed px-2">
                {currentQuestion.text}
              </h2>

              <div className="space-y-2.5">
                {LIKERT_OPTIONS.map(opt => {
                  const isSelected = answers[currentQuestion.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleAnswer(opt.value)}
                      className={`w-full p-4 rounded-xl border text-left transition-all duration-200 flex items-center gap-4 ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(120,80,255,0.15)]"
                          : "border-border hover:border-white/10 bg-card"
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                        isSelected ? "bg-primary text-white" : "bg-white/[0.05] text-muted-foreground"
                      }`}>
                        {opt.value}
                      </div>
                      <span className={`text-sm font-medium ${isSelected ? "text-foreground" : "text-muted-foreground"}`}>
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 bg-background/80 backdrop-blur-xl border-t border-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => handleNavigate(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="gap-1 text-muted-foreground"
            size="sm"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>

          {answeredCount === totalQuestions ? (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2 px-6 rounded-xl font-semibold shadow-lg shadow-primary/30"
            >
              {submitting ? "Calculando..." : "Ver Resultado"}
            </Button>
          ) : (
            <Button
              variant="ghost"
              onClick={() => handleNavigate(Math.min(totalQuestions - 1, currentIndex + 1))}
              disabled={currentIndex === totalQuestions - 1}
              className="gap-1 text-muted-foreground"
              size="sm"
            >
              Próxima <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
