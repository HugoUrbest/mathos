"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { THEME_LABELS, Theme } from "@/lib/types";
import { Suspense } from "react";

interface VerifyResult {
  id: string;
  candidate_name: string;
  score: number;
  max_score: number;
  score_percent: number;
  theme_scores: Record<string, { correct: number; total: number; score: number }>;
  questions_count: number;
  study_level: string;
  supervised: boolean;
  completed_at: string;
  hash: string;
  pdf_url: string | null;
  valid: boolean;
}

function VerifyContent() {
  const params = useSearchParams();
  const [id, setId] = useState(params.get("id") || "");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function verify(searchId: string) {
    if (!searchId.trim()) return;
    setLoading(true); setError(""); setResult(null);
    const res = await fetch(`/api/verify-result?id=${encodeURIComponent(searchId.trim())}`);
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Résultat introuvable"); }
    else setResult(data);
    setLoading(false);
  }

  useEffect(() => { if (params.get("id")) verify(params.get("id")!); }, []);

  const pct = result?.score_percent ?? 0;
  const scoreColor = pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-blue-600" : pct >= 40 ? "text-amber-600" : "text-red-500";
  const scoreLabel = pct >= 80 ? "Excellent" : pct >= 60 ? "Bon niveau" : pct >= 40 ? "Moyen" : "À travailler";

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center">
          <div className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">Mathos</div>
          <h1 className="text-xl font-bold text-gray-900 mt-2">Vérification d&apos;un résultat officiel</h1>
          <p className="text-gray-500 text-sm mt-1">Entrez l&apos;identifiant unique du test pour consulter le résultat certifié</p>
        </div>

        <div className="flex gap-2">
          <input value={id} onChange={e => setId(e.target.value)}
            onKeyDown={e => e.key === "Enter" && verify(id)}
            placeholder="Identifiant UUID du test..."
            className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none font-mono" />
          <button onClick={() => verify(id)} disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 rounded-xl disabled:bg-gray-200 transition-colors">
            {loading ? "…" : "Vérifier"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
            <div className="text-2xl mb-2">❌</div>
            <p className="text-red-700 font-medium">Résultat introuvable</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
              <div className="text-2xl">✅</div>
              <div>
                <div className="font-semibold text-emerald-800">Résultat authentifié</div>
                <div className="text-emerald-600 text-sm">Ce résultat est enregistré dans la base Mathos</div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-xl text-gray-900">{result.candidate_name}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(result.completed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <span className={`text-xs px-3 py-1 rounded-full font-medium ${result.supervised ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                  {result.supervised ? "✓ Supervisé" : "Non surveillé"}
                </span>
              </div>

              <div className="text-center py-4 border-y border-gray-100">
                <div className={`text-5xl font-black ${scoreColor}`}>{pct}%</div>
                <div className={`text-lg font-semibold mt-1 ${scoreColor}`}>{scoreLabel}</div>
                <div className="text-gray-500 text-sm mt-1">{result.score} / {result.max_score} pts · {result.questions_count} questions</div>
              </div>

              <div className="space-y-2">
                {Object.entries(result.theme_scores).map(([theme, data]) => {
                  const max = data.total * 3, min = data.total * -1, range = max - min;
                  const tp = range > 0 ? Math.round(((data.score - min) / range) * 100) : 0;
                  return (
                    <div key={theme} className="flex items-center gap-3">
                      <div className="text-xs text-gray-600 w-24 font-medium">{THEME_LABELS[theme as Theme] || theme}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${tp >= 60 ? "bg-emerald-500" : tp >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${tp}%` }} />
                      </div>
                      <div className="text-xs font-bold w-8 text-right text-gray-600">{tp}%</div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-500 font-mono break-all">
                <div className="font-semibold text-gray-700 mb-1 font-sans">Identifiant unique</div>
                {result.id}
              </div>

              {result.pdf_url && (
                <a href={result.pdf_url} target="_blank" rel="noopener noreferrer"
                  className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors">
                  📄 Télécharger le certificat PDF
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return <Suspense><VerifyContent /></Suspense>;
}
