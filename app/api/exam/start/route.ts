import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { selectExamQuestions, stripAnswers } from "@/lib/questions.server";
import { Level } from "@/lib/types";

// POST /api/exam/start — Démarre une session d'examen certifiant.
// Le serveur tire 50 questions, les enregistre, et renvoie une version EXPURGÉE
// (sans bonnes réponses). C'est ce qui empêche la triche par lecture du bundle.

const EXAM_MINUTES = 50;
const GRACE_MINUTES = 2; // petite marge réseau avant l'expiration dure

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = String(body.tokenCode || "").trim().toUpperCase();
  const requestedLevel = body.level as Level | undefined;
  const studyLevel = body.studyLevel as string | undefined;

  if (code.length !== 8) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }

  // Valider le token (non utilisé, non expiré)
  const { data: token, error: tokenErr } = await supabase
    .from("tokens")
    .select("*")
    .eq("code", code)
    .is("used_at", null)
    .single();
  if (tokenErr || !token) {
    return NextResponse.json({ error: "Token invalide ou déjà utilisé" }, { status: 400 });
  }
  if (new Date(token.expires_at) < new Date()) {
    return NextResponse.json({ error: "Token expiré" }, { status: 400 });
  }

  // Niveau : imposé par le recruteur s'il existe, sinon choix du candidat.
  const examLevel: Level | undefined = (token.level as Level) || requestedLevel || undefined;

  // Tirage serveur
  const questions = selectExamQuestions(examLevel);
  const questionIds = questions.map((q) => q.id);

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + (EXAM_MINUTES + GRACE_MINUTES) * 60_000);

  const { data: session, error: sErr } = await supabase
    .from("exam_sessions")
    .insert({
      user_id: user.id,
      token_id: token.id,
      token_code: code,
      level: examLevel ?? null,
      study_level: studyLevel ?? null,
      question_ids: questionIds,
      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  if (sErr) return NextResponse.json({ error: sErr.message }, { status: 500 });

  return NextResponse.json({
    sessionId: session.id,
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    durationSeconds: EXAM_MINUTES * 60,
    questions: stripAnswers(questions), // ← jamais les bonnes réponses
  });
}
