import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mathos — Évalue ton niveau en maths",
  description: "Quiz mathématiques du collège au bac+2, avec benchmark par rapport à tes pairs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
