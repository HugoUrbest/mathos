import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET /api/verify-result?id=xxx — Vérifier un résultat (recruteur ou public avec ID)
export async function GET(req: NextRequest) {
  const supabase = await createServiceClient();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const { data, error } = await supabase
    .from("official_results")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Résultat introuvable" }, { status: 404 });

  // On retourne les données sans infos sensibles si pas authentifié
  const { data: { user } } = await supabase.auth.getUser();
  const isAuthorized = user && (
    await supabase.from("users").select("role").eq("id", user.id).single()
  ).data?.role === "recruiter" || (
    await supabase.from("users").select("role").eq("id", user?.id ?? "").single()
  ).data?.role === "admin";

  return NextResponse.json({
    id: data.id,
    candidate_name: data.candidate_name,
    candidate_email: isAuthorized ? data.candidate_email : undefined,
    score: data.score,
    max_score: data.max_score,
    score_percent: Math.round((data.score / data.max_score) * 100),
    theme_scores: data.theme_scores,
    questions_count: data.questions_count,
    study_level: data.study_level,
    supervised: data.supervised,
    completed_at: data.completed_at,
    hash: data.hash,
    pdf_url: data.pdf_url,
    valid: true,
  });
}
