import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, FileDown, Share2, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import BasicView from "@/components/results/BasicView";
import { TYPE_DETAILS } from "@/lib/enneagramData";
import { getResult } from "@/lib/cloudStore";

export default function Results() {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResult(resultId)
      .then(setResult)
      .catch(() => setResult(null))
      .finally(() => setLoading(false));
  }, [resultId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <p className="text-muted-foreground">Resultado nao encontrado.</p>
        <Link to="/">
          <Button variant="ghost" className="mt-4">Voltar ao inicio</Button>
        </Link>
      </div>
    );
  }

  const scores = JSON.parse(result.scores || "{}");
  const ranking = scores.ranking || [];
  const dominantType = result.dominant_type;
  const dominantDetail = TYPE_DETAILS[dominantType];
  const duration = result.duration_seconds || 0;
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  const handleShare = () => {
    const shareData = {
      title: `Meu resultado Eneagrama - ${result.dominant_type_name}`,
      text: `Meu tipo dominante e Tipo ${dominantType} - ${result.dominant_type_name}.`,
      url: window.location.href
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Inicio
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 sm:p-8 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="text-6xl shrink-0">{dominantDetail?.emoji}</div>
            <div className="text-center sm:text-left flex-1">
              <p className="text-sm text-muted-foreground">Resultado do teste</p>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1">
                Tipo {dominantType} - {result.dominant_type_name}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">{dominantDetail?.subtitle}</p>
              {result.recalculated && (
                <p className="mt-3 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 inline-block">
                  Resultado recalculado com a nova regra de desempate. {result.result_note || scores.resultNote || "Analise tambem o ranking completo."}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-3 mt-4 justify-center sm:justify-start">
                <span className="inline-flex items-center gap-1.5 bg-primary/15 text-primary px-3 py-1.5 rounded-lg text-sm font-bold">
                  <Trophy className="w-4 h-4" /> {result.confidence_level}% aderencia
                </span>
                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-sm font-medium">
                  <Star className="w-4 h-4" /> {result.dominant_type}w{result.wing}
                </span>
                <span className="inline-flex items-center gap-1.5 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg text-sm font-medium">
                  <Clock className="w-4 h-4" /> {minutes}m {seconds}s
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-2" onClick={handleShare}>
                <Share2 className="w-4 h-4" /> Compartilhar
              </Button>
              <Button size="sm" className="gap-2 rounded-xl" onClick={() => window.print()}>
                <FileDown className="w-4 h-4" /> PDF
              </Button>
            </div>
          </div>
        </motion.div>

        <BasicView result={result} dominantDetail={dominantDetail} ranking={ranking} scores={scores} />
      </div>
    </div>
  );
}
