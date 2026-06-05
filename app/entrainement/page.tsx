"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Theme, Level, StudyLevel, SelfRating, THEME_LABELS, THEME_EMOJIS } from "@/lib/types";
import { getTrainingQuestions, getLevelForStudyLevel, computeResult, saveResult, getStoredProfile } from "@/lib/quiz";
import type { Answer, Question } from "@/lib/types";
import QuizEngine, { levelLabel } from "@/components/QuizEngine";

const THEMES = Object.entries(THEME_LABELS) as [Theme, string][];

type Phase = "choose" | "quiz" | "done";

export default function EntrainementPage() {
  const router = useRouter();
  const [phase, setPhase]             = useState<Phase>("choose");
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [profile, setProfile]         = useState<{ sl: StudyLevel; cr: SelfRating; sr: SelfRating }>({
    sl: "terminale", cr: "moyen", sr: "moyen",
  });
  const [trainingLevel, setTrainingLevel] = useState<Level>("bac");

  useEffect(() => {
    const { studyLevel: sl, classRating: cr, schoolRating: sr } = getStoredProfile();
    setProfile({ sl, cr, sr });
    setTrainingLevel(getLevelForStudyLevel(sl));
  }, []);

  function startTraining() {
    if (!selectedTheme) return;
    setQuestions(getTrainingQuestions(selectedTheme, trainingLevel));
    setPhase("quiz");
  }

  const handleFinish = useCallback((answers: Answer[]) => {
    if (!selectedTheme) return;
    const result = computeResult(
      answers, questions,
      profile.sl, profile.cr, profile.sr, "",
      "entrainement", selectedTheme, trainingLevel,
    );
    saveResult(result);
    localStorage.setItem("mathos_last_result", JSON.stringify(result));
    setPhase("done");
  }, [questions, profile, selectedTheme, trainingLevel]);

  // ── Sélection du thème ────────────────────────────────────────────────────
  if (phase === "choose") return (
    <main className="min-h-screen flex flex-col items-center p-6 pt-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600">←</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Entraînement</h1>
            <p className="text-sm text-gray-500">
              10 questions · niveau{" "}
              <span className="font-semibold text-indigo-600">{levelLabel(trainingLevel)}</span>
            </p>
          </div>
        </div>

        <p className="text-gray-600 text-sm">Choisis le thème sur lequel tu veux t&apos;entraîner :</p>

        <div className="grid grid-cols-2 gap-3">
          {THEMES.map(([key, label]) => (
            <button key={key} onClick={() => setSelectedTheme(key)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${
                selectedTheme === key
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-indigo-300"
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

  // ── Quiz ──────────────────────────────────────────────────────────────────
  if (phase === "quiz") return (
    <QuizEngine
      questions={questions}
      modeLabel={`💪 Entraînement · ${THEME_LABELS[selectedTheme!]}`}
      onFinish={handleFinish}
    />
  );

  // ── Fin de session ────────────────────────────────────────────────────────
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl">
            Nouvel entraînement →
          </button>
          <button onClick={() => router.push("/resultats")}
            className="w-full border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-medium py-4 rounded-2xl">
            Voir le détail des résultats
          </button>
          <button onClick={() => router.push("/stats")}
            className="w-full border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-medium py-4 rounded-2xl">
            📊 Mes statistiques
          </button>
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Accueil
          </button>
        </div>
      </div>
    </main>
  );
}
