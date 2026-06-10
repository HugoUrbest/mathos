"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Answer, StudyLevel, Question, Level, STUDY_LEVEL_LABELS, StudyLevel as SL } from "@/lib/types";
import { getStoredProfile, getLevelForStudyLevel } from "@/lib/profile";
import { createClient } from "@/lib/supabase/client";
import QuizEngine from "@/components/QuizEngine";

type Phase = "access" | "level" | "instructions" | "quiz" | "done";

const LEVEL_LABELS: Record<Level, string> = {
  primaire:  "Primaire (CE2–CM2)",
  college:   "Collège (6ème–3ème)",
  lycee:     "Lycée (Seconde–Première)",
  bac:       "Terminale / Bac",
  bac_plus:  "Bac+1 et supérieur",
};

const INSTRUCTIONS = [
  ["⏱", "50 minutes",        "Le chrono démarre dès que vous cliquez sur Commencer"],
  ["❌", "Pas de retour",     "Impossible de revenir sur une question précédente"],
  ["🖥", "Plein écran",       "L'application passera en plein écran automatiquement"],
  ["⚠️", "Onglet actif",     "Chaque sortie de fenêtre est notée dans le rapport"],
  ["📊", "+3 / -1",           "Bonne réponse : +3 pts | Mauvaise : -1 pt | Passée : 0"],
  ["🏅", "Résultat certifié", "Certificat PDF généré avec identifiant unique vérifiable"],
];

export default function ExamenPage() {
  const router = useRouter();
  const supabase = createClient();

  const [phase, setPhase]             = useState<Phase>("access");
  const [accessMode, setAccessMode]   = useState<"token" | "pay" | null>(null);
  const [tokenCode, setTokenCode]     = useState("");
  const [tokenError, setTokenError]   = useState("");
  const [tokenLevel, setTokenLevel]   = useState<Level | null>(null); // niveau imposé par recruteur
  const [selectedLevel, setSelectedLevel] = useState<Level>("bac");
  const [questions, setQuestions]     = useState<Question[]>([]);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [sessionId, setSessionId]     = useState<string | null>(null);
  const [starting, setStarting]       = useState(false);
  const [startError, setStartError]   = useState("");
  const [resultId, setResultId]       = useState<string | null>(null);
  const [studyLevel, setStudyLevel]   = useState<StudyLevel>("terminale");
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    const { studyLevel: sl } = getStoredProfile();
    setStudyLevel(sl);
    setSelectedLevel(getLevelForStudyLevel(sl));
  }, []);

  // Détection sortie d'onglet
  useEffect(() => {
    if (phase !== "quiz") return;
    const handler = () => { if (document.hidden) setTabWarnings(w => w + 1); };
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [phase]);

  async function validateToken() {
    setTokenError("");
    const code = tokenCode.trim().toUpperCase();
    if (code.length !== 8) { setTokenError("Le code doit avoir 8 caractères"); return; }
    const { data, error } = await supabase.from("tokens")
      .select("*").eq("code", code).is("used_at", null).single();
    if (error || !data)                        { setTokenError("Token invalide ou déjà utilisé"); return; }
    if (new Date(data.expires_at) < new Date()) { setTokenError("Ce token est expiré"); return; }

    // Si le recruteur a imposé un niveau
    if (data.level) {
      setTokenLevel(data.level as Level);
      setSelectedLevel(data.level as Level);
      setPhase("instructions");
    } else {
      setTokenLevel(null);
      setPhase("level");
    }
  }

  function confirmLevel() {
    setPhase("instructions");
  }

  // Démarrage : c'est le SERVEUR qui tire les 50 questions (sans les réponses)
  // et ouvre une session d'examen. Le navigateur ne voit jamais les bonnes réponses.
  async function startTest() {
    if (starting) return;
    setStarting(true);
    setStartError("");
    try {
      const res = await fetch("/api/exam/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenCode: tokenCode.trim().toUpperCase(),
          level: tokenLevel ?? selectedLevel,
          studyLevel,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStartError(data.error || "Impossible de démarrer l'examen");
        return;
      }
      setSessionId(data.sessionId);
      setQuestions(data.questions as Question[]); // questions expurgées (answer = -1)
      startTimeRef.current = Date.now();
      setPhase("quiz");
      document.documentElement.requestFullscreen?.().catch(() => {});
    } catch {
      setStartError("Erreur réseau — réessayez");
    } finally {
      setStarting(false);
    }
  }

  // Fin : on n'envoie que les choix. Le SERVEUR recalcule le score (source de vérité).
  const handleFinish = useCallback(async (answers: Answer[]) => {
    setPhase("done");
    document.exitFullscreen?.().catch(() => {});

    const res = await fetch("/api/exam/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        answers: answers.map((a) => a.selectedIndex),
        tabWarnings,
        studyLevel,
      }),
    });
    const data = await res.json();
    if (data.resultId) setResultId(data.resultId);
  }, [sessionId, tabWarnings, studyLevel]);

  // ── Accès ─────────────────────────────────────────────────────────────────
  if (phase === "access") return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🏅</div>
          <h1 className="text-2xl font-bold text-gray-900">Examen Certifiant</h1>
          <p className="text-gray-500 mt-1 text-sm">50 questions · tous thèmes · 50 min · certificat PDF</p>
        </div>

        {/* Option 1 : code recruteur */}
        <div className={`bg-white border-2 rounded-2xl p-5 space-y-3 transition-all ${accessMode === "token" ? "border-indigo-500" : "border-gray-200"}`}>
          <div className="font-semibold text-gray-900">🔑 J&apos;ai un code recruteur</div>
          <input
            value={tokenCode}
            onChange={e => { setTokenCode(e.target.value.toUpperCase()); setAccessMode("token"); }}
            onFocus={() => setAccessMode("token")}
            maxLength={8} placeholder="CODE8CAR"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest focus:border-indigo-500 outline-none uppercase"
          />
          {tokenError && <p className="text-red-500 text-sm text-center">{tokenError}</p>}
          <button
            onClick={validateToken}
            disabled={tokenCode.length !== 8}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Valider le code →
          </button>
        </div>

        {/* Séparateur */}
        <div className="flex items-center gap-3 text-gray-400 text-sm">
          <div className="flex-1 h-px bg-gray-200" />
          ou
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Option 2 : paiement */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 space-y-3">
          <div className="font-semibold text-gray-900">💳 Passer l&apos;examen en autonomie</div>
          <div className="text-sm text-gray-600">Accès individuel sans recruteur · résultat certifié identique</div>
          <div className="text-2xl font-black text-amber-600">50 €</div>
          <button
            disabled
            className="w-full bg-amber-100 text-amber-400 font-semibold py-3 rounded-xl cursor-not-allowed text-sm"
          >
            🔜 Bientôt disponible
          </button>
        </div>

        <button onClick={() => router.push("/")} className="w-full text-center text-gray-400 hover:text-gray-600 text-sm">
          ← Retour à l&apos;accueil
        </button>
      </div>
    </main>
  );

  // ── Choix du niveau ───────────────────────────────────────────────────────
  if (phase === "level") return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">🎯</div>
          <h1 className="text-2xl font-bold">Choisissez votre niveau</h1>
          <p className="text-sm text-gray-500 mt-1">Les questions seront adaptées à votre niveau</p>
        </div>
        <div className="space-y-2">
          {(Object.entries(LEVEL_LABELS) as [Level, string][])
            .filter(([k]) => k !== "primaire")
            .map(([key, label]) => (
              <button key={key} onClick={() => setSelectedLevel(key)}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all font-medium ${
                  selectedLevel === key ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
                }`}>
                {label}
              </button>
            ))}
        </div>
        <button onClick={confirmLevel}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl">
          Confirmer → Voir les instructions
        </button>
      </div>
    </main>
  );

  // ── Instructions ──────────────────────────────────────────────────────────
  if (phase === "instructions") return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="text-4xl mb-2">📋</div>
          <h1 className="text-2xl font-bold">Instructions</h1>
          {tokenLevel && (
            <p className="text-sm text-indigo-600 mt-1 font-medium">Niveau imposé : {LEVEL_LABELS[tokenLevel]}</p>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 text-sm text-gray-700">
          {INSTRUCTIONS.map(([icon, title, desc]) => (
            <div key={title} className="flex gap-3">
              <span className="text-xl shrink-0">{icon}</span>
              <div><span className="font-semibold">{title}</span> — {desc}</div>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          Ce test est marqué <strong>Non surveillé</strong>. Pour un test supervisé, contactez votre recruteur.
        </div>
        {startError && (
          <p className="text-red-500 text-sm text-center">{startError}</p>
        )}
        <button onClick={startTest} disabled={starting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white font-bold py-4 rounded-2xl text-lg transition-colors">
          {starting ? "Préparation…" : "Commencer l’examen →"}
        </button>
      </div>
    </main>
  );

  // ── Quiz ──────────────────────────────────────────────────────────────────
  if (phase === "quiz") return (
    <QuizEngine
      questions={questions}
      modeLabel="🏅 EXAMEN CERTIFIANT"
      totalSeconds={50 * 60}
      strictMode
      banner={tabWarnings > 0 ? (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-700 text-center">
          ⚠️ Vous avez quitté la fenêtre {tabWarnings} fois — cela apparaîtra dans votre rapport
        </div>
      ) : undefined}
      onFinish={handleFinish}
    />
  );

  // ── Terminé ───────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-6">
        <div className="text-6xl">🏅</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Examen terminé !</h2>
          <p className="text-gray-500 mt-1">Votre résultat est enregistré et certifié</p>
        </div>
        {tabWarnings > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800">
            ⚠️ {tabWarnings} sortie(s) de fenêtre détectée(s) — mentionné dans le rapport
          </div>
        )}
        <div className="space-y-3">
          {resultId && (
            <a href={`/verify?id=${resultId}`} target="_blank"
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl">
              📄 Voir mon certificat →
            </a>
          )}
          <button onClick={() => router.push("/")}
            className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-medium py-3 rounded-2xl text-sm">
            ← Accueil
          </button>
        </div>
      </div>
    </main>
  );
}
