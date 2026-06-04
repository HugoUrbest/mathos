import questionsData from "./questions.json";
import { Question, Answer, QuizResult, Theme, StudyLevel, THEME_LABELS } from "./types";

const QUIZ_SIZE = 20;
const POINTS_CORRECT = 3;
const POINTS_WRONG = -1;

export function getRandomQuestions(): Question[] {
  const questions = questionsData as Question[];
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, QUIZ_SIZE);
}

export function computeScore(answers: Answer[], questions: Question[]): number {
  return answers.reduce((total, answer, idx) => {
    if (answer.selectedIndex === null) return total;
    const correct = questions[idx].answer === answer.selectedIndex;
    return total + (correct ? POINTS_CORRECT : POINTS_WRONG);
  }, 0);
}

export function computeResult(
  answers: Answer[],
  questions: Question[],
  studyLevel: StudyLevel,
  userName: string
): QuizResult {
  const score = computeScore(answers, questions);
  const maxScore = questions.length * POINTS_CORRECT;

  const themeScores = {} as QuizResult["themeScores"];

  questions.forEach((q, idx) => {
    if (!themeScores[q.theme]) {
      themeScores[q.theme] = { correct: 0, total: 0, score: 0 };
    }
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

  return { answers, questions, score, maxScore, themeScores, completedAt: new Date(), studyLevel, userName };
}

export function getScorePercent(score: number, maxScore: number): number {
  return Math.round(((score + maxScore * (1 / 3)) / (maxScore * (4 / 3))) * 100);
}

export function getScoreLabel(pct: number): { label: string; color: string } {
  if (pct >= 80) return { label: "Excellent", color: "text-emerald-600" };
  if (pct >= 60) return { label: "Bon niveau", color: "text-blue-600" };
  if (pct >= 40) return { label: "Moyen", color: "text-amber-600" };
  return { label: "À travailler", color: "text-red-600" };
}

export function saveResult(result: QuizResult): void {
  const stored = getStoredResults();
  stored.push(result);
  localStorage.setItem("mathos_results", JSON.stringify(stored));
}

export function getStoredResults(): QuizResult[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("mathos_results") || "[]");
  } catch {
    return [];
  }
}

export function getThemeRadarData(themeScores: QuizResult["themeScores"]) {
  return Object.entries(themeScores).map(([theme, data]) => {
    const maxPossible = data.total * POINTS_CORRECT;
    const minPossible = data.total * POINTS_WRONG;
    const range = maxPossible - minPossible;
    const normalized = range > 0 ? Math.round(((data.score - minPossible) / range) * 100) : 0;
    return {
      theme: THEME_LABELS[theme as Theme] || theme,
      value: normalized,
      fullMark: 100,
    };
  });
}
