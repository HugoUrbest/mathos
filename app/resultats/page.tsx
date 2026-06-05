"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { QuizResult, THEME_LABELS, Theme, STUDY_LEVEL_LABELS, SELF_RATING_LABELS } from "@/lib/types";
import { getScorePercent, getScoreLabel, getThemeRadarData, getMergedRadarData } from "@/lib/quiz";
import ScoreBadge from "@/components/ScoreBadge";
import { ThemeBreakdown } from "@/components/ThemeBreakdown";

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
  const { color } = getScoreLabel(pct);
  const isTraining = result.mode === "entrainement";
  const radarData = isTraining ? getMergedRadarData() : getThemeRadarData(result.themeScores);

  const wrongAnswers = result.questions.filter((q, i) =>
    result.answers[i].selectedIndex !== null && result.answers[i].selectedIndex !== q.answer
  );
  const skipped = result.answers.filter(a => a.selectedIndex === null).length;
  const correct = result.questions.filter((q, i) => result.answers[i].selectedIndex === q.answer).length;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="text-center">
          <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Mathos</div>
          <div className="text-sm font-semibold mt-1 text-gray-600">
            {isTraining ? "💪 Entraînement" : "🏆 Grand Test"}
            {isTraining && result.trainingTheme && ` · ${THEME_LABELS[result.trainingTheme]}`}
          </div>
          <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
            <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full font-medium">
              {STUDY_LEVEL_LABELS[result.studyLevel]}
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full font-medium">
              Classe : {SELF_RATING_LABELS[result.classRating]}
            </span>
            <span className="text-xs bg-violet-50 text-violet-700 px-3 py-1 rounded-full font-medium">
              Établissement : {SELF_RATING_LABELS[result.schoolRating]}
            </span>
          </div>
        </div>

        {/* Score */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
          <div className={`text-6xl font-black text-gray-900`}>
            {result.score}<span className="text-2xl text-gray-400 ml-1">/ {result.maxScore}</span>
          </div>
          <div className={`text-xl font-bold mt-2 ${color}`}>{getScoreLabel(pct).label}</div>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            {[
              { val: correct,             label: "correctes",  cls: "text-emerald-600" },
              { val: wrongAnswers.length, label: "erreurs",    cls: "text-red-500" },
              { val: skipped,             label: "passées",    cls: "text-gray-400" },
            ].map(s => (
              <div key={s.label} className="text-center">
                <div className={`font-bold text-xl ${s.cls}`}>{s.val}</div>
                <div className="text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Radar */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h2 className="font-bold text-gray-900 mb-1">Ton profil par thème</h2>
          {isTraining && <p className="text-xs text-gray-400 mb-3">Radar global · toutes sessions confondues</p>}
          <MathRadar data={radarData} />
          <div className="mt-4">
            <ThemeBreakdown themeScores={result.themeScores} />
          </div>
        </div>

        {/* Benchmark — bientôt */}
        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-3xl p-5 space-y-3">
          <div className="font-semibold text-gray-800 flex items-center gap-2">
            <span>🔜</span> Bientôt : ton positionnement par rapport aux pairs
          </div>
          <div className="grid grid-cols-3 gap-2 text-xs text-center text-gray-500">
            {["vs tous les utilisateurs", `vs ${STUDY_LEVEL_LABELS[result.studyLevel]}`, `vs niveau ${SELF_RATING_LABELS[result.classRating].toLowerCase()} en classe`].map(txt => (
              <div key={txt} className="bg-white rounded-xl p-3 border border-gray-100">
                <div className="font-bold text-gray-800 text-base">—</div>
                <div>{txt}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Ces données sont enregistrées et alimenteront le benchmark dès que suffisamment d&apos;utilisateurs auront passé le test.
          </p>
        </div>

        {/* Onglets recap / erreurs */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {(["recap", "erreurs"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  tab === t ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/50" : "text-gray-500"
                }`}>
                {t === "recap" ? "Récapitulatif" : `Erreurs (${wrongAnswers.length})`}
              </button>
            ))}
          </div>
          <div className="p-6 space-y-4">
            {tab === "recap" && result.questions.map((q, i) => {
              const ans = result.answers[i];
              const isCorrect = ans.selectedIndex === q.answer;
              const isSkipped = ans.selectedIndex === null;
              return (
                <div key={q.id} className="flex items-start gap-3">
                  <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    isSkipped ? "bg-gray-100 text-gray-400" :
                    isCorrect ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                  }`}>
                    {isSkipped ? "—" : isCorrect ? "✓" : "✗"}
                  </div>
                  <div className="text-sm text-gray-700">{q.question}</div>
                </div>
              );
            })}
            {tab === "erreurs" && wrongAnswers.length === 0 && (
              <p className="text-center text-gray-400 py-8">Aucune erreur — bravo !</p>
            )}
            {tab === "erreurs" && wrongAnswers.map(q => {
              const ans = result.answers[result.questions.indexOf(q)];
              return (
                <div key={q.id} className="border border-red-100 rounded-2xl p-4 space-y-3">
                  <p className="font-medium text-gray-900 text-sm">{q.question}</p>
                  <div className="space-y-1 text-sm">
                    <div className="text-red-600">✗ Ta réponse : <span className="font-medium">{q.choices[ans.selectedIndex!]}</span></div>
                    <div className="text-emerald-700">✓ Bonne réponse : <span className="font-medium">{q.choices[q.answer]}</span></div>
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
          <button onClick={() => router.push("/")} className="flex-1 py-4 rounded-2xl border-2 border-gray-200 text-gray-600 hover:border-gray-300 font-medium">← Accueil</button>
          <button onClick={() => router.push("/stats")} className="flex-1 border-2 border-indigo-200 hover:border-indigo-400 text-indigo-700 font-semibold py-4 rounded-2xl">📊 Mes stats</button>
          <button onClick={() => router.push(isTraining ? "/entrainement" : "/quiz")}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 rounded-2xl">
            {isTraining ? "Ré-entraîner →" : "Nouveau test →"}
          </button>
        </div>
      </div>
    </main>
  );
}
