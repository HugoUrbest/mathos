import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { scoreExam } from "@/lib/questions.server";
import { createHash } from "crypto";

// POST /api/exam/submit — Soumet les réponses d'une session d'examen.
// Le serveur RECALCULE le score à partir des vraies questions (source de vérité),
// puis enregistre le résultat officiel. Le client n'envoie que ses choix.

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { sessionId, answers, tabWarnings, studyLevel } = body;
  if (!sessionId) return NextResponse.json({ error: "Session manquante" }, { status: 400 });

  // Charger la session
  const { data: session, error: sErr } = await supabase
    .from("exam_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();
  if (sErr || !session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 });
  if (session.user_id !== user.id) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  if (session.submitted_at) return NextResponse.json({ error: "Examen déjà soumis" }, { status: 409 });

  // Le token doit toujours être valide (non utilisé)
  const { data: token } = await supabase
    .from("tokens")
    .select("*")
    .eq("id", session.token_id)
    .single();
  if (!token || token.used_at) {
    return NextResponse.json({ error: "Token invalide ou déjà utilisé" }, { status: 400 });
  }

  // ── Correction côté serveur (source de vérité) ──────────────────────────────
  const answerArr: (number | null)[] = Array.isArray(answers) ? answers : [];
  const { score, maxScore, themeScores, corrections } = scoreExam(session.question_ids, answerArr);

  const completedAt = new Date();
  const startedAt = new Date(session.started_at);
  const durationSeconds = Math.round((completedAt.getTime() - startedAt.getTime()) / 1000);
  const timeExceeded = completedAt > new Date(session.expires_at);

  // Profil candidat (snapshot identité)
  const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profil introuvable" }, { status: 404 });

  // Hash d'intégrité sur des valeurs calculées par le SERVEUR
  const secret = process.env.EXAM_HASH_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const payload = JSON.stringify({
    userId: user.id,
    sessionId,
    tokenCode: session.token_code,
    score,
    maxScore,
    themeScores,
    completedAt: completedAt.toISOString(),
  });
  const hash = createHash("sha256").update(payload + secret).digest("hex");

  // Enregistrer le résultat officiel
  const { data: result, error: rErr } = await supabase
    .from("official_results")
    .insert({
      user_id: user.id,
      token_id: session.token_id,
      candidate_name: profile.first_name,
      candidate_email: profile.email,
      score,
      max_score: maxScore,
      theme_scores: themeScores,
      questions_count: session.question_ids.length,
      duration_seconds: durationSeconds,
      study_level: studyLevel ?? session.study_level ?? null,
      supervised: token.supervised,
      hash,
      started_at: session.started_at,
    })
    .select()
    .single();
  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 500 });

  // Clore la session + consommer le token (usage unique)
  await supabase
    .from("exam_sessions")
    .update({
      submitted_at: completedAt.toISOString(),
      result_id: result.id,
      tab_warnings: typeof tabWarnings === "number" ? tabWarnings : 0,
    })
    .eq("id", sessionId);
  await supabase
    .from("tokens")
    .update({ used_by: user.id, used_at: completedAt.toISOString() })
    .eq("id", session.token_id);

  // Génération PDF (fire and forget)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  fetch(`${appUrl}/api/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resultId: result.id }),
  }).catch(() => {});

  // On renvoie le score + les corrections (explications) APRÈS coup uniquement.
  return NextResponse.json({
    resultId: result.id,
    score,
    maxScore,
    hash,
    timeExceeded,
    corrections,
  });
}
