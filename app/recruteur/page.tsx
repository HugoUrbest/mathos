"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { THEME_LABELS, Theme } from "@/lib/types";

export default function RecruteurPage() {
  const router = useRouter();
  const [searchId, setSearchId] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }
      supabase.from("users").select("role").eq("id", user.id).single().then(({ data }) => {
        if (!data || !["recruiter", "admin"].includes(data.role)) router.push("/");
      });
    });
  }, []);

  async function search() {
    if (!searchId.trim()) return;
    setLoading(true); setError(""); setResult(null);
    const res = await fetch(`/api/verify-result?id=${encodeURIComponent(searchId.trim())}`);
    const data = await res.json();
    if (!res.ok) setError(data.error || "Résultat introuvable");
    else setResult(data);
    setLoading(false);
  }

  const pct = result?.score_percent ?? 0;
  const scoreColor = pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-blue-600" : pct >= 40 ? "text-amber-500" : "text-red-500";
  const scoreLabel = pct >= 80 ? "Excellent" : pct >= 60 ? "Bon niveau" : pct >= 40 ? "Moyen" : "À travailler";

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Espace recruteur</h1>
            <p className="text-gray-500 text-sm">Vérifiez les résultats certifiés des candidats</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <label className="block text-sm font-semibold text-gray-700">Identifiant unique du test</label>
          <div className="flex gap-2">
            <input value={searchId} onChange={e => setSearchId(e.target.value)}
              onKeyDown={e => e.key === "Enter" && search()}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-mono focus:border-indigo-500 outline-none" />
            <button onClick={search} disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 rounded-xl disabled:bg-gray-200 transition-colors">
              {loading ? "…" : "Rechercher"}
            </button>
          </div>
          <p className="text-xs text-gray-400">L&apos;identifiant est fourni par le candidat ou figure sur son certificat PDF</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center text-red-700 text-sm">❌ {error}</div>
        )}

        {result && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header candidat */}
            <div className="bg-indigo-600 p-5 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-xl">{result.candidate_name}</div>
                  <div className="text-indigo-200 text-sm">{result.candidate_email}</div>
                  <div className="text-indigo-200 text-xs mt-1">
                    {new Date(result.completed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${result.supervised ? "bg-emerald-400 text-white" : "bg-white/20 text-white"}`}>
                  {result.supervised ? "✓ Supervisé" : "Non surveillé"}
                </span>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Score */}
              <div className="text-center py-3">
                <div className={`text-5xl font-black ${scoreColor}`}>{pct}%</div>
                <div className={`text-lg font-semibold mt-1 ${scoreColor}`}>{scoreLabel}</div>
                <div className="text-gray-500 text-sm">{result.score} / {result.max_score} pts · {result.questions_count} questions</div>
              </div>

              {/* Radar par thème */}
              <div className="space-y-2">
                <div className="font-semibold text-sm text-gray-700 mb-2">Détail par thème</div>
                {Object.entries(result.theme_scores as Record<string, any>).map(([theme, data]: [string, any]) => {
                  const max = data.total * 3, min = data.total * -1, range = max - min;
                  const tp = range > 0 ? Math.round(((data.score - min) / range) * 100) : 0;
                  return (
                    <div key={theme} className="flex items-center gap-3">
                      <div className="text-xs text-gray-600 w-24">{THEME_LABELS[theme as Theme] || theme}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${tp >= 60 ? "bg-emerald-500" : tp >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                          style={{ width: `${tp}%` }} />
                      </div>
                      <div className="text-xs font-bold w-10 text-right">{tp}%</div>
                    </div>
                  );
                })}
              </div>

              {/* Identifiant */}
              <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-500 break-all">
                <div className="font-semibold text-gray-600 font-sans text-xs mb-1">✅ Résultat authentifié — ID unique</div>
                {result.id}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {result.pdf_url && (
                  <a href={result.pdf_url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-xl text-sm transition-colors">
                    📄 Certificat PDF
                  </a>
                )}
                <a href={`/verify?id=${result.id}`} target="_blank"
                  className="flex-1 text-center border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-medium py-3 rounded-xl text-sm transition-colors">
                  🔗 Page publique
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
