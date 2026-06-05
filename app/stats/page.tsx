"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Theme, THEME_LABELS, THEME_EMOJIS, STUDY_LEVEL_LABELS, StudyLevel,
} from "@/lib/types";
import {
  getGrandTestHistory, getMergedRadarData, getStoredResults,
  getScorePercent, getScoreLabel,
} from "@/lib/quiz";
import type { QuizResult } from "@/lib/types";

const MathRadar = dynamic(() => import("@/components/RadarChart"), { ssr: false });

type Tab = "radar" | "grands_tests" | "progression";

export default function StatsPage() {
  const router = useRouter();
  const [tab, setTab]             = useState<Tab>("radar");
  const [radarData, setRadarData] = useState<{ theme: string; value: number; fullMark: number }[]>([]);
  const [grandTests, setGrandTests] = useState<QuizResult[]>([]);
  const [allResults, setAllResults] = useState<QuizResult[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme>("calcul");

  useEffect(() => {
    setRadarData(getMergedRadarData());
    setGrandTests(getGrandTestHistory());
    setAllResults(getStoredResults());
  }, []);

  // Progression par thème sélectionné
  const themeProgression = allResults
    .filter((r) => r.themeScores[selectedTheme])
    .map((r) => {
      const data = r.themeScores[selectedTheme];
      const max = data.total * 3;
      const min = data.total * -1;
      const range = max - min;
      const pct = range > 0 ? Math.round(((data.score - min) / range) * 100) : 0;
      return {
        date: new Date(r.completedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        score: pct,
        mode: r.mode,
        level: r.trainingLevel ?? (r.studyLevel as string),
      };
    });

  const totalSessions = allResults.length;
  const totalQuestions = allResults.reduce((s, r) => s + r.questions.length, 0);
  const overallPct = allResults.length > 0
    ? Math.round(allResults.reduce((s, r) => s + getScorePercent(r.score, r.maxScore), 0) / allResults.length)
    : 0;

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes statistiques</h1>
            <p className="text-gray-500 text-sm">Entraînement + Grands Tests fusionnés</p>
          </div>
        </div>

        {/* Résumé */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Sessions", value: totalSessions, icon: "🎯" },
            { label: "Questions", value: totalQuestions, icon: "❓" },
            { label: "Score moyen", value: `${overallPct}%`, icon: "⭐" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
              <div className="text-2xl">{s.icon}</div>
              <div className="font-bold text-xl text-gray-900 mt-1">{s.value}</div>
              <div className="text-xs text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: "radar",       label: "📊 Radar" },
              { key: "grands_tests", label: "🏆 Grands Tests" },
              { key: "progression", label: "📈 Progression" },
            ] as { key: Tab; label: string }[]).map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                  tab === t.key ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/50" : "text-gray-500"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-6">

            {/* ── Radar ── */}
            {tab === "radar" && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 text-center">
                  Basé sur {totalQuestions} questions · entraînements + grands tests
                </p>
                {radarData.length > 0 ? (
                  <>
                    <MathRadar data={radarData} />
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {radarData.map((d) => (
                        <div key={d.theme} className="flex items-center gap-2">
                          <div className="w-5 text-center text-sm">
                            {THEME_EMOJIS[Object.entries(THEME_LABELS).find(([, v]) => v === d.theme)?.[0] as Theme] ?? "•"}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between text-xs mb-0.5">
                              <span className="text-gray-600 font-medium">{d.theme}</span>
                              <span className={`font-bold ${d.value >= 60 ? "text-emerald-600" : d.value >= 40 ? "text-amber-500" : "text-red-500"}`}>{d.value}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                              <div className={`h-1.5 rounded-full ${d.value >= 60 ? "bg-emerald-500" : d.value >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                                style={{ width: `${d.value}%` }} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState text="Passe ton premier test ou entraînement pour voir ton radar" />
                )}
              </div>
            )}

            {/* ── Historique Grands Tests ── */}
            {tab === "grands_tests" && (
              <div className="space-y-3">
                {grandTests.length === 0 ? (
                  <EmptyState text="Aucun Grand Test effectué pour le moment" />
                ) : grandTests.map((r, i) => {
                  const pct = getScorePercent(r.score, r.maxScore);
                  const { label, color } = getScoreLabel(pct);
                  return (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                      <div className="text-center min-w-[48px]">
                        <div className={`font-bold text-xl ${color}`}>{pct}%</div>
                        <div className={`text-xs font-medium ${color}`}>{label}</div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-800 text-sm">
                            {r.score} pts / {r.maxScore} pts
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(r.completedAt).toLocaleDateString("fr-FR", {
                              day: "2-digit", month: "2-digit", year: "numeric",
                              hour: "2-digit", minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                            {STUDY_LEVEL_LABELS[r.studyLevel as StudyLevel] ?? r.studyLevel}
                          </span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                            {r.questions.length} questions
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Progression par thème ── */}
            {tab === "progression" && (
              <div className="space-y-4">
                {/* Sélecteur de thème */}
                <div className="flex flex-wrap gap-2">
                  {(Object.entries(THEME_LABELS) as [Theme, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => setSelectedTheme(key)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        selectedTheme === key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-indigo-50"
                      }`}>
                      {THEME_EMOJIS[key]} {label}
                    </button>
                  ))}
                </div>

                {themeProgression.length === 0 ? (
                  <EmptyState text={`Aucune donnée pour le thème ${THEME_LABELS[selectedTheme]}`} />
                ) : (
                  <div className="space-y-2">
                    {themeProgression.map((p, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="text-xs text-gray-400 w-12 shrink-0">{p.date}</div>
                        <div className="flex-1">
                          <div className="w-full bg-gray-100 rounded-full h-3">
                            <div className={`h-3 rounded-full transition-all ${
                              p.score >= 60 ? "bg-emerald-500" : p.score >= 40 ? "bg-amber-400" : "bg-red-400"
                            }`} style={{ width: `${p.score}%` }} />
                          </div>
                        </div>
                        <div className="text-xs font-bold w-10 text-right text-gray-700">{p.score}%</div>
                        <div className={`text-xs px-2 py-0.5 rounded-full ${
                          p.mode === "grand_test" ? "bg-indigo-100 text-indigo-700" : "bg-violet-100 text-violet-700"
                        }`}>
                          {p.mode === "grand_test" ? "🏆" : "💪"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => router.push("/entrainement")}
            className="flex-1 bg-white border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-medium py-3 rounded-2xl text-sm transition-colors">
            💪 S&apos;entraîner
          </button>
          <button onClick={() => router.push("/quiz")}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-2xl text-sm transition-colors">
            🏆 Grand Test
          </button>
        </div>

      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 text-gray-400">
      <div className="text-4xl mb-3">📭</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
