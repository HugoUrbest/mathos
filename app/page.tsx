"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudyLevel, STUDY_LEVEL_LABELS, SelfRating } from "@/lib/types";

type Step = "welcome" | "level" | "class" | "school";

const RATINGS: { value: SelfRating; label: string; desc: string; emoji: string }[] = [
  { value: "bon", label: "Bon", desc: "Je m'en sors bien, souvent au-dessus de la moyenne", emoji: "💪" },
  { value: "moyen", label: "Moyen", desc: "Dans la moyenne, ni vraiment fort ni vraiment faible", emoji: "😐" },
  { value: "faible", label: "Faible", desc: "J'ai du mal, souvent en dessous de la moyenne", emoji: "😬" },
];

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedLevel, setSelectedLevel] = useState<StudyLevel | null>(null);
  const [classRating, setClassRating] = useState<SelfRating | null>(null);
  const [schoolRating, setSchoolRating] = useState<SelfRating | null>(null);

  const levels = Object.entries(STUDY_LEVEL_LABELS) as [StudyLevel, string][];

  function startQuiz() {
    if (!selectedLevel || !classRating || !schoolRating) return;
    localStorage.setItem("mathos_pending_level", selectedLevel);
    localStorage.setItem("mathos_pending_class_rating", classRating);
    localStorage.setItem("mathos_pending_school_rating", schoolRating);
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
            <StepIndicator current={1} total={3} />
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

            <div className="flex gap-3">
              <button onClick={() => setStep("welcome")} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-medium">
                ← Retour
              </button>
              <button
                onClick={() => setStep("class")}
                disabled={!selectedLevel}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl transition-colors"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {step === "class" && (
          <div className="space-y-6">
            <StepIndicator current={2} total={3} />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Dans ta classe</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Comment tu te situes en maths par rapport à tes camarades de classe ?
              </p>
            </div>

            <div className="space-y-3">
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setClassRating(r.value)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    classRating === r.value
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.emoji}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{r.label}</div>
                      <div className="text-sm text-gray-500">{r.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("level")} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-medium">
                ← Retour
              </button>
              <button
                onClick={() => setStep("school")}
                disabled={!classRating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl transition-colors"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}

        {step === "school" && (
          <div className="space-y-6">
            <StepIndicator current={3} total={3} />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Dans ton établissement</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Et par rapport à l&apos;ensemble des élèves de ton lycée / école ?
              </p>
            </div>

            <div className="space-y-3">
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setSchoolRating(r.value)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    schoolRating === r.value
                      ? "border-indigo-600 bg-indigo-50"
                      : "border-gray-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{r.emoji}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{r.label}</div>
                      <div className="text-sm text-gray-500">{r.desc}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep("class")} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-medium">
                ← Retour
              </button>
              <button
                onClick={startQuiz}
                disabled={!schoolRating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl transition-colors"
              >
                Lancer le quiz →
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-2 rounded-full transition-all ${
            i + 1 === current ? "w-6 bg-indigo-600" :
            i + 1 < current ? "w-2 bg-indigo-300" : "w-2 bg-gray-200"
          }`}
        />
      ))}
      <span className="text-xs text-gray-400 ml-1">{current}/{total}</span>
    </div>
  );
}
