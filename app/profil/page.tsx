"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  StudyLevel, STUDY_LEVEL_LABELS, SelfRating, SELF_RATING_LABELS,
} from "@/lib/types";
import { getStoredProfile } from "@/lib/quiz";

const RATINGS: { value: SelfRating; label: string; desc: string; emoji: string }[] = [
  { value: "bon",    label: "Bon",    desc: "Au-dessus de la moyenne",  emoji: "💪" },
  { value: "moyen",  label: "Moyen",  desc: "Dans la moyenne",          emoji: "😐" },
  { value: "faible", label: "Faible", desc: "En dessous de la moyenne", emoji: "😬" },
];

const SCHOOL_RATINGS: { value: SelfRating; label: string; desc: string; emoji: string }[] = [
  { value: "bon",    label: "Bon",    desc: "Établissement réputé fort en maths",  emoji: "💪" },
  { value: "moyen",  label: "Moyen",  desc: "Établissement dans la moyenne",        emoji: "😐" },
  { value: "faible", label: "Faible", desc: "Établissement plutôt faible en maths", emoji: "😬" },
];

const LEVELS = Object.entries(STUDY_LEVEL_LABELS) as [StudyLevel, string][];

function ProfilContent() {
  const router = useRouter();
  const params = useSearchParams();
  const isFirstTime = params.get("first") === "1";

  const [studyLevel,   setStudyLevel]   = useState<StudyLevel>("terminale");
  const [classRating,  setClassRating]  = useState<SelfRating>("moyen");
  const [schoolRating, setSchoolRating] = useState<SelfRating>("moyen");
  const [saved, setSaved]   = useState(false);
  const [editing, setEditing] = useState<"level" | "class" | "school" | null>(
    isFirstTime ? "level" : null
  );

  useEffect(() => {
    if (!isFirstTime) {
      const p = getStoredProfile();
      setStudyLevel(p.studyLevel);
      setClassRating(p.classRating);
      setSchoolRating(p.schoolRating);
    }
  }, [isFirstTime]);

  const profileComplete = !!studyLevel && !!classRating && !!schoolRating;

  function save(redirect = false) {
    localStorage.setItem("mathos_pending_level",         studyLevel);
    localStorage.setItem("mathos_pending_class_rating",  classRating);
    localStorage.setItem("mathos_pending_school_rating", schoolRating);
    setSaved(true);
    setEditing(null);
    setTimeout(() => setSaved(false), 2000);
    if (redirect) router.push("/");
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-md mx-auto space-y-6">

        {/* Header */}
        {isFirstTime ? (
          <div className="text-center space-y-2">
            <div className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              Mathos
            </div>
            <h1 className="text-xl font-bold text-gray-900">Crée ton profil</h1>
            <p className="text-gray-500 text-sm">
              Ces informations servent à adapter la difficulté et à te comparer avec tes pairs.
              Tu pourras les modifier à tout moment.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
            <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
          </div>
        )}

        {/* Niveau d'études */}
        <Section
          title="Niveau d'études"
          subtitle="Adapte la difficulté de tes entraînements"
          value={STUDY_LEVEL_LABELS[studyLevel]}
          onEdit={() => setEditing(editing === "level" ? null : "level")}
          open={editing === "level"}
          highlighted={isFirstTime && !editing}
        >
          <div className="grid grid-cols-2 gap-2 mt-3">
            {LEVELS.map(([key, label]) => (
              <button key={key} onClick={() => { setStudyLevel(key); setEditing(isFirstTime ? "class" : null); if (!isFirstTime) save(); }}
                className={`py-2.5 px-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  studyLevel === key
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300"
                }`}>
                {label}
              </button>
            ))}
          </div>
        </Section>

        {/* Niveau en classe */}
        <Section
          title="Niveau en classe"
          subtitle="En maths, par rapport à tes camarades"
          value={`${RATINGS.find(r => r.value === classRating)?.emoji} ${SELF_RATING_LABELS[classRating]}`}
          onEdit={() => setEditing(editing === "class" ? null : "class")}
          open={editing === "class"}
        >
          <div className="space-y-2 mt-3">
            {RATINGS.map(r => (
              <button key={r.value} onClick={() => { setClassRating(r.value); setEditing(isFirstTime ? "school" : null); if (!isFirstTime) save(); }}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                  classRating === r.value
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-300"
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{r.emoji}</span>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{r.label}</div>
                    <div className="text-xs text-gray-500">{r.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Niveau dans l'établissement */}
        <Section
          title="Dans l'établissement"
          subtitle="Niveau global de ton établissement en maths"
          value={`${SCHOOL_RATINGS.find(r => r.value === schoolRating)?.emoji} ${SELF_RATING_LABELS[schoolRating]}`}
          onEdit={() => setEditing(editing === "school" ? null : "school")}
          open={editing === "school"}
        >
          <div className="space-y-2 mt-3">
            {SCHOOL_RATINGS.map(r => (
              <button key={r.value} onClick={() => { setSchoolRating(r.value); setEditing(null); if (!isFirstTime) save(); }}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                  schoolRating === r.value
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 bg-white hover:border-indigo-300"
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{r.emoji}</span>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">{r.label}</div>
                    <div className="text-xs text-gray-500">{r.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Section>

        {/* Confirmation modification */}
        {saved && !isFirstTime && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 text-sm text-emerald-700 text-center font-medium">
            ✓ Profil mis à jour
          </div>
        )}

        {/* Bouton CTA premier accès */}
        {isFirstTime && (
          <button
            onClick={() => save(true)}
            disabled={!profileComplete}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-4 rounded-2xl text-lg transition-colors">
            C&apos;est parti ! →
          </button>
        )}

        {/* Bouton retour mode édition */}
        {!isFirstTime && (
          <button onClick={() => router.push("/")}
            className="w-full border-2 border-gray-200 hover:border-indigo-300 text-gray-600 font-medium py-3 rounded-2xl text-sm transition-colors">
            ← Retour à l&apos;accueil
          </button>
        )}
      </div>
    </main>
  );
}

function Section({
  title, subtitle, value, onEdit, open, highlighted = false, children,
}: {
  title: string; subtitle: string; value: string;
  onEdit: () => void; open: boolean; highlighted?: boolean; children: React.ReactNode;
}) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${
      highlighted ? "border-indigo-200" : "border-gray-100"
    }`}>
      <button onClick={onEdit} className="w-full p-4 text-left flex items-center justify-between">
        <div>
          <div className="font-semibold text-gray-900">{title}</div>
          <div className="text-xs text-gray-400 mt-0.5">{subtitle}</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-indigo-600">{value}</span>
          <span className="text-gray-300 text-xs">{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-50">{children}</div>}
    </div>
  );
}

export default function ProfilPage() {
  return (
    <Suspense>
      <ProfilContent />
    </Suspense>
  );
}
