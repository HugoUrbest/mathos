import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { jsPDF } from "jspdf";
import { THEME_LABELS } from "@/lib/types";

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();
  const { resultId } = await req.json();

  const { data: result, error } = await supabase
    .from("official_results")
    .select("*")
    .eq("id", resultId)
    .single();

  if (error || !result) return NextResponse.json({ error: "Résultat introuvable" }, { status: 404 });

  const pct = Math.round(((result.score + result.max_score / 3) / (result.max_score * 4 / 3)) * 100);
  const scoreLabel = pct >= 80 ? "Excellent" : pct >= 60 ? "Bon niveau" : pct >= 40 ? "Moyen" : "À travailler";
  const completedDate = new Date(result.completed_at).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });

  // ── Génération PDF ────────────────────────────────────────────────────────
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const W = 210, margin = 20;

  // Fond header
  doc.setFillColor(79, 70, 229); // indigo-600
  doc.rect(0, 0, W, 50, "F");

  // Titre
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28); doc.setFont("helvetica", "bold");
  doc.text("MATHOS", margin, 22);
  doc.setFontSize(12); doc.setFont("helvetica", "normal");
  doc.text("Certificat de résultat mathématiques", margin, 32);
  doc.setFontSize(10);
  doc.text(result.supervised ? "✓ Test Supervisé" : "Test Non Surveillé", margin, 42);

  // Infos candidat
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("Candidat", margin, 65);
  doc.setFont("helvetica", "normal"); doc.setFontSize(11);
  doc.text(`Nom : ${result.candidate_name}`, margin, 74);
  doc.text(`Email : ${result.candidate_email}`, margin, 82);
  doc.text(`Niveau déclaré : ${result.study_level ?? "Non renseigné"}`, margin, 90);
  doc.text(`Date du test : ${completedDate}`, margin, 98);
  if (result.duration_seconds) {
    const mins = Math.floor(result.duration_seconds / 60);
    const secs = result.duration_seconds % 60;
    doc.text(`Durée : ${mins}min ${secs}s`, margin, 106);
  }

  // Ligne séparatrice
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 114, W - margin, 114);

  // Score global
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("Score global", margin, 125);
  doc.setFontSize(32); doc.setFillColor(79, 70, 229);
  doc.setTextColor(79, 70, 229);
  doc.text(`${result.score} / ${result.max_score}`, margin, 142);
  doc.setFontSize(16);
  doc.text(`${pct}% — ${scoreLabel}`, margin + 60, 142);
  doc.setFontSize(10); doc.setTextColor(100, 100, 100); doc.setFont("helvetica", "normal");
  doc.text(`Notation : +3 pts bonne réponse / -1 pt mauvaise réponse / 0 pt non répondu`, margin, 150);
  doc.text(`${result.questions_count} questions posées`, margin, 157);

  // Ligne séparatrice
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, 163, W - margin, 163);

  // Scores par thème
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("Détail par thème", margin, 174);

  let y = 183;
  Object.entries(result.theme_scores as Record<string, { correct: number; total: number; score: number }>)
    .forEach(([theme, data]) => {
      const max = data.total * 3;
      const min = data.total * -1;
      const range = max - min;
      const themePct = range > 0 ? Math.round(((data.score - min) / range) * 100) : 0;
      const label = THEME_LABELS[theme as keyof typeof THEME_LABELS] || theme;

      doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60, 60, 60);
      doc.text(`${label}`, margin, y);
      doc.text(`${data.correct}/${data.total} correctes — ${themePct}%`, margin + 50, y);

      // Mini barre de progression
      doc.setFillColor(230, 230, 250);
      doc.rect(margin + 100, y - 3, 60, 4, "F");
      doc.setFillColor(79, 70, 229);
      doc.rect(margin + 100, y - 3, 60 * (themePct / 100), 4, "F");

      y += 9;
    });

  // Ligne séparatrice
  y += 5;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, W - margin, y);
  y += 10;

  // Identifiant de vérification
  doc.setFontSize(9); doc.setTextColor(120, 120, 120);
  doc.text("Identifiant unique de vérification :", margin, y);
  doc.setFont("helvetica", "bold"); doc.setTextColor(79, 70, 229);
  doc.text(result.id, margin, y + 7);
  doc.setFont("helvetica", "normal"); doc.setTextColor(120, 120, 120);
  doc.text(`Hash SHA-256 : ${result.hash.slice(0, 32)}...`, margin, y + 14);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mathos.fr";
  doc.text(`Vérifier sur : ${appUrl}/verify?id=${result.id}`, margin, y + 21);

  // Footer
  doc.setFillColor(240, 240, 255);
  doc.rect(0, 280, W, 17, "F");
  doc.setFontSize(8); doc.setTextColor(120, 120, 120);
  doc.text("Mathos — Évaluation mathématiques certifiée", margin, 289);
  doc.text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, W - margin - 30, 289);

  // ── Sauvegarder sur Supabase Storage ──────────────────────────────────────
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
  const fileName = `certificates/${result.id}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("mathos-certificates")
    .upload(fileName, pdfBuffer, { contentType: "application/pdf", upsert: true });

  if (!uploadError) {
    const { data: urlData } = supabase.storage.from("mathos-certificates").getPublicUrl(fileName);
    await supabase.from("official_results").update({ pdf_url: urlData.publicUrl }).eq("id", result.id);
  }

  // Retourner le PDF directement
  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="mathos-certificat-${result.id.slice(0, 8)}.pdf"`,
    },
  });
}
