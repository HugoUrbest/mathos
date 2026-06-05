import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// POST /api/tokens/[id]/revoke — Révoquer un token non utilisé
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  // Vérifier que le token appartient bien à ce recruteur/admin
  const { data: token } = await supabase
    .from("tokens")
    .select("*")
    .eq("id", id)
    .eq("generated_by", user.id)
    .single();

  if (!token) return NextResponse.json({ error: "Token introuvable" }, { status: 404 });
  if (token.used_at) return NextResponse.json({ error: "Ce token a déjà été utilisé" }, { status: 400 });

  // Marquer le token comme expiré immédiatement
  const { error } = await supabase
    .from("tokens")
    .update({ expires_at: new Date(0).toISOString() })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ message: "Token révoqué" });
}
