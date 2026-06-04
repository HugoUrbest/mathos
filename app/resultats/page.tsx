"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { QuizResult, THEME_LABELS, Theme, STUDY_LEVEL_LABELS } from "@/lib/types";
import { getScorePercent, getScoreLabel, getThemeRadarData, getStoredResults } from "@/lib/quiz";

const MathRadar = dynamic(() => import("@/components/RadarChart"), { ssr: false });

export default function ResultatsPage() {
  const router = useRouter();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [tab, setTab] = useState<"recap" | "erreurs">("recap");

  useEffect(() => {
    const raw = localStorage.getItem("mathos_last_result");
    if (!raw) { router.push("/"); return; }
    setResult(JSON.parse(raw));
  }, [router]);

  if (!result) return null;

  const pct = getScorePercent(result.score, result.maxScore);
  const { label, color } = getScoreLabel(pct);
  const radarData = getThemeRadarData(result.themeScores);

  const wrongAnswers = result.questions.filter((q, i) => {
    const ans = result.answers[i];
    return ans.selectedIndex !== null && ans.selectedIndex !== q.answer;
  });
  const skipped = result.answers.filter((a) => a.selectedIndex === null).length;
  const correct = result.questions.filter((q, i) => result.answers[i].selectedIndex === q.answer).length;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Mathos
          </div>
          <p className="text-gray-400 text-sm mt-1">
            {STUDY_LEVEL_LABELS[result.studyLevel]}
          </p>
        </div>

        {/* Score principal */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="text-6xl font-black text-gray-900">
            {result.score}
            <span className="text-2xl text-gray-400 ml-1">/ {result.maxScore}</span>
          </div>
          <div className={`text-xl font-bold mt-2 ${color}`}>{label}</div>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div className="text-center">
              <div className="font-bold text-emerald-600 text-xl">{correct}</div>
              <div className="text-gray-400">correctes</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-red-500 text-xl">{wrongAnswers.length}</div>
              <div className="text-gray-400">erreurs</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-gray-400 text-xl">{skipped}</div>
              <div className="text-gray-400">passées</div>
            </div>
          </div>
        </div>

        {/* Radar */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-4">Ton profil par thème</h2>
          <MathRadar data={radarData} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            {Object.entries(result.themeScores).map(([theme, data]) => {
              const max = data.total * 3;
              const min = data.total * -1;
              const range = max - min;
              const pct = range > 0 ? Math.round(((data.score - min) / range) * 100) : 0;
              return (
                <div key={theme} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600 font-medium">{THEME_LABELS[theme as Theme]}</span>
                      <span className="text-gray-400">{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Onglets recap / erreurs */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(["recap", "erreurs"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/50" : "text-gray-500"
                }`}
              >
                {t === "recap" ? "Récapitulatif" : `Erreurs à corriger (${wrongAnswers.length})`}
              </button>
            ))}
          </div>

          <div className="p-6 space-y-4">
            {tab === "recap" &&
              result.questions.map((q, i) => {
                const ans = result.answers[i];
                const isCorrect = ans.selectedIndex === q.answer;
                const isSkipped = ans.selectedIndex === null;
                return (
                  <div key={q.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      isSkipped ? "bg-gray-100 text-gray-400" :
                      isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                    }`}>
                      {isSkipped ? "—" : isCorrect ? "✓" : "✗"}
                    </div>
                    <div className="text-sm text-gray-700 flex-1">{q.question}</div>
                  </div>
                );
              })}

            {tab === "erreurs" && wrongAnswers.length === 0 && (
              <p className="text-center text-gray-400 py-8">Aucune erreur — bravo !</p>
            )}

            {tab === "erreurs" &&
              wrongAnswers.map((q) => {
                const idx = result.questions.indexOf(q);
                const ans = result.answers[idx];
                return (
                  <div key={q.id} className="border border-red-100 rounded-2xl p-4 space-y-3">
                    <p className="font-medium text-gray-900 text-sm">{q.question}</p>
                    <div className="space-y-1 text-sm">
                      <div className="text-red-600">
                        ✗ Ta réponse : <span className="font-medium">{q.choices[ans.selectedIndex!]}</span>
                      </div>
                      <div className="text-emerald-700">
                        ✓ Bonne réponse : <span className="font-medium">{q.choices[q.answer]}</span>
                      </div>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-900">
                      <strong>Conseil :</strong> {q.explanation}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-gray-300 font-medium"
          >
            ← Accueil
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("mathos_last_result");
              router.push("/");
            }}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl transition-colors"
          >
            Repasser le test →
          </button>
        </div>
      </div>
    </main>
  );
}
