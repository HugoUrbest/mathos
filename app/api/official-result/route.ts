import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

// POST /api/official-result — Soumettre un résultat officiel
export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { tokenCode, score, maxScore, themeScores, questionsCount, durationSeconds, studyLevel, startedAt } = body;

  // Valider le token
  const { data: token, error: tokenErr } = await supabase
    .from("tokens")
    .select("*")
    .eq("code", tokenCode)
    .is("used_at", null)
    .single();

  if (tokenErr || !token) return NextResponse.json({ error: "Token invalide ou déjà utilisé" }, { status: 400 });
  if (new Date(token.expires_at) < new Date()) return NextResponse.json({ error: "Token expiré" }, { status: 400 });

  // Récupérer le profil du candidat
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  // Calculer le hash d'intégrité
  const payload = JSON.stringify({ userId: user.id, tokenCode, score, maxScore, themeScores, completedAt: new Date().toISOString() });
  const hash = createHash("sha256").update(payload + process.env.SUPABASE_SERVICE_ROLE_KEY).digest("hex");

  // Enregistrer le résultat
  const { data: result, error: resultErr } = await supabase
    .from("official_results")
    .insert({
      user_id: user.id,
      token_id: token.id,
      candidate_name: profile.first_name,
      candidate_email: profile.email,
      score, max_score: maxScore, theme_scores: themeScores,
      questions_count: questionsCount,
      duration_seconds: durationSeconds,
      study_level: studyLevel,
      supervised: token.supervised,
      hash,
      started_at: startedAt,
    })
    .select()
    .single();

  if (resultErr) return NextResponse.json({ error: resultErr.message }, { status: 500 });

  // Marquer le token comme utilisé
  await supabase.from("tokens").update({ used_by: user.id, used_at: new Date().toISOString() }).eq("id", token.id);

  // Déclencher la génération PDF (async)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  fetch(`${appUrl}/api/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resultId: result.id }),
  }).catch(() => {}); // fire and forget

  return NextResponse.json({ resultId: result.id, hash });
}
