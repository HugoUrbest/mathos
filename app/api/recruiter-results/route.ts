import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/recruiter-results — Résultats des candidats ayant utilisé les tokens du recruteur
export async function GET() {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "recruiter"].includes(profile.role)) {
    return NextResponse.json({ error: "Rôle insuffisant" }, { status: 403 });
  }

  // Récupérer tous les tokens générés par ce recruteur
  const { data: tokens } = await supabase
    .from("tokens")
    .select("id, code")
    .eq("generated_by", user.id);

  if (!tokens || tokens.length === 0) {
    return NextResponse.json({ results: [] });
  }

  const tokenIds = tokens.map(t => t.id);
  const tokenMap = Object.fromEntries(tokens.map(t => [t.id, t]));

  // Récupérer les résultats officiels liés à ces tokens
  const { data: results, error } = await supabase
    .from("official_results")
    .select("*")
    .in("token_id", tokenIds)
    .order("completed_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrichir chaque résultat avec les infos du token
  const enriched = (results || []).map(r => ({
    ...r,
    token: tokenMap[r.token_id] || null,
  }));

  return NextResponse.json({ results: enriched });
}
