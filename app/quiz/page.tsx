"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Question, Answer, StudyLevel, SelfRating } from "@/lib/types";
import { getRandomQuestions, computeResult, saveResult } from "@/lib/quiz";

const TOTAL_SECONDS = 30 * 60;

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [studyLevel, setStudyLevel] = useState<StudyLevel>("terminale");
  const [classRating, setClassRating] = useState<SelfRating>("moyen");
  const [schoolRating, setSchoolRating] = useState<SelfRating>("moyen");
  const [started, setStarted] = useState(false);

  const finish = useCallback((qs: Question[], ans: Answer[], level: StudyLevel, cr: SelfRating, sr: SelfRating) => {
    const result = computeResult(ans, qs, level, cr, sr, "");
    saveResult(result);
    localStorage.setItem("mathos_last_result", JSON.stringify(result));
    router.push("/resultats");
  }, [router]);

  useEffect(() => {
    const qs = getRandomQuestions();
    const level = (localStorage.getItem("mathos_pending_level") as StudyLevel) || "terminale";
    const cr = (localStorage.getItem("mathos_pending_class_rating") as SelfRating) || "moyen";
    const sr = (localStorage.getItem("mathos_pending_school_rating") as SelfRating) || "moyen";
    setQuestions(qs);
    setStudyLevel(level);
    setClassRating(cr);
    setSchoolRating(sr);
    setAnswers(qs.map((q) => ({ questionId: q.id, selectedIndex: null })));
    setStarted(true);
  }, []);

  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((v) => {
      if (v <= 1) {
        clearInterval(t);
        return 0;
      }
      return v - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [started, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0) {
      finish(questions, answers, studyLevel, classRating, schoolRating);
    }
  }, [timeLeft, questions, answers, studyLevel, classRating, schoolRating, finish]);

  function selectAnswer(idx: number) {
    if (revealed) return;
    setSelected(idx);
  }

  function validate() {
    if (selected === null && !revealed) return;
    if (!revealed) {
      setRevealed(true);
      const updated = [...answers];
      updated[current] = { questionId: questions[current].id, selectedIndex: selected };
      setAnswers(updated);
    } else {
      if (current + 1 >= questions.length) {
        finish(questions, answers, studyLevel, classRating, schoolRating);
      } else {
        setCurrent((c) => c + 1);
        setSelected(null);
        setRevealed(false);
      }
    }
  }

  function skip() {
    const updated = [...answers];
    updated[current] = { questionId: questions[current].id, selectedIndex: null };
    setAnswers(updated);
    if (current + 1 >= questions.length) {
      finish(questions, updated, studyLevel, classRating, schoolRating);
    } else {
      setCurrent((c) => c + 1);
      setSelected(null);
      setRevealed(false);
    }
  }

  if (!questions.length) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">Chargement...</div>
      </div>
    );
  }

  const q = questions[current];
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const isUrgent = timeLeft < 120;
  const progress = ((current) / questions.length) * 100;

  return (
    <main className="min-h-screen flex flex-col items-center justify-start p-6 pt-8">
      <div className="w-full max-w-xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500 font-medium">
            Question {current + 1} / {questions.length}
          </div>
          <div className={`font-mono font-bold text-lg px-3 py-1 rounded-lg ${
            isUrgent ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"
          }`}>
            {mins}:{secs}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Theme badge */}
        <div className="flex gap-2 items-center">
          <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium capitalize">
            {q.theme}
          </span>
          <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full capitalize">
            {q.level === "college" ? "Collège" : q.level === "lycee" ? "Lycée" : q.level === "bac" ? "Terminale/Bac" : "Bac+"}
          </span>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-900 font-medium text-lg leading-relaxed">{q.question}</p>
        </div>

        {/* Choices */}
        <div className="space-y-3">
          {q.choices.map((choice, idx) => {
            let style = "border-gray-200 bg-white text-gray-700 hover:border-indigo-300";
            if (revealed) {
              if (idx === q.answer) style = "border-emerald-500 bg-emerald-50 text-emerald-800";
              else if (idx === selected) style = "border-red-400 bg-red-50 text-red-700";
              else style = "border-gray-100 bg-gray-50 text-gray-400";
            } else if (selected === idx) {
              style = "border-indigo-600 bg-indigo-50 text-indigo-800";
            }

            return (
              <button
                key={idx}
                onClick={() => selectAnswer(idx)}
                disabled={revealed}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${style}`}
              >
                <span className="font-bold mr-3">{["A", "B", "C", "D"][idx]}.</span>
                {choice}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {revealed && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
            <strong>Explication :</strong> {q.explanation}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!revealed && (
            <button
              onClick={skip}
              className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-gray-300 font-medium text-sm"
            >
              Passer
            </button>
          )}
          <button
            onClick={validate}
            disabled={!revealed && selected === null}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {revealed
              ? current + 1 >= questions.length
                ? "Voir mes résultats →"
                : "Question suivante →"
              : "Valider"}
          </button>
        </div>
      </div>
    </main>
  );
}
