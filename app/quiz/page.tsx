"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Question, Answer, StudyLevel, SelfRating } from "@/lib/types";
import { getGrandTestQuestions, computeResult, saveResult } from "@/lib/quiz";

const TOTAL_SECONDS = 30 * 60;

export default function GrandTestPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent]     = useState(0);
  const [answers, setAnswers]     = useState<Answer[]>([]);
  const [selected, setSelected]   = useState<number | null>(null);
  const [revealed, setRevealed]   = useState(false);
  const [timeLeft, setTimeLeft]   = useState(TOTAL_SECONDS);
  const [studyLevel,  setStudyLevel]  = useState<StudyLevel>("terminale");
  const [classRating,  setClassRating]  = useState<SelfRating>("moyen");
  const [schoolRating, setSchoolRating] = useState<SelfRating>("moyen");

  const finish = useCallback((qs: Question[], ans: Answer[], sl: StudyLevel, cr: SelfRating, sr: SelfRating) => {
    const result = computeResult(ans, qs, sl, cr, sr, "", "grand_test");
    saveResult(result);
    localStorage.setItem("mathos_last_result", JSON.stringify(result));
    router.push("/resultats");
  }, [router]);

  useEffect(() => {
    const qs = getGrandTestQuestions();
    const sl = (localStorage.getItem("mathos_pending_level")         as StudyLevel) || "terminale";
    const cr = (localStorage.getItem("mathos_pending_class_rating")  as SelfRating) || "moyen";
    const sr = (localStorage.getItem("mathos_pending_school_rating") as SelfRating) || "moyen";
    setQuestions(qs);
    setStudyLevel(sl); setClassRating(cr); setSchoolRating(sr);
    setAnswers(qs.map((q) => ({ questionId: q.id, selectedIndex: null })));
  }, []);

  useEffect(() => {
    if (!questions.length || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((v) => v <= 1 ? 0 : v - 1), 1000);
    return () => clearInterval(t);
  }, [questions.length, timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0) finish(questions, answers, studyLevel, classRating, schoolRating);
  }, [timeLeft, questions, answers, studyLevel, classRating, schoolRating, finish]);

  function validate() {
    if (!revealed && selected === null) return;
    if (!revealed) {
      setRevealed(true);
      const updated = [...answers];
      updated[current] = { questionId: questions[current].id, selectedIndex: selected };
      setAnswers(updated);
    } else {
      if (current + 1 >= questions.length) finish(questions, answers, studyLevel, classRating, schoolRating);
      else { setCurrent((c) => c + 1); setSelected(null); setRevealed(false); }
    }
  }

  function skip() {
    const updated = [...answers];
    updated[current] = { questionId: questions[current].id, selectedIndex: null };
    setAnswers(updated);
    if (current + 1 >= questions.length) finish(questions, updated, studyLevel, classRating, schoolRating);
    else { setCurrent((c) => c + 1); setSelected(null); setRevealed(false); }
  }

  if (!questions.length) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Chargement…</div></div>;

  const q = questions[current];
  const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const secs = (timeLeft % 60).toString().padStart(2, "0");
  const isUrgent = timeLeft < 120;

  return (
    <main className="min-h-screen flex flex-col items-center p-6 pt-8">
      <div className="w-full max-w-xl space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-medium">🏆 Grand Test</div>
            <div className="text-sm text-gray-600 font-semibold">Question {current + 1} / {questions.length}</div>
          </div>
          <div className={`font-mono font-bold text-lg px-3 py-1 rounded-xl ${isUrgent ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-700"}`}>
            {mins}:{secs}
          </div>
        </div>

        {/* Barre de progression */}
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${(current / questions.length) * 100}%` }} />
        </div>

        {/* Badges */}
        <div className="flex gap-2">
          <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium capitalize">{q.theme}</span>
          <span className="text-xs bg-gray-100 text-gray-500 px-3 py-1 rounded-full capitalize">
            {q.level === "college" ? "Collège" : q.level === "lycee" ? "Lycée" : q.level === "bac" ? "Bac" : "Bac+"}
          </span>
        </div>

        {/* Question */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <p className="text-gray-900 font-medium text-lg leading-relaxed">{q.question}</p>
        </div>

        {/* Réponses */}
        <div className="space-y-3">
          {q.choices.map((choice, idx) => {
            let style = "border-gray-200 bg-white text-gray-700 hover:border-indigo-300";
            if (revealed) {
              if (idx === q.answer) style = "border-emerald-500 bg-emerald-50 text-emerald-800";
              else if (idx === selected) style = "border-red-400 bg-red-50 text-red-700";
              else style = "border-gray-100 bg-gray-50 text-gray-400";
            } else if (selected === idx) style = "border-indigo-600 bg-indigo-50 text-indigo-800";
            return (
              <button key={idx} onClick={() => !revealed && setSelected(idx)} disabled={revealed}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${style}`}>
                <span className="font-bold mr-3">{["A","B","C","D"][idx]}.</span>{choice}
              </button>
            );
          })}
        </div>

        {/* Explication */}
        {revealed && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
            <strong>Explication :</strong> {q.explanation}
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-3">
          {!revealed && (
            <button onClick={skip} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 hover:border-gray-300 font-medium text-sm">Passer</button>
          )}
          <button onClick={validate} disabled={!revealed && selected === null}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors">
            {revealed ? (current + 1 >= questions.length ? "Voir mes résultats →" : "Suivant →") : "Valider"}
          </button>
        </div>
      </div>
    </main>
  );
}
