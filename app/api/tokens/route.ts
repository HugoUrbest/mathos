import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

// POST /api/tokens — Générer un token
export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "recruiter"].includes(profile.role)) {
    return NextResponse.json({ error: "Rôle insuffisant" }, { status: 403 });
  }

  const body = await req.json();
  const supervised = body.supervised === true;
  const level: string | null = body.level || null; // niveau imposé par le recruteur (optionnel)
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 jours

  // Générer un code unique
  let code = generateCode();
  let attempts = 0;
  while (attempts < 5) {
    const { data: existing } = await supabase.from("tokens").select("id").eq("code", code).single();
    if (!existing) break;
    code = generateCode();
    attempts++;
  }

  const { data, error } = await supabase.from("tokens").insert({
    code,
    generated_by: user.id,
    supervised,
    level,
    expires_at: expiresAt.toISOString(),
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ token: data });
}

// GET /api/tokens — Lister les tokens (admin/recruteur)
export async function GET() {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || !["admin", "recruiter"].includes(profile.role)) {
    return NextResponse.json({ error: "Rôle insuffisant" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("tokens")
    .select("*, used_by_user:users!tokens_used_by_fkey(first_name, email)")
    .eq("generated_by", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tokens: data });
}
