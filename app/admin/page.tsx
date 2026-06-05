"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Tab = "tokens" | "users" | "recruteurs" | "resultats";

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("tokens");
  const [tokens, setTokens] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [msg, setMsg] = useState("");

  const supabase = createClient();

  // Vérifier le rôle admin
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/auth/login"); return; }
      supabase.from("users").select("role").eq("id", user.id).single().then(({ data }) => {
        if (!data || data.role !== "admin") router.push("/");
      });
    });
  }, []);

  const loadTokens = useCallback(async () => {
    const res = await fetch("/api/tokens");
    const data = await res.json();
    setTokens(data.tokens || []);
  }, []);

  const loadUsers = useCallback(async () => {
    const { data } = await supabase.from("user_stats").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
  }, [supabase]);

  const loadResults = useCallback(async () => {
    const { data } = await supabase.from("official_results").select("*").order("completed_at", { ascending: false }).limit(50);
    setResults(data || []);
  }, [supabase]);

  useEffect(() => {
    if (tab === "tokens") loadTokens();
    else if (tab === "users" || tab === "recruteurs") loadUsers();
    else if (tab === "resultats") loadResults();
  }, [tab, loadTokens, loadUsers, loadResults]);

  async function generateToken(supervised: boolean) {
    setLoading(true);
    await fetch("/api/tokens", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ supervised }) });
    await loadTokens();
    setLoading(false);
  }

  async function inviteRecruiter() {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    const res = await fetch("/api/invite-recruiter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    setMsg(data.message || data.error || "");
    setInviteEmail("");
    setLoading(false);
  }

  const TABS = [
    { key: "tokens" as Tab,    label: "🔑 Tokens" },
    { key: "users" as Tab,     label: "👥 Utilisateurs" },
    { key: "recruteurs" as Tab, label: "🏢 Recruteurs" },
    { key: "resultats" as Tab, label: "📊 Résultats officiels" },
  ];

  return (
    <main className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Console Admin</h1>
            <p className="text-gray-500 text-sm">Mathos — accès restreint</p>
          </div>
          <button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-gray-600">← App</button>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Tokens ── */}
        {tab === "tokens" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <button onClick={() => generateToken(false)} disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl text-sm disabled:bg-gray-200">
                + Token Non-surveillé
              </button>
              <button onClick={() => generateToken(true)} disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-4 py-2 rounded-xl text-sm disabled:bg-gray-200">
                + Token Supervisé
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">Code</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Statut</th>
                    <th className="text-left px-4 py-3">Utilisé par</th>
                    <th className="text-left px-4 py-3">Expire</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.length === 0 && (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Aucun token</td></tr>
                  )}
                  {tokens.map(t => (
                    <tr key={t.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-600 tracking-widest">{t.code}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${t.supervised ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                          {t.supervised ? "Supervisé" : "Non-surveillé"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${t.used_at ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                          {t.used_at ? "Utilisé" : "Disponible"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{t.used_by_user?.email ?? "—"}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(t.expires_at).toLocaleDateString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Utilisateurs ── */}
        {(tab === "users" || tab === "recruteurs") && (
          <div className="space-y-4">
            {tab === "recruteurs" && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
                <h3 className="font-semibold text-gray-800">Inviter un recruteur</h3>
                <div className="flex gap-2">
                  <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                    placeholder="email@entreprise.com"
                    className="flex-1 border-2 border-gray-200 rounded-xl px-3 py-2 text-sm focus:border-indigo-500 outline-none" />
                  <button onClick={inviteRecruiter} disabled={loading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium disabled:bg-gray-200">
                    Inviter
                  </button>
                </div>
                {msg && <p className="text-sm text-indigo-600">{msg}</p>}
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs">
                  <tr>
                    <th className="text-left px-4 py-3">Nom</th>
                    <th className="text-left px-4 py-3">Email</th>
                    <th className="text-left px-4 py-3">Rôle</th>
                    <th className="text-left px-4 py-3">Sessions</th>
                    <th className="text-left px-4 py-3">Tests officiels</th>
                    <th className="text-left px-4 py-3">Inscrit le</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => tab === "recruteurs" ? u.role === "recruiter" : true).map(u => (
                    <tr key={u.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{u.first_name || "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          u.role === "admin" ? "bg-red-100 text-red-700" :
                          u.role === "recruiter" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{u.total_sessions}</td>
                      <td className="px-4 py-3 text-gray-500">{u.total_official}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Résultats officiels ── */}
        {tab === "resultats" && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Candidat</th>
                  <th className="text-left px-4 py-3">Score</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => {
                  const pct = Math.round(((r.score + r.max_score / 3) / (r.max_score * 4 / 3)) * 100);
                  return (
                    <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{r.candidate_name}</div>
                        <div className="text-xs text-gray-400">{r.candidate_email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${pct >= 60 ? "text-emerald-600" : pct >= 40 ? "text-amber-500" : "text-red-500"}`}>{pct}%</span>
                        <div className="text-xs text-gray-400">{r.score}/{r.max_score}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${r.supervised ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                          {r.supervised ? "Supervisé" : "Non-surveillé"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{new Date(r.completed_at).toLocaleDateString("fr-FR")}</td>
                      <td className="px-4 py-3">
                        <a href={`/verify?id=${r.id}`} target="_blank" className="text-indigo-600 hover:underline text-xs mr-3">Voir</a>
                        {r.pdf_url && <a href={r.pdf_url} target="_blank" className="text-gray-500 hover:underline text-xs">PDF</a>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
