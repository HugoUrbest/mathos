"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { THEME_LABELS, Theme } from "@/lib/types";

type Tab = "tokens" | "resultats";

interface Token {
  id: string;
  code: string;
  supervised: boolean;
  expires_at: string;
  used_at: string | null;
  created_at: string;
  used_by_user?: { first_name: string; email: string } | null;
  result?: { id: string; score: number; max_score: number; completed_at: string } | null;
}

interface Result {
  id: string;
  candidate_name: string;
  candidate_email: string;
  score: number;
  max_score: number;
  theme_scores: Record<string, { correct: number; total: number; score: number }>;
  questions_count: number;
  study_level: string;
  supervised: boolean;
  completed_at: string;
  pdf_url: string | null;
  token: { code: string };
}

export default function RecruteurPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tokens");
  const [tokens, setTokens] = useState<Token[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedResult, setSelectedResult] = useState<Result | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }
      supabase.from("users").select("role").eq("id", user.id).single().then(({ data }) => {
        if (!data || !["recruiter", "admin"].includes(data.role)) router.push("/");
        else { loadTokens(); loadResults(); }
      });
    });
  }, []);

  const loadTokens = useCallback(async () => {
    const res = await fetch("/api/tokens");
    const data = await res.json();
    setTokens(data.tokens || []);
  }, []);

  const loadResults = useCallback(async () => {
    const res = await fetch("/api/recruiter-results");
    const data = await res.json();
    setResults(data.results || []);
  }, []);

  async function generateToken() {
    setGenerating(true);
    await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supervised: false }),
    });
    await loadTokens();
    setGenerating(false);
  }

  async function revokeAndRegenerate(tokenId: string) {
    if (!confirm("Révoquer ce token et en générer un nouveau ?")) return;
    setLoading(true);
    await fetch(`/api/tokens/${tokenId}/revoke`, { method: "POST" });
    await fetch("/api/tokens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supervised: false }),
    });
    await loadTokens();
    setLoading(false);
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
  }

  const usedTokens = tokens.filter(t => t.used_at);
  const availableTokens = tokens.filter(t => !t.used_at);

  const pctColor = (pct: number) =>
    pct >= 80 ? "text-emerald-600" : pct >= 60 ? "text-blue-600" : pct >= 40 ? "text-amber-500" : "text-red-500";
  const scoreLabel = (pct: number) =>
    pct >= 80 ? "Excellent" : pct >= 60 ? "Bon niveau" : pct >= 40 ? "Moyen" : "À travailler";

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Espace recruteur</h1>
            <p className="text-gray-500 text-sm">Gérez vos tokens et consultez les résultats de vos candidats</p>
          </div>
          <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-gray-600">← App</button>
        </div>

        {/* Résumé rapide */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Tokens disponibles", value: availableTokens.length, color: "text-emerald-600", icon: "🟢" },
            { label: "Tests passés", value: usedTokens.length, color: "text-indigo-600", icon: "✅" },
            { label: "Total émis", value: tokens.length, color: "text-gray-700", icon: "🔑" },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-4 text-center border border-gray-100 shadow-sm">
              <div className="text-xl">{s.icon}</div>
              <div className={`font-bold text-2xl mt-1 ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Onglets */}
        <div className="flex gap-2">
          {([
            { key: "tokens" as Tab, label: "🔑 Mes tokens" },
            { key: "resultats" as Tab, label: `📊 Résultats (${results.length})` },
          ]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t.key ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tokens ── */}
        {tab === "tokens" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Chaque token permet à un candidat de passer un test officiel gratuitement. Le résultat vous est automatiquement transmis.
              </p>
              <button onClick={generateToken} disabled={generating}
                className="ml-4 shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white font-semibold px-4 py-2 rounded-xl text-sm transition-colors">
                {generating ? "…" : "+ Nouveau token"}
              </button>
            </div>

            {/* Tokens disponibles */}
            {availableTokens.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Disponibles</div>
                {availableTokens.map(t => (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className="font-mono font-bold text-xl text-indigo-600 tracking-widest flex-1">{t.code}</div>
                    <div className="text-xs text-gray-400">Expire le {new Date(t.expires_at).toLocaleDateString("fr-FR")}</div>
                    <button onClick={() => copyCode(t.code)}
                      className="text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      📋 Copier
                    </button>
                    <button onClick={() => revokeAndRegenerate(t.id)} disabled={loading}
                      className="text-xs bg-red-50 text-red-500 hover:bg-red-100 px-3 py-1.5 rounded-lg font-medium transition-colors">
                      🔄 Révoquer
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tokens utilisés */}
            {usedTokens.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisés</div>
                {usedTokens.map(t => (
                  <div key={t.id} className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                    <div className="font-mono text-lg text-gray-400 tracking-widest flex-1 line-through">{t.code}</div>
                    <div className="text-xs text-gray-500">
                      {t.used_by_user
                        ? `Utilisé par ${t.used_by_user.first_name} (${t.used_by_user.email})`
                        : "Utilisé"
                      }
                    </div>
                    <div className="text-xs text-gray-400">
                      {t.used_at && new Date(t.used_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {t.result && (
                      <button onClick={() => { setSelectedResult(results.find(r => r.id === t.result?.id) || null); setTab("resultats"); }}
                        className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg font-medium">
                        Voir résultat →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tokens.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <div className="text-4xl mb-3">🔑</div>
                <p className="text-sm">Aucun token encore. Générez-en un pour inviter votre premier candidat.</p>
              </div>
            )}
          </div>
        )}

        {/* ── Résultats ── */}
        {tab === "resultats" && (
          <div className="space-y-4">
            {results.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-sm">Aucun résultat pour l&apos;instant. Partagez un token à un candidat pour recevoir ses résultats.</p>
              </div>
            ) : (
              results.map(r => {
                const pct = Math.round(((r.score + r.max_score / 3) / (r.max_score * 4 / 3)) * 100);
                const isSelected = selectedResult?.id === r.id;
                return (
                  <div key={r.id} className={`bg-white rounded-2xl border shadow-sm transition-all ${isSelected ? "border-indigo-300" : "border-gray-100"}`}>
                    {/* Résumé ligne */}
                    <button className="w-full p-4 text-left" onClick={() => setSelectedResult(isSelected ? null : r)}>
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[56px]">
                          <div className={`font-black text-2xl ${pctColor(pct)}`}>{pct}%</div>
                          <div className={`text-xs font-medium ${pctColor(pct)}`}>{scoreLabel(pct)}</div>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{r.candidate_name}</div>
                          <div className="text-sm text-gray-500">{r.candidate_email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400">
                            {new Date(r.completed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </div>
                          <div className="text-xs text-gray-400">
                            {new Date(r.completed_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${r.supervised ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                            {r.supervised ? "Supervisé" : "Non surveillé"}
                          </span>
                        </div>
                        <div className="text-gray-300">{isSelected ? "▲" : "▼"}</div>
                      </div>
                    </button>

                    {/* Détail déplié */}
                    {isSelected && (
                      <div className="px-4 pb-4 space-y-4 border-t border-gray-50 pt-4">
                        {/* Thèmes */}
                        <div className="space-y-2">
                          {Object.entries(r.theme_scores).map(([theme, data]) => {
                            const max = data.total * 3, min = data.total * -1, range = max - min;
                            const tp = range > 0 ? Math.round(((data.score - min) / range) * 100) : 0;
                            return (
                              <div key={theme} className="flex items-center gap-3">
                                <div className="text-xs text-gray-600 w-24 font-medium">{THEME_LABELS[theme as Theme] || theme}</div>
                                <div className="flex-1 bg-gray-100 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${tp >= 60 ? "bg-emerald-500" : tp >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                                    style={{ width: `${tp}%` }} />
                                </div>
                                <div className="text-xs font-bold w-10 text-right text-gray-600">{tp}%</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Token utilisé */}
                        <div className="text-xs text-gray-400">
                          Token utilisé : <span className="font-mono font-bold text-gray-600">{r.token?.code}</span>
                        </div>

                        {/* ID + actions */}
                        <div className="bg-gray-50 rounded-xl p-3 text-xs font-mono text-gray-500 break-all">
                          <div className="font-sans font-semibold text-gray-600 mb-1">ID de vérification</div>
                          {r.id}
                        </div>

                        <div className="flex gap-2">
                          {r.pdf_url && (
                            <a href={r.pdf_url} target="_blank" rel="noopener noreferrer"
                              className="flex-1 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl text-sm transition-colors">
                              📄 Certificat PDF
                            </a>
                          )}
                          <a href={`/verify?id=${r.id}`} target="_blank"
                            className="flex-1 text-center border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-medium py-2.5 rounded-xl text-sm transition-colors">
                            🔗 Page publique
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </main>
  );
}
