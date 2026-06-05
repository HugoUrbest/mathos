"use client";
import { useState, useEffect } from "react";
import { Question, Answer, THEME_LABELS, Theme } from "@/lib/types";

export interface QuizEngineProps {
  questions: Question[];
  /** Label affiché en haut à gauche, ex. "🏆 Grand Test" */
  modeLabel: string;
  /** Durée en secondes (0 = pas de timer) */
  totalSeconds?: number;
  /** Si true : sélection = validation immédiate, pas d'explication */
  strictMode?: boolean;
  /** Bandeau d'alerte supplémentaire (ex. warnings de sortie d'onglet) */
  banner?: React.ReactNode;
  onFinish: (answers: Answer[]) => void;
}

const CHOICE_LETTERS = ["A", "B", "C", "D"];

// Exported so entrainement/page.tsx can use the same mapping
export function levelLabel(level: string) {
  return level === "primaire" ? "Primaire"
    : level === "college" ? "Collège"
    : level === "lycee"   ? "Lycée"
    : level === "bac"     ? "Bac"
    : "Bac+";
}

function choiceStyle(idx: number, selected: number | null, revealed: boolean, correct: number) {
  if (revealed) {
    if (idx === correct)  return "border-emerald-500 bg-emerald-50 text-emerald-800";
    if (idx === selected) return "border-red-400 bg-red-50 text-red-700";
    return "border-gray-100 bg-gray-50 text-gray-400";
  }
  if (idx === selected) return "border-indigo-600 bg-indigo-50 text-indigo-800";
  return "border-gray-200 bg-white text-gray-700 hover:border-indigo-300";
}

export default function QuizEngine({
  questions,
  modeLabel,
  totalSeconds = 0,
  strictMode = false,
  banner,
  onFinish,
}: QuizEngineProps) {
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState<Answer[]>(() =>
    questions.map(q => ({ questionId: q.id, selectedIndex: null }))
  );
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  // Réinitialiser si les questions changent
  useEffect(() => {
    setAnswers(questions.map(q => ({ questionId: q.id, selectedIndex: null })));
    setCurrent(0); setSelected(null); setRevealed(false);
    setTimeLeft(totalSeconds);
  }, [questions, totalSeconds]);

  // Timer — un seul interval, updater fonctionnel pour éviter les re-registrations
  useEffect(() => {
    if (!totalSeconds) return;
    const t = setInterval(() => setTimeLeft(v => {
      if (v <= 1) { clearInterval(t); return 0; }
      return v - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [totalSeconds]); // ne dépend pas de timeLeft

  useEffect(() => {
    if (totalSeconds && timeLeft === 0 && questions.length > 0) onFinish(answers);
  }, [timeLeft, totalSeconds, questions, answers, onFinish]);

  function commitAnswer(idx: number | null): Answer[] {
    const updated = [...answers];
    updated[current] = { questionId: questions[current].id, selectedIndex: idx };
    setAnswers(updated);
    return updated;
  }

  // Avancer à la question suivante ou terminer
  function advance(ans: Answer[]) {
    if (current + 1 >= questions.length) onFinish(ans);
    else { setCurrent(c => c + 1); setSelected(null); setRevealed(false); }
  }

  function handleSelect(idx: number) {
    if (revealed) return;
    if (strictMode) {
      advance(commitAnswer(idx));
    } else {
      setSelected(idx);
    }
  }

  function validate() {
    if (!revealed && selected === null) return;
    if (!revealed) {
      commitAnswer(selected);
      setRevealed(true);
    } else {
      advance(answers);
    }
  }

  function skip() {
    advance(commitAnswer(null));
  }

  if (!questions.length) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-400">Chargement…</div>
    </div>
  );

  const q = questions[current];
  const isUrgent = totalSeconds > 0 && timeLeft < 120;
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <div className="min-h-screen flex flex-col items-center p-6 pt-6">
      {banner && <div className="w-full max-w-xl mb-3">{banner}</div>}

      <div className="w-full max-w-xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">{modeLabel}</div>
            <div className="text-sm text-gray-600 font-semibold">
              Question {current + 1} / {questions.length}
            </div>
          </div>
          {totalSeconds > 0 && (
            <div className={`font-mono font-bold text-lg px-3 py-1 rounded-xl ${
              isUrgent ? "bg-red-100 text-red-600 animate-pulse" : "bg-gray-100 text-gray-700"
            }`}>
              {mins}:{secs}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${(current / questions.length) * 100}%` }} />
        </div>

        {/* Badges thème / niveau */}
        <div className="flex gap-2">
          <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
            {THEME_LABELS[q.theme as Theme] ?? q.theme}
          </span>
          <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
            {levelLabel(q.level)}
          </span>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-900 font-medium text-lg leading-relaxed">{q.question}</p>
        </div>

        {/* Choix */}
        <div className="space-y-3">
          {q.choices.map((choice, idx) => (
            <button key={idx}
              onClick={() => handleSelect(idx)}
              disabled={revealed || (strictMode && selected !== null)}
              className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all
                ${choiceStyle(idx, selected, revealed, q.answer)}`}>
              <span className="font-bold mr-3">{CHOICE_LETTERS[idx]}.</span>
              {choice}
            </button>
          ))}
        </div>

        {/* Explication (mode non-strict) */}
        {!strictMode && revealed && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
            <strong>Explication :</strong> {q.explanation}
          </div>
        )}

        {/* Actions */}
        {!strictMode && (
          <div className="flex gap-3">
            {!revealed && (
              <button onClick={skip}
                className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-gray-300 font-medium text-sm">
                Passer
              </button>
            )}
            <button onClick={validate}
              disabled={!revealed && selected === null}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors">
              {revealed
                ? (current + 1 >= questions.length ? "Voir mes résultats →" : "Suivant →")
                : "Valider"}
            </button>
          </div>
        )}

        {strictMode && !revealed && (
          <button onClick={skip}
            className="w-full py-3 border-2 border-gray-200 text-gray-400 hover:border-gray-300 rounded-xl text-sm">
            Passer cette question (0 point)
          </button>
        )}
      </div>
    </div>
  );
}
