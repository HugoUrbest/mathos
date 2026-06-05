import questionsData from "./questions.json";
import {
  Question, Answer, QuizResult, Theme, Level, StudyLevel,
  SelfRating, QuizMode, THEME_LABELS, STUDY_LEVEL_TO_QUESTION_LEVEL,
} from "./types";
import { generateQuestions } from "./procedural";

const GRAND_TEST_SIZE = 30;
const TRAINING_SIZE = 10;
// Ratio procédural dans l'entraînement : 50% statique + 50% procédural
const TRAINING_PROCEDURAL_RATIO = 0.5;
const POINTS_CORRECT = 3;
const POINTS_WRONG = -1;

const allQuestions = questionsData as Question[];

// ─── Sélection des questions ──────────────────────────────────────────────────

export function getGrandTestQuestions(): Question[] {
  // Grand Test : 100% statique (questions validées)
  const shuffled = [...allQuestions].filter(q => q.level !== "primaire")
    .sort(() => Math.random() - 0.5);
  return shuffled.slice(0, GRAND_TEST_SIZE);
}

export function getTrainingQuestions(theme: Theme, level: Level): Question[] {
  // Entraînement : moitié statique + moitié procédurale, mélangées
  const staticPool = allQuestions.filter(q => q.theme === theme && q.level === level);
  const staticCount = Math.min(
    Math.ceil(TRAINING_SIZE * (1 - TRAINING_PROCEDURAL_RATIO)),
    staticPool.length
  );
  const staticSelected = [...staticPool].sort(() => Math.random() - 0.5).slice(0, staticCount);

  const proceduralCount = TRAINING_SIZE - staticSelected.length;
  const proceduralSelected = proceduralCount > 0
    ? generateQuestions(proceduralCount, theme, level)
    : [];

  return [...staticSelected, ...proceduralSelected].sort(() => Math.random() - 0.5);
}

export function getLevelForStudyLevel(studyLevel: StudyLevel): Level {
  return STUDY_LEVEL_TO_QUESTION_LEVEL[studyLevel] ?? "bac";
}

// ─── Calcul des scores ────────────────────────────────────────────────────────

export function computeScore(answers: Answer[], questions: Question[]): number {
  return answers.reduce((total, answer, idx) => {
    if (answer.selectedIndex === null) return total;
    return total + (questions[idx].answer === answer.selectedIndex
      ? POINTS_CORRECT : POINTS_WRONG);
  }, 0);
}

export function computeResult(
  answers: Answer[],
  questions: Question[],
  studyLevel: StudyLevel,
  classRating: SelfRating,
  schoolRating: SelfRating,
  userName: string,
  mode: QuizMode,
  trainingTheme?: Theme,
  trainingLevel?: Level,
): QuizResult {
  const score = computeScore(answers, questions);
  const maxScore = questions.length * POINTS_CORRECT;

  const themeScores: QuizResult["themeScores"] = {};
  questions.forEach((q, idx) => {
    if (!themeScores[q.theme]) themeScores[q.theme] = { correct: 0, total: 0, score: 0 };
    themeScores[q.theme].total++;
    const ans = answers[idx];
    if (ans.selectedIndex !== null) {
      if (ans.selectedIndex === q.answer) {
        themeScores[q.theme].correct++;
        themeScores[q.theme].score += POINTS_CORRECT;
      } else {
        themeScores[q.theme].score += POINTS_WRONG;
      }
    }
  });

  return {
    mode, answers, questions, score, maxScore, themeScores,
    completedAt: new Date().toISOString(),
    studyLevel, classRating, schoolRating, userName,
    trainingTheme, trainingLevel,
  };
}

// ─── Stockage local ───────────────────────────────────────────────────────────

export function saveResult(result: QuizResult): void {
  const stored = getStoredResults();
  stored.push(result);
  localStorage.setItem("mathos_results", JSON.stringify(stored));
}

export function getStoredResults(): QuizResult[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("mathos_results") || "[]");
  } catch { return []; }
}

export function getGrandTestHistory(): QuizResult[] {
  return getStoredResults()
    .filter((r) => r.mode === "grand_test")
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
}

// ─── Radar fusionné (entraînement + grand test) ───────────────────────────────

export function getMergedThemeScores(): Record<string, { correct: number; total: number; score: number }> {
  const all = getStoredResults();
  const merged: Record<string, { correct: number; total: number; score: number }> = {};
  all.forEach((result) => {
    Object.entries(result.themeScores).forEach(([theme, data]) => {
      if (!merged[theme]) merged[theme] = { correct: 0, total: 0, score: 0 };
      merged[theme].correct += data.correct;
      merged[theme].total += data.total;
      merged[theme].score += data.score;
    });
  });
  return merged;
}

export function getThemeRadarData(themeScores: QuizResult["themeScores"]) {
  return Object.entries(themeScores).map(([theme, data]) => {
    const max = data.total * POINTS_CORRECT;
    const min = data.total * POINTS_WRONG;
    const range = max - min;
    const normalized = range > 0 ? Math.round(((data.score - min) / range) * 100) : 0;
    return { theme: THEME_LABELS[theme as Theme] || theme, value: normalized, fullMark: 100 };
  });
}

export function getMergedRadarData() {
  const merged = getMergedThemeScores();
  return getThemeRadarData(merged);
}

// ─── Progression par thème ────────────────────────────────────────────────────

export function getThemeProgression(theme: Theme): { date: string; score: number; level: string }[] {
  return getStoredResults()
    .filter((r) => r.themeScores[theme])
    .map((r) => {
      const data = r.themeScores[theme];
      const max = data.total * POINTS_CORRECT;
      const min = data.total * POINTS_WRONG;
      const range = max - min;
      const pct = range > 0 ? Math.round(((data.score - min) / range) * 100) : 0;
      return {
        date: new Date(r.completedAt).toLocaleDateString("fr-FR"),
        score: pct,
        level: r.trainingLevel || r.studyLevel,
      };
    });
}

// ─── Helpers d'affichage ──────────────────────────────────────────────────────

export function getScorePercent(score: number, maxScore: number): number {
  const range = maxScore * (1 + 1 / 3);
  return Math.max(0, Math.round(((score + maxScore / 3) / range) * 100));
}

export function getScoreLabel(pct: number): { label: string; color: string } {
  if (pct >= 80) return { label: "Excellent", color: "text-emerald-600" };
  if (pct >= 60) return { label: "Bon niveau", color: "text-blue-600" };
  if (pct >= 40) return { label: "Moyen", color: "text-amber-600" };
  return { label: "À travailler", color: "text-red-500" };
}
