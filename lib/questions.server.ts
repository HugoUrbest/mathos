// ⚠️ MODULE SERVEUR UNIQUEMENT.
// Ce module donne accès aux bonnes réponses des questions. Il ne doit JAMAIS
// être importé depuis un composant client ("use client") ni depuis lib/quiz.ts,
// sous peine de réexposer les réponses dans le bundle navigateur.
// Il n'est utilisé que dans les route handlers /api/exam/*.

import questionsData from "./questions.json";
import { Question, Level } from "./types";

const POINTS_CORRECT = 3;
const POINTS_WRONG = -1;
const CERTIFYING_TEST_SIZE = 50;

const all = questionsData as Question[];
const byId = new Map<number, Question>(all.map((q) => [q.id, q]));

/** Question expurgée envoyée au client : aucune bonne réponse, aucune explication. */
export type ExamQuestion = Pick<Question, "id" | "theme" | "level" | "question" | "choices"> & {
  answer: number;       // sentinelle -1 (jamais la vraie réponse)
  explanation: string;  // vide pendant l'examen
};

/**
 * Sélection serveur des 50 questions de l'examen.
 * Si un niveau est fourni, on privilégie ce niveau puis on complète.
 * (Le primaire est exclu de l'examen certifiant.)
 */
export function selectExamQuestions(level?: Level): Question[] {
  const pool = all.filter((q) => q.level !== "primaire");
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  if (level) {
    const atLevel = shuffled.filter((q) => q.level === level);
    const others = shuffled.filter((q) => q.level !== level);
    return [...atLevel, ...others].slice(0, CERTIFYING_TEST_SIZE);
  }
  return shuffled.slice(0, CERTIFYING_TEST_SIZE);
}

/** Récupère les vraies questions (avec réponses) à partir de leurs IDs, dans l'ordre fourni. */
export function getQuestionsByIds(ids: number[]): Question[] {
  return ids
    .map((id) => byId.get(id))
    .filter((q): q is Question => Boolean(q));
}

/** Retire réponses + explications avant envoi au navigateur. */
export function stripAnswers(qs: Question[]): ExamQuestion[] {
  return qs.map((q) => ({
    id: q.id,
    theme: q.theme,
    level: q.level,
    question: q.question,
    choices: q.choices,
    answer: -1,
    explanation: "",
  }));
}

export interface ExamScore {
  score: number;
  maxScore: number;
  themeScores: Record<string, { correct: number; total: number; score: number }>;
  corrections: { id: number; selected: number | null; correct: number; ok: boolean; explanation: string }[];
}

/**
 * Correction SERVEUR — source de vérité du score.
 * `answers[i]` est l'indice choisi pour la question `questionIds[i]` (ou null si passée).
 */
export function scoreExam(questionIds: number[], answers: (number | null)[]): ExamScore {
  const questions = getQuestionsByIds(questionIds);
  let score = 0;
  const themeScores: ExamScore["themeScores"] = {};
  const corrections: ExamScore["corrections"] = [];

  questions.forEach((q, i) => {
    const sel = answers[i] ?? null;
    if (!themeScores[q.theme]) themeScores[q.theme] = { correct: 0, total: 0, score: 0 };
    themeScores[q.theme].total++;

    let ok = false;
    if (sel !== null) {
      if (sel === q.answer) {
        score += POINTS_CORRECT;
        themeScores[q.theme].correct++;
        themeScores[q.theme].score += POINTS_CORRECT;
        ok = true;
      } else {
        score += POINTS_WRONG;
        themeScores[q.theme].score += POINTS_WRONG;
      }
    }
    corrections.push({ id: q.id, selected: sel, correct: q.answer, ok, explanation: q.explanation });
  });

  return { score, maxScore: questions.length * POINTS_CORRECT, themeScores, corrections };
}
