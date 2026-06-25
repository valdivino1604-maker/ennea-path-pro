import { QUESTIONS as ORIGINAL_QUESTIONS, LIKERT_OPTIONS, TYPE_NAMES } from "@/lib/enneagramData";

export { LIKERT_OPTIONS };

function hashSeed(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stableShuffle(items, seedText = "ennea-path-pro-v2") {
  const shuffled = [...items];
  const random = seededRandom(hashSeed(seedText));
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export const QUESTIONS = stableShuffle(ORIGINAL_QUESTIONS);

function getAnswerStats(answers) {
  const stats = {};
  for (let t = 1; t <= 9; t++) {
    stats[t] = {
      type: t,
      score: 0,
      answered: 0,
      strongAgreementCount: 0,
      agreementCount: 0
    };
  }

  Object.entries(answers || {}).forEach(([questionId, rawValue]) => {
    const question = ORIGINAL_QUESTIONS.find((q) => q.id === parseInt(questionId, 10));
    const value = Number(rawValue);
    if (!question || Number.isNaN(value)) return;

    const item = stats[question.type];
    item.score += value;
    item.answered += 1;
    if (value === 5) item.strongAgreementCount += 1;
    if (value >= 4) item.agreementCount += 1;
  });

  return stats;
}

export function calculateResults(answers) {
  const stats = getAnswerStats(answers);
  const scores = {};
  const percentages = {};
  const maxPossibleByType = 50;

  for (let t = 1; t <= 9; t++) {
    scores[t] = stats[t].score;
    percentages[t] = Math.round((scores[t] / maxPossibleByType) * 100);
  }

  const tieBreakOrder = [5, 8, 2, 6, 3, 9, 4, 7, 1];
  const tieBreakRank = Object.fromEntries(tieBreakOrder.map((type, index) => [type, index]));

  const ranking = Object.values(stats)
    .map((item) => ({
      type: item.type,
      percentage: percentages[item.type],
      score: item.score,
      strongAgreementCount: item.strongAgreementCount,
      agreementCount: item.agreementCount
    }))
    .sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      if (b.score !== a.score) return b.score - a.score;
      if (b.strongAgreementCount !== a.strongAgreementCount) return b.strongAgreementCount - a.strongAgreementCount;
      if (b.agreementCount !== a.agreementCount) return b.agreementCount - a.agreementCount;
      return tieBreakRank[a.type] - tieBreakRank[b.type];
    });

  const topScore = ranking[0]?.percentage || 0;
  const secondScore = ranking[1]?.percentage || 0;
  const topCandidates = ranking.filter((item) => item.percentage === topScore && item.score === ranking[0].score);
  const hasCloseResult = topScore > 0 && topScore - secondScore < 5;
  const hasTie = topCandidates.length > 1;
  const dominantType = ranking[0].type;

  let confidence = 0;
  if (topScore > 0) {
    const gap = topScore - secondScore;
    confidence = Math.min(100, Math.max(20, Math.round((gap / topScore) * 100 + 45)));
    if (hasTie) confidence = 20;
    else if (hasCloseResult) confidence = Math.min(confidence, 45);
  }

  const wingCandidates = [
    dominantType === 1 ? 9 : dominantType - 1,
    dominantType === 9 ? 1 : dominantType + 1
  ];
  const wing = wingCandidates.reduce((a, b) =>
    (percentages[a] || 0) >= (percentages[b] || 0) ? a : b
  );

  return {
    scores,
    percentages,
    ranking,
    dominantType,
    dominantTypeName: TYPE_NAMES[dominantType],
    wing,
    wingName: TYPE_NAMES[wing],
    confidence,
    hasTie,
    hasCloseResult,
    topCandidates: topCandidates.map((item) => item.type),
    resultNote: hasTie
      ? "Resultado empatado entre perfis. Use como indicativo, nao como diagnostico definitivo."
      : hasCloseResult
        ? "Resultado com baixa diferenca entre os principais perfis. Recomenda-se analisar o ranking completo."
        : "Resultado com diferenca suficiente entre os principais perfis."
  };
}
