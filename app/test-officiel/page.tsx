"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Question, Answer, StudyLevel, SelfRating } from "@/lib/types";
import { getGrandTestQuestions } from "@/lib/quiz";
import { createClient } from "@/lib/supabase/client";

const TOTAL_SECONDS = 30 * 60;

type Phase = "token" | "instructions" | "quiz" | "done";

export default function TestOfficielPage() {
  const router = useRouter();
  const [phase, setPhase]       = useState<Phase>("token");
  const [tokenCode, setTokenCode] = useState("");
  const [tokenError, setTokenError] = useState("");
  const [tokenValid, setTokenValid] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent]   = useState(0);
  const [answers, setAnswers]   = useState<Answer[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [startedAt, setStartedAt] = useState<string>("");
  const [tabWarnings, setTabWarnings] = useState(0);
  const [studyLevel, setStudyLevel] = useState<StudyLevel>("terminale");
  const startTimeRef = useRef<number>(0);
  const supabase = createClient();

  // Détection quitte l'onglet
  useEffect(() => {
    if (phase !== "quiz") return;
    const handler = () => setTabWarnings(w => w + 1);
    document.addEventListener("visibilitychange", handler);
    return () => document.removeEventListener("visibilitychange", handler);
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== "quiz") return;
    const t = setInterval(() => setTimeLeft(v => {
      if (v <= 1) { clearInterval(t); return 0; }
      return v - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [phase]);

  async function validateToken() {
    setTokenError("");
    const code = tokenCode.trim().toUpperCase();
    if (code.length !== 8) { setTokenError("Le code doit avoir 8 caractères"); return; }
    const { data, error } = await supabase.from("tokens")
      .select("*").eq("code", code).is("used_at", null).single();
    if (error || !data) { setTokenError("Token invalide ou déjà utilisé"); return; }
    if (new Date(data.expires_at) < new Date()) { setTokenError("Ce token est expiré"); return; }
    setTokenValid(true);
    setPhase("instructions");
  }

  function startTest() {
    const qs = getGrandTestQuestions();
    const sl = (localStorage.getItem("mathos_pending_level") as StudyLevel) || "terminale";
    setQuestions(qs);
    setStudyLevel(sl);
    setAnswers(qs.map(q => ({ questionId: q.id, selectedIndex: null })));
    setStartedAt(new Date().toISOString());
    startTimeRef.current = Date.now();
    setPhase("quiz");
    // Plein écran
    document.documentElement.requestFullscreen?.().catch(() => {});
  }

  const finish = useCallback(async (qs: Question[], ans: Answer[]) => {
    setPhase("done");
    document.exitFullscreen?.().catch(() => {});

    const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
    // Calculer les scores
    const themeScores: Record<string, { correct: number; total: number; score: number }> = {};
    let score = 0;
    qs.forEach((q, i) => {
      if (!themeScores[q.theme]) themeScores[q.theme] = { correct: 0, total: 0, score: 0 };
      themeScores[q.theme].total++;
      const a = ans[i];
      if (a.selectedIndex !== null) {
        if (a.selectedIndex === q.answer) { themeScores[q.theme].correct++; themeScores[q.theme].score += 3; score += 3; }
        else { themeScores[q.theme].score -= 1; score -= 1; }
      }
    });

    const res = await fetch("/api/official-result", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenCode: tokenCode.trim().toUpperCase(),
        score, maxScore: qs.length * 3,
        themeScores, questionsCount: qs.length,
        durationSeconds: duration,
        studyLevel, startedAt,
      }),
    });
    const data = await res.json();
    if (data.resultId) {
      localStorage.setItem("mathos_official_result_id", data.resultId);
    }
  }, [tokenCode, studyLevel, startedAt]);

  useEffect(() => {
    if (timeLeft === 0 && questions.length > 0) finish(questions, answers);
  }, [timeLeft, questions, answers, finish]);

  function selectAndNext(idx: number) {
    const updated = [...answers];
    updated[current] = { questionId: questions[current].id, selectedIndex: idx };
    setAnswers(updated);
    if (current + 1 >= questions.length) finish(questions, updated);
    else { setCurrent(c => c + 1); setSelected(null); }
  }

  function skip() {
    const updated = [...answers];
    updated[current] = { questionId: questions[current].id, selectedIndex: null };
    setAnswers(updated);
    if (current + 1 >= questions.length) finish(questions, updated);
    else { setCurrent(c => c + 1); setSelected(null); }
  }

  // ── Saisie du token ───────────────────────────────────────────────────────
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
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition-colors">
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
        <div className="text-center">
          <div className="text-4xl mb-2">📋</div>
          <h1 className="text-2xl font-bold text-gray-900">Instructions</h1>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3 text-sm text-gray-700">
          {[
            ["⏱", "30 minutes", "Le chrono démarre dès que vous cliquez sur Commencer"],
            ["❌", "Pas de retour", "Impossible de revenir sur une question précédente"],
            ["🖥", "Plein écran", "L'application passera en plein écran automatiquement"],
            ["⚠️", "Onglet actif", "Chaque fois que vous quittez l'onglet, c'est noté dans le rapport"],
            ["📊", "+3 / -1", "Bonne réponse : +3 pts | Mauvaise : -1 pt | Passée : 0"],
            ["🏅", "Résultat certifié", "Votre résultat sera enregistré avec un identifiant unique vérifiable"],
          ].map(([icon, title, desc]) => (
            <div key={title as string} className="flex gap-3">
              <span className="text-xl shrink-0">{icon}</span>
              <div><span className="font-semibold">{title}</span> — {desc}</div>
            </div>
          ))}
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          Ce test est marqué <strong>Non surveillé</strong> dans votre certificat. Pour un test supervisé, contactez un administrateur Mathos.
        </div>
        <button onClick={startTest}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-colors text-lg">
          Commencer le test →
        </button>
      </div>
    </main>
  );

  // ── Quiz ──────────────────────────────────────────────────────────────────
  if (phase === "quiz") {
    if (!questions.length) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Chargement…</div></div>;
    const q = questions[current];
    const mins = Math.floor(timeLeft / 60).toString().padStart(2, "0");
    const secs = (timeLeft % 60).toString().padStart(2, "0");
    const isUrgent = timeLeft < 120;

    return (
      <div className="min-h-screen flex flex-col items-center p-6 pt-6 bg-gray-50">
        {tabWarnings > 0 && (
          <div className="w-full max-w-xl mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-2 text-sm text-red-700 text-center">
            ⚠️ Vous avez quitté la fenêtre {tabWarnings} fois — cela apparaîtra dans votre rapport
          </div>
        )}
        <div className="w-full max-w-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-indigo-600 font-bold">🏅 TEST OFFICIEL</div>
              <div className="text-sm font-semibold text-gray-700">Question {current + 1} / {questions.length}</div>
            </div>
            <div className={`font-mono font-bold text-xl px-4 py-2 rounded-xl ${isUrgent ? "bg-red-100 text-red-600 animate-pulse" : "bg-white border border-gray-200 text-gray-700"}`}>
              {mins}:{secs}
            </div>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-indigo-500 h-1.5 rounded-full transition-all" style={{ width: `${(current / questions.length) * 100}%` }} />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <p className="text-gray-900 font-medium text-lg leading-relaxed">{q.question}</p>
          </div>

          <div className="space-y-3">
            {q.choices.map((choice, idx) => (
              <button key={idx} onClick={() => selectAndNext(idx)}
                className={`w-full text-left px-5 py-4 rounded-xl border-2 font-medium transition-all ${
                  selected === idx ? "border-indigo-600 bg-indigo-50" : "border-gray-200 bg-white hover:border-indigo-300"
                }`}>
                <span className="font-bold mr-3">{["A","B","C","D"][idx]}.</span>{choice}
              </button>
            ))}
          </div>

          <button onClick={skip}
            className="w-full py-3 border-2 border-gray-200 text-gray-400 hover:border-gray-300 rounded-xl text-sm">
            Passer cette question (0 point)
          </button>
        </div>
      </div>
    );
  }

  // ── Terminé ───────────────────────────────────────────────────────────────
  const resultId = typeof window !== "undefined" ? localStorage.getItem("mathos_official_result_id") : null;
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
              className="block w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition-colors">
              📄 Voir mon certificat →
            </a>
          )}
          <a href={`/api/generate-pdf`} onClick={e => { e.preventDefault(); if (resultId) window.open(`/api/generate-pdf?id=${resultId}`, "_blank"); }}
            className="block w-full border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-medium py-4 rounded-2xl transition-colors">
            ⬇️ Télécharger le PDF
          </a>
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 text-sm">← Accueil</button>
        </div>
      </div>
    </main>
  );
}
