"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudyLevel, STUDY_LEVEL_LABELS } from "@/lib/types";

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<"welcome" | "level">("welcome");
  const [selectedLevel, setSelectedLevel] = useState<StudyLevel | null>(null);

  const levels = Object.entries(STUDY_LEVEL_LABELS) as [StudyLevel, string][];

  function startQuiz() {
    if (!selectedLevel) return;
    localStorage.setItem("mathos_pending_level", selectedLevel);
    router.push("/quiz");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {step === "welcome" && (
          <div className="text-center space-y-8">
            <div>
              <div className="text-6xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Mathos
              </div>
              <p className="mt-3 text-gray-500 text-lg">
                Évalue ton niveau en maths et situe-toi par rapport à tes pairs
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              {[
                { icon: "🧠", title: "20 questions", desc: "Tous thèmes confondus" },
                { icon: "⏱", title: "30 minutes", desc: "Chrono inclus" },
                { icon: "📊", title: "Radar détaillé", desc: "Par thème mathématique" },
              ].map((f) => (
                <div key={f.title} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
                  <div className="text-2xl">{f.icon}</div>
                  <div className="font-semibold mt-1">{f.title}</div>
                  <div className="text-gray-400 text-xs mt-1">{f.desc}</div>
                </div>
              ))}
            </div>

            <div className="bg-indigo-50 rounded-2xl p-4 text-sm text-indigo-700 text-left">
              <strong>Notation :</strong> +3 points par bonne réponse, -1 par mauvaise, 0 si non répondu.
            </div>

            <button
              onClick={() => setStep("level")}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl text-lg transition-colors shadow-lg shadow-indigo-200"
            >
              Commencer →
            </button>
          </div>
        )}

        {step === "level" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Ton niveau d&apos;études</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Sert uniquement à te comparer avec des personnes du même niveau
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {levels.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedLevel(key)}
                  className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                    selectedLevel === key
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={startQuiz}
              disabled={!selectedLevel}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl text-lg transition-colors"
            >
              Lancer le quiz →
            </button>

            <button
              onClick={() => setStep("welcome")}
              className="w-full text-gray-400 hover:text-gray-600 text-sm"
            >
              ← Retour
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
