"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { StudyLevel, STUDY_LEVEL_LABELS, SelfRating } from "@/lib/types";

type Step = "welcome" | "level" | "class" | "school";

const RATINGS: { value: SelfRating; label: string; desc: string; emoji: string }[] = [
  { value: "bon",    label: "Bon",    desc: "Je m'en sors bien, souvent au-dessus de la moyenne", emoji: "💪" },
  { value: "moyen",  label: "Moyen",  desc: "Dans la moyenne, ni vraiment fort ni vraiment faible", emoji: "😐" },
  { value: "faible", label: "Faible", desc: "J'ai du mal, souvent en dessous de la moyenne",       emoji: "😬" },
];

export default function Home() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [selectedLevel, setSelectedLevel] = useState<StudyLevel | null>(null);
  const [classRating,  setClassRating]  = useState<SelfRating | null>(null);
  const [schoolRating, setSchoolRating] = useState<SelfRating | null>(null);

  const levels = Object.entries(STUDY_LEVEL_LABELS) as [StudyLevel, string][];

  function saveProfile(target: "grand_test" | "entrainement") {
    if (!selectedLevel || !classRating || !schoolRating) return;
    localStorage.setItem("mathos_pending_level",         selectedLevel);
    localStorage.setItem("mathos_pending_class_rating",  classRating);
    localStorage.setItem("mathos_pending_school_rating", schoolRating);
    router.push(target === "grand_test" ? "/quiz" : "/entrainement");
  }

  // Profil déjà enregistré ?
  function hasProfile() {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("mathos_pending_level");
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg">

        {/* ── Accueil ── */}
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

            {/* Deux modes */}
            <div className="grid grid-cols-1 gap-4">
              <button
                onClick={() => setStep("level")}
                className="group bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-3xl p-6 text-left shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
              >
                <div className="text-3xl mb-2">🏆</div>
                <div className="font-bold text-xl">Grand Test</div>
                <div className="text-indigo-200 text-sm mt-1">
                  30 questions · tous thèmes · 30 min · horodaté
                </div>
                <div className="mt-3 text-xs bg-white/20 rounded-xl px-3 py-1 inline-block">
                  Évalue ton niveau global
                </div>
              </button>

              <button
                onClick={() => {
                  if (hasProfile()) {
                    router.push("/entrainement");
                  } else {
                    localStorage.setItem("mathos_after_profile", "entrainement");
                    setStep("level");
                  }
                }}
                className="group bg-white border-2 border-gray-200 hover:border-indigo-300 rounded-3xl p-6 text-left transition-all"
              >
                <div className="text-3xl mb-2">💪</div>
                <div className="font-bold text-xl text-gray-900">Entraînement</div>
                <div className="text-gray-500 text-sm mt-1">
                  10 questions · 1 thème · difficulté adaptée à ton niveau
                </div>
                <div className="mt-3 text-xs bg-indigo-50 text-indigo-700 rounded-xl px-3 py-1 inline-block">
                  Travaille point par point
                </div>
              </button>
            </div>

            <button
              onClick={() => router.push("/stats")}
              className="text-sm text-gray-400 hover:text-indigo-600 transition-colors"
            >
              📊 Voir mes statistiques
            </button>
          </div>
        )}

        {/* ── Étape 1 : Niveau scolaire ── */}
        {step === "level" && (
          <div className="space-y-6">
            <StepIndicator current={1} total={3} />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Ton niveau d&apos;études</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Détermine la difficulté de tes entraînements et te compare avec tes pairs
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {levels.map(([key, label]) => (
                <button key={key} onClick={() => setSelectedLevel(key)}
                  className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                    selectedLevel === key
                      ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                  }`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("welcome")} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-medium">← Retour</button>
              <button onClick={() => setStep("class")} disabled={!selectedLevel}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl transition-colors">
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 2 : Niveau en classe ── */}
        {step === "class" && (
          <div className="space-y-6">
            <StepIndicator current={2} total={3} />
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Dans ta classe</h2>
              <p className="text-gray-500 mt-1 text-sm">
                Comment tu te situes en maths par rapport à tes camarades ?
              </p>
            </div>
            <div className="space-y-3">
              {RATINGS.map((r) => (
                <button key={r.value} onClick={() => setClassRating(r.value)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    classRating === r.value ? "border-indigo-600 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-300"
                  }`}>
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
              <button onClick={() => setStep("level")} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-medium">← Retour</button>
              <button onClick={() => setStep("school")} disabled={!classRating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl transition-colors">
                Suivant →
              </button>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Niveau établissement ── */}
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
                <button key={r.value} onClick={() => setSchoolRating(r.value)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    schoolRating === r.value ? "border-indigo-600 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-300"
                  }`}>
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
              <button onClick={() => setStep("class")} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-500 text-sm font-medium">← Retour</button>
              <button onClick={() => {
                const dest = localStorage.getItem("mathos_after_profile") || "grand_test";
                localStorage.removeItem("mathos_after_profile");
                saveProfile(dest as "grand_test" | "entrainement");
              }} disabled={!schoolRating}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-4 rounded-2xl transition-colors">
                C&apos;est parti ! →
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
        <div key={i} className={`h-2 rounded-full transition-all ${
          i + 1 === current ? "w-6 bg-indigo-600" :
          i + 1 < current  ? "w-2 bg-indigo-300" : "w-2 bg-gray-200"
        }`} />
      ))}
      <span className="text-xs text-gray-400 ml-1">{current}/{total}</span>
    </div>
  );
}
