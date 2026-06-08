"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [hasProfile, setHasProfile] = useState<boolean | null>(null); // null = chargement

  useEffect(() => {
    setHasProfile(!!localStorage.getItem("mathos_pending_level"));
  }, []);

  // Redirection silencieuse si pas de profil
  useEffect(() => {
    if (hasProfile === false) router.push("/profil?first=1");
  }, [hasProfile, router]);

  // Pendant la vérification du profil
  if (hasProfile === null || hasProfile === false) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-300 text-2xl font-black tracking-tight">Mathos</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center space-y-8">

        <div>
          <div className="text-6xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
            Mathos
          </div>
          <p className="mt-3 text-gray-500 text-lg">
            Évalue ton niveau en maths et situe-toi par rapport à tes pairs
          </p>
        </div>

        {/* Trois modes */}
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => router.push("/entrainement")}
            className="bg-white border-2 border-gray-200 hover:border-indigo-300 rounded-3xl p-6 text-left transition-all"
          >
            <div className="text-3xl mb-2">💪</div>
            <div className="font-bold text-xl text-gray-900">Entraînement</div>
            <div className="text-gray-500 text-sm mt-1">
              10 questions · 1 thème · difficulté adaptée à ton niveau
            </div>
            <div className="mt-3 text-xs bg-indigo-50 text-indigo-700 rounded-xl px-3 py-1 inline-block">
              Travaille point par point
            </div>
          </button>

          <button
            onClick={() => router.push("/quiz")}
            className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-3xl p-6 text-left shadow-lg shadow-indigo-200 hover:shadow-xl transition-all"
          >
            <div className="text-3xl mb-2">🏆</div>
            <div className="font-bold text-xl">Grand Test</div>
            <div className="text-indigo-200 text-sm mt-1">
              30 questions · tous thèmes · 30 min · horodaté
            </div>
            <div className="mt-3 text-xs bg-white/20 rounded-xl px-3 py-1 inline-block">
              Évalue ton niveau global
            </div>
          </button>

          <button
            onClick={() => router.push("/examen")}
            className="bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-3xl p-6 text-left shadow-lg shadow-amber-200 hover:shadow-xl transition-all"
          >
            <div className="text-3xl mb-2">🏅</div>
            <div className="font-bold text-xl">Examen Certifiant</div>
            <div className="text-amber-100 text-sm mt-1">
              50 questions · tous thèmes · 50 min · certificat PDF
            </div>
            <div className="mt-3 text-xs bg-white/20 rounded-xl px-3 py-1 inline-block">
              Code recruteur ou 50 € · résultat opposable
            </div>
          </button>
        </div>

        <div className="flex items-center justify-center gap-6">
          <button onClick={() => router.push("/stats")}
            className="text-sm text-gray-400 hover:text-indigo-600 transition-colors">
            📊 Mes résultats
          </button>
          <button onClick={() => router.push("/profil")}
            className="text-sm text-gray-400 hover:text-indigo-600 transition-colors">
            👤 Mon profil
          </button>
        </div>

      </div>
    </main>
  );
}
