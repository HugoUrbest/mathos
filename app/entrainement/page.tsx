"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Theme, Level, StudyLevel, SelfRating, THEME_LABELS, THEME_EMOJIS } from "@/lib/types";
import {
  getTrainingQuestions, getLevelForStudyLevel, computeResult, saveResult,
} from "@/lib/quiz";
import type { Question, Answer } from "@/lib/types";

const THEMES = Object.entries(THEME_LABELS) as [Theme, string][];

export default function EntrainementPage() {
  const router = useRouter();
  const [phase, setPhase]       = useState<"choose" | "quiz" | "done">("choose");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState<Answer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [studyLevel,   setStudyLevel]   = useState<StudyLevel>("terminale");
  const [classRating,  setClassRating]  = useState<SelfRating>("moyen");
  const [schoolRating, setSchoolRating] = useState<SelfRating>("moyen");
  const [trainingLevel, setTrainingLevel] = useState<Level>("bac");

  useEffect(() => {
    const sl = (localStorage.getItem("mathos_pending_level")         as StudyLevel) || "terminale";
    const cr = (localStorage.getItem("mathos_pending_class_rating")  as SelfRating) || "moyen";
    const sr = (localStorage.getItem("mathos_pending_school_rating") as SelfRating) || "moyen";
    setStudyLevel(sl); setClassRating(cr); setSchoolRating(sr);
    setTrainingLevel(getLevelForStudyLevel(sl));
  }, []);

  function startTraining() {
    if (!selectedTheme) return;
    const qs = getTrainingQuestions(selectedTheme, trainingLevel);
    setQuestions(qs);
    setAnswers(qs.map((q) => ({ questionId: q.id, selectedIndex: null })));
    setCurrent(0); setSelected(null); setRevealed(false);
    setPhase("quiz");
  }

  const finish = useCallback((qs: Question[], ans: Answer[]) => {
    const result = computeResult(ans, qs, studyLevel, classRating, schoolRating, "", "entrainement", selectedTheme!, trainingLevel);
    saveResult(result);
    localStorage.setItem("mathos_last_result", JSON.stringify(result));
    setPhase("done");
  }, [studyLevel, classRating, schoolRating, selectedTheme, trainingLevel]);

  function validate() {
    if (!revealed && selected === null) return;
    if (!revealed) {
      setRevealed(true);
      const updated = [...answers];
      updated[current] = { questionId: questions[current].id, selectedIndex: selected };
      setAnswers(updated);
    } else {
      if (current + 1 >= questions.length) finish(questions, answers);
      else { setCurrent((c) => c + 1); setSelected(null); setRevealed(false); }
    }
  }

  function skip() {
    const updated = [...answers];
    updated[current] = { questionId: questions[current].id, selectedIndex: null };
    setAnswers(updated);
    if (current + 1 >= questions.length) finish(questions, updated);
    else { setCurrent((c) => c + 1); setSelected(null); setRevealed(false); }
  }

  // ── Choix du thème ──────────────────────────────────────────────────────────
  if (phase === "choose") return (
    <main className="min-h-screen flex flex-col items-center p-6 pt-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">←</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Entraînement</h1>
            <p className="text-sm text-gray-500">10 questions · niveau <span className="font-semibold text-indigo-600">{trainingLevel === "college" ? "Collège" : trainingLevel === "lycee" ? "Lycée" : trainingLevel === "bac" ? "Bac" : "Bac+"}</span></p>
          </div>
        </div>

        <p className="text-gray-600 text-sm">Choisis le thème sur lequel tu veux t&apos;entraîner :</p>

        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(([key, label]) => (
            <button key={key} onClick={() => setSelectedTheme(key)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                selectedTheme === key ? "border-indigo-600 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-300"
              }`}>
              <div className="text-2xl mb-1">{THEME_EMOJIS[key]}</div>
              <div className="font-semibold text-gray-900 text-sm">{label}</div>
            </button>
          ))}
        </div>

        <button onClick={startTraining} disabled={!selectedTheme}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl transition-colors">
          Lancer l&apos;entraînement →
        </button>
      </div>
    </main>
  );

  // ── Quiz entraînement ───────────────────────────────────────────────────────
  if (phase === "quiz") {
    if (!questions.length) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Chargement…</div></div>;
    const q = questions[current];
    return (
      <main className="min-h-screen flex flex-col items-center p-6 pt-8">
        <div className="w-full max-w-xl space-y-5">

          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-400 font-medium">💪 Entraînement · {THEME_LABELS[selectedTheme!]}</div>
              <div className="text-sm text-gray-600 font-semibold">Question {current + 1} / {questions.length}</div>
            </div>
            <div className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
              {trainingLevel === "college" ? "Collège" : trainingLevel === "lycee" ? "Lycée" : trainingLevel === "bac" ? "Bac" : "Bac+"}
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${(current / questions.length) * 100}%` }} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-900 font-medium text-lg leading-relaxed">{q.question}</p>
          </div>

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

          {revealed && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
              <strong>Explication :</strong> {q.explanation}
            </div>
          )}

          <div className="flex gap-3">
            {!revealed && <button onClick={skip} className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-medium text-sm">Passer</button>}
            <button onClick={validate} disabled={!revealed && selected === null}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors">
              {revealed ? (current + 1 >= questions.length ? "Voir mes résultats →" : "Suivant →") : "Valider"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Fin de session d'entraînement ───────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="text-5xl">🎯</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Session terminée !</h2>
          <p className="text-gray-500 mt-1">Tes résultats ont été ajoutés à ton radar</p>
        </div>
        <div className="flex flex-col gap-3">
          <button onClick={() => { setPhase("choose"); setSelectedTheme(null); }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition-colors">
            Nouvel entraînement →
          </button>
          <button onClick={() => router.push("/resultats")}
            className="w-full border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-medium py-4 rounded-2xl transition-colors">
            Voir le détail des résultats
          </button>
          <button onClick={() => router.push("/stats")}
            className="w-full border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-medium py-4 rounded-2xl transition-colors">
            📊 Mes statistiques
          </button>
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 text-sm">← Accueil</button>
        </div>
      </div>
    </main>
  );
}
