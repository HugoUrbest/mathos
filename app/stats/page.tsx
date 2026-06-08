"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Theme, THEME_LABELS, THEME_EMOJIS, STUDY_LEVEL_LABELS, StudyLevel,
} from "@/lib/types";
import {
  getGrandTestHistory, getStoredResults,
  getScorePercent, getScoreLabel,
  getMergedRadarDataWithBenchmarks, getScatterData, computePercentile,
} from "@/lib/quiz";
import type { QuizResult } from "@/lib/types";

const MathRadar = dynamic(() => import("@/components/RadarChart"), { ssr: false });
const ScatterPlot = dynamic(() => import("@/components/ScatterPlot"), { ssr: false });

type Tab = "competences" | "grands_tests" | "progression";
type BenchmarkFilter = "top10" | "top20" | "top50";

export default function StatsPage() {
  const router = useRouter();
  const [tab, setTab]               = useState<Tab>("competences");
  const [radarData, setRadarData]   = useState<ReturnType<typeof getMergedRadarDataWithBenchmarks>>([]);
  const [grandTests, setGrandTests] = useState<QuizResult[]>([]);
  const [allResults, setAllResults] = useState<QuizResult[]>([]);
  const [scatterData, setScatterData] = useState<ReturnType<typeof getScatterData>>([]);
  const [benchmarks, setBenchmarks] = useState<BenchmarkFilter[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme>("calcul");

  useEffect(() => {
    const results = getStoredResults();
    setRadarData(getMergedRadarDataWithBenchmarks());
    setGrandTests(getGrandTestHistory());
    setAllResults(results);
    setScatterData(getScatterData());
  }, []);

  const totalQuestions = allResults.reduce((s, r) => s + r.questions.length, 0);
  const answeredQuestions = allResults.reduce((s, r) =>
    s + r.answers.filter(a => a.selectedIndex !== null).length, 0);
  const overallPct = allResults.length > 0
    ? Math.round(allResults.reduce((s, r) => s + getScorePercent(r.score, r.maxScore), 0) / allResults.length)
    : 0;

  // Percentile global parmi tous les grands tests
  const grandTestScores = grandTests.map(r => getScorePercent(r.score, r.maxScore));

  function toggleBenchmark(b: BenchmarkFilter) {
    setBenchmarks(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
  }

  const TABS = [
    { key: "competences" as Tab,  label: "📊 Compétences" },
    { key: "grands_tests" as Tab, label: "🏆 Grands Tests" },
    { key: "progression" as Tab,  label: "📈 Progression" },
  ];

  const BENCHMARK_OPTS: { key: BenchmarkFilter; label: string; color: string }[] = [
    { key: "top10", label: "Top 10%", color: "bg-amber-400" },
    { key: "top20", label: "Top 20%", color: "bg-indigo-400" },
    { key: "top50", label: "Top 50%", color: "bg-emerald-400" },
  ];

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/")} className="text-gray-400 hover:text-gray-600 text-xl">←</button>
          <h1 className="text-2xl font-bold text-gray-900">Mes résultats</h1>
        </div>

        {/* Résumé — 2 cases */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
            <div className="text-2xl">📝</div>
            <div className="font-bold text-xl text-gray-900 mt-1">{answeredQuestions}</div>
            <div className="text-xs text-gray-400">Questions répondues</div>
          </div>
          <div className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
            <div className="text-2xl">⭐</div>
            <div className="font-bold text-xl text-gray-900 mt-1">{overallPct}%</div>
            <div className="text-xs text-gray-400">Score moyen</div>
          </div>
        </div>

        {/* Onglets */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                className={`flex-1 py-3 text-xs font-semibold transition-colors ${
                  tab === t.key ? "text-indigo-700 border-b-2 border-indigo-600 bg-indigo-50/50" : "text-gray-500"
                }`}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="p-5">

            {/* ── Compétences ── */}
            {tab === "competences" && (
              <div className="space-y-4">
                {radarData.length === 0 ? (
                  <EmptyState text="Passe ton premier test ou entraînement pour voir tes compétences" />
                ) : (
                  <>

                    {/* Filtres benchmarks */}
                    <div className="flex gap-2 justify-center flex-wrap">
                      {BENCHMARK_OPTS.map(b => (
                        <button key={b.key} onClick={() => toggleBenchmark(b.key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border-2 transition-all ${
                            benchmarks.includes(b.key)
                              ? "border-gray-400 bg-gray-50 text-gray-700"
                              : "border-gray-200 text-gray-400 hover:border-gray-300"
                          }`}>
                          <span className={`inline-block w-2.5 h-0.5 rounded ${b.color}`} />
                          {b.label}
                        </button>
                      ))}
                      {benchmarks.length > 0 && (
                        <span className="text-xs text-gray-400 self-center italic">
                          (référence indicative)
                        </span>
                      )}
                    </div>

                    <MathRadar data={radarData} showTop={benchmarks} />

                    {/* Barres par thème avec percentile */}
                    <div className="grid grid-cols-1 gap-2">
                      {radarData.map((d) => {
                        const themeKey = Object.entries(THEME_LABELS).find(([, v]) => v === d.theme)?.[0] as Theme;
                        // Percentile parmi les scores du thème dans les résultats locaux
                        const allThemeScores = allResults
                          .filter(r => r.themeScores[themeKey])
                          .map(r => {
                            const td = r.themeScores[themeKey];
                            const mx = td.total * 3, mn = td.total * -1, rng = mx - mn;
                            return rng > 0 ? Math.round(((td.score - mn) / rng) * 100) : 0;
                          });
                        const pctile = computePercentile(d.value, allThemeScores);

                        return (
                          <div key={d.theme} className="flex items-center gap-3">
                            <div className="w-5 text-center text-sm shrink-0">
                              {THEME_EMOJIS[themeKey] ?? "•"}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-xs mb-0.5">
                                <span className="text-gray-600 font-medium">{d.theme}</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-400 text-xs">
                                    {pctile > 0 ? `meilleur que ${pctile}%` : ""}
                                  </span>
                                  <span className={`font-bold ${d.value >= 60 ? "text-emerald-600" : d.value >= 40 ? "text-amber-500" : "text-red-500"}`}>
                                    {d.value}%
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full ${d.value >= 60 ? "bg-emerald-500" : d.value >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                                  style={{ width: `${d.value}%` }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── Grands Tests — tableau ── */}
            {tab === "grands_tests" && (
              <div>
                {grandTests.length === 0 ? (
                  <EmptyState text="Aucun Grand Test effectué pour le moment" />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-gray-400 border-b border-gray-100">
                          <th className="text-left pb-2 font-medium">Date</th>
                          <th className="text-right pb-2 font-medium">Score</th>
                          <th className="text-center pb-2 font-medium">Niveau</th>
                          <th className="text-right pb-2 font-medium">Percentile</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {grandTests.map((r, i) => {
                          const pct = getScorePercent(r.score, r.maxScore);
                          const { label, color } = getScoreLabel(pct);
                          // Percentile parmi tous les grands tests locaux
                          const pctile = computePercentile(pct, grandTestScores);
                          return (
                            <tr key={i} className="hover:bg-gray-50">
                              <td className="py-3 text-gray-500 text-xs whitespace-nowrap">
                                {new Date(r.completedAt).toLocaleDateString("fr-FR", {
                                  day: "2-digit", month: "2-digit", year: "2-digit",
                                })}{" "}
                                <span className="text-gray-400">
                                  {new Date(r.completedAt).toLocaleTimeString("fr-FR", {
                                    hour: "2-digit", minute: "2-digit",
                                  })}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                <span className={`font-bold ${color}`}>{pct}%</span>
                                <div className={`text-xs ${color}`}>{label}</div>
                              </td>
                              <td className="py-3 text-center">
                                <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                                  {STUDY_LEVEL_LABELS[r.studyLevel as StudyLevel] ?? r.studyLevel}
                                </span>
                              </td>
                              <td className="py-3 text-right">
                                {grandTestScores.length > 1 ? (
                                  <div>
                                    <span className="font-semibold text-gray-700 text-sm">
                                      Top {100 - pctile}%
                                    </span>
                                    <div className="text-xs text-gray-400">
                                      meilleur que {pctile}%
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-300">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      Percentile calculé parmi vos {grandTests.length} passage{grandTests.length > 1 ? "s" : ""}
                      {grandTests.length < 5 ? " · s'affinera avec plus de passages" : ""}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Progression — nuage de points ── */}
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

                {scatterData.length === 0 ? (
                  <EmptyState text="Réponds à des questions pour voir ta progression" />
                ) : (
                  <>

                    <ScatterPlot data={scatterData} highlightTheme={selectedTheme} />

                    {/* Tableau récap */}
                    <div className="divide-y divide-gray-50 mt-2">
                      {scatterData.map(d => (
                        <div key={d.themeKey}
                          onClick={() => setSelectedTheme(d.themeKey)}
                          className={`flex items-center gap-3 py-2 cursor-pointer rounded-lg px-2 transition-colors ${
                            selectedTheme === d.themeKey ? "bg-indigo-50" : "hover:bg-gray-50"
                          }`}>
                          <span className="text-lg">{THEME_EMOJIS[d.themeKey]}</span>
                          <span className="text-sm text-gray-700 font-medium flex-1">{d.theme}</span>
                          <span className="text-xs text-gray-400">{d.count} réponses</span>
                          <div className="w-20 bg-gray-100 rounded-full h-1.5 mx-2">
                            <div className={`h-1.5 rounded-full ${d.avg >= 60 ? "bg-emerald-500" : d.avg >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                              style={{ width: `${d.avg}%` }} />
                          </div>
                          <span className={`text-sm font-bold w-10 text-right ${d.avg >= 60 ? "text-emerald-600" : d.avg >= 40 ? "text-amber-500" : "text-red-500"}`}>
                            {d.avg}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
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
