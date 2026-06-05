"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Answer, StudyLevel, Question } from "@/lib/types";
import { getGrandTestQuestions, computeScore, computeThemeScores, getStoredProfile } from "@/lib/quiz";
import { createClient } from "@/lib/supabase/client";
import QuizEngine from "@/components/QuizEngine";

type Phase = "token" | "instructions" | "quiz" | "done";

const INSTRUCTIONS = [
  ["⏱", "30 minutes",     "Le chrono démarre dès que vous cliquez sur Commencer"],
  ["❌", "Pas de retour",  "Impossible de revenir sur une question précédente"],
  ["🖥", "Plein écran",    "L'application passera en plein écran automatiquement"],
  ["⚠️", "Onglet actif",  "Chaque fois que vous quittez l'onglet, c'est noté dans le rapport"],
  ["📊", "+3 / -1",        "Bonne réponse : +3 pts | Mauvaise : -1 pt | Passée : 0"],
  ["🏅", "Résultat certifié", "Résultat enregistré avec identifiant unique vérifiable"],
];

export default function TestOfficielPage() {
  const router = useRouter();
  const supabase = createClient();

  const [phase, setPhase]           = useState<Phase>("token");
  const [tokenCode, setTokenCode]   = useState("");
  const [tokenError, setTokenError] = useState("");
  const [questions]                 = useState<Question[]>(() => getGrandTestQuestions());
  const [tabWarnings, setTabWarnings] = useState(0);
  const [startedAt, setStartedAt]   = useState("");
  const [resultId, setResultId]     = useState<string | null>(null);
  const [studyLevel, setStudyLevel] = useState<StudyLevel>("terminale");
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setStudyLevel(getStoredProfile().studyLevel);
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
    if (error || !data)           { setTokenError("Token invalide ou déjà utilisé"); return; }
    if (new Date(data.expires_at) < new Date()) { setTokenError("Ce token est expiré"); return; }
    setPhase("instructions");
  }

  function startTest() {
    const now = new Date().toISOString();
    setStartedAt(now);
    startTimeRef.current = Date.now();
    setPhase("quiz");
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  const handleFinish = useCallback(async (answers: Answer[]) => {
    setPhase("done");
    document.exitFullscreen?.().catch(() => {});

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    const score = computeScore(answers, questions);
    const themeScores = computeThemeScores(answers, questions);

    const res = await fetch("/api/official-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenCode: tokenCode.trim().toUpperCase(),
        score,
        maxScore: questions.length * 3,
        themeScores,
        questionsCount: questions.length,
        durationSeconds: duration,
        studyLevel,
        startedAt,
      }),
    });
    const data = await res.json();
    if (data.resultId) setResultId(data.resultId);
  }, [questions, tokenCode, studyLevel, startedAt]);

  // ── Token ──────────────────────────────────────────────────────────────────
  if (phase === "token") return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="text-5xl">🔑</div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Officiel Mathos</h1>
          <p className="text-gray-500 mt-1 text-sm">Entrez votre code d&apos;accès pour commencer</p>
        </div>
        <div className="space-y-3">
          <input value={tokenCode} onChange={e => setTokenCode(e.target.value.toUpperCase())}
            maxLength={8} placeholder="CODE8CAR"
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-4 text-center text-2xl font-mono tracking-widest focus:border-indigo-500 outline-none uppercase" />
          {tokenError && <p className="text-red-500 text-sm">{tokenError}</p>}
          <button onClick={validateToken}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl">
            Valider le code →
          </button>
        </div>
        <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 text-sm">← Retour</button>
      </div>
    </main>
  );

  // ── Instructions ──────────────────────────────────────────────────────────
  if (phase === "instructions") return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center"><div className="text-4xl mb-2">📋</div>
          <h1 className="text-2xl font-bold">Instructions</h1>
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
          Ce test est marqué <strong>Non surveillé</strong>. Pour un test supervisé, contactez un administrateur Mathos.
        </div>
        <button onClick={startTest}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl text-lg">
          Commencer le test →
        </button>
      </div>
    </main>
  );

  // ── Quiz ──────────────────────────────────────────────────────────────────
  if (phase === "quiz") return (
    <QuizEngine
      questions={questions}
      modeLabel="🏅 TEST OFFICIEL"
      totalSeconds={30 * 60}
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
          <h2 className="text-2xl font-bold text-gray-900">Test terminé !</h2>
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
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 text-sm">← Accueil</button>
        </div>
      </div>
    </main>
  );
}
