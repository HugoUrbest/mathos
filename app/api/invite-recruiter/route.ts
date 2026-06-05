import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Rôle insuffisant" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email manquant" }, { status: 400 });

  // Créer l'invitation
  const { data: invite, error } = await supabase
    .from("recruiter_invitations")
    .insert({ email, invited_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Envoyer l'email d'invitation
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mathos.fr";
  const inviteUrl = `${appUrl}/auth/signup?invite=${invite.invite_code}&role=recruiter&email=${encodeURIComponent(email)}`;

  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@mathos.fr",
      to: email,
      subject: "Invitation Mathos — Accès recruteur",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #4f46e5;">Invitation Mathos</h2>
          <p>Vous avez été invité(e) à accéder à la plateforme Mathos en tant que <strong>recruteur</strong>.</p>
          <p>En tant que recruteur, vous pourrez vérifier les résultats certifiés des candidats en saisissant leur identifiant de test.</p>
          <a href="${inviteUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
            Créer mon compte recruteur →
          </a>
          <p style="color: #666; font-size: 12px;">Ce lien est valable 7 jours.</p>
        </div>
      `,
    });
  }

  return NextResponse.json({ message: `Invitation envoyée à ${email}` });
}
