/**
 * Générateur de questions Mathos via Claude API
 *
 * Modes :
 *   Ciblé   : npx ts-node scripts/generate-questions.ts --theme=algebre --level=lycee --count=20
 *   Fill    : npx ts-node scripts/generate-questions.ts --fill --min=10 --count=20
 *               → remplit toutes les cases avec < --min questions jusqu'à --count questions
 *   All     : npx ts-node scripts/generate-questions.ts --all --count=50
 *               → génère --count questions pour chaque combinaison niveau×thème
 *
 * Prérequis :
 *   ANTHROPIC_API_KEY=sk-ant-...  dans .env.local ou en variable d'environnement
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Charger .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") });

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Types ────────────────────────────────────────────────────────────────────

interface Question {
  id: number;
  type: string;
  theme: string;
  level: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
}

// ─── Descriptions du curriculum (années 90) ───────────────────────────────────

const CURRICULUM: Record<string, Record<string, string>> = {
  primaire: {
    calcul:       "Addition, soustraction, multiplication, division posée. Tables de multiplication. Fractions simples (1/2, 1/4). Nombres décimaux au dixième. Calcul mental.",
    geometrie:    "Carré, rectangle, triangle, cercle. Périmètre et aire de figures simples. Symétrie axiale. Angles droits. Cube et pavé droit.",
    logique:      "Suites numériques et figuratives. Classement selon des critères. Problèmes à étapes simples. Tableaux à double entrée.",
    statistiques: "Lecture de diagrammes en barres et camemberts. Tableaux de données simples.",
    enigme:       "Problèmes de logique simple. Chiffres et lettres. Suites à compléter. Casse-têtes numériques pour enfants.",
  },
  college: {
    calcul:       "Fractions (simplification, opérations). Nombres relatifs. Puissances entières et de 10. Racine carrée. Pourcentages (taux, augmentation, réduction). PGCD et PPCM (algorithme d'Euclide).",
    algebre:      "Expressions littérales (développement, factorisation). Équations du 1er degré ax+b=c. Inéquations du 1er degré. Systèmes 2×2 par substitution et combinaison. Identités remarquables (a+b)², (a−b)², (a+b)(a−b).",
    geometrie:    "Théorème de Pythagore et sa réciproque. Théorème de Thalès (droites parallèles, rapports). Cas d'égalité des triangles (LLL, LAL, ALA). Cercle : tangente, angle inscrit. Translations, rotations, homothéties. Trigonométrie dans le triangle rectangle (sin, cos, tan).",
    logique:      "Raisonnement par l'absurde. Implication et équivalence logique. Contre-exemples. Suites définies par récurrence.",
    probabilites: "Dénombrement (principe multiplicatif). Probabilité classique P(A) = cas favorables / total. Fréquences relatives et cumulées. Arbres de probabilité.",
    statistiques: "Moyenne arithmétique. Médiane et quartiles sur série ordonnée. Histogrammes, diagrammes en bâtons.",
    fonctions:    "Notion de fonction, tableau de valeurs, représentation graphique. Fonctions linéaires et affines. Proportionnalité.",
    enigme:       "Problèmes de logique niveau brevet. Dénombrement astucieux. Suites et régularités. Problèmes d'optimisation simples.",
  },
  lycee: {
    calcul:       "Calcul algébrique : factorisations, fractions rationnelles. Valeur absolue et distance. Intervalles et tableaux de signes. Inéquations produit/quotient. Puissances à exposant rationnel. Logarithme décimal.",
    algebre:      "Polynômes du 2nd degré : forme développée, factorisée, canonique. Discriminant Δ=b²−4ac. Équations et inéquations du 2nd degré. Signe du trinôme. Systèmes 2×2.",
    geometrie:    "Vecteurs : coordonnées, norme, colinéarité, produit scalaire. Équation de droite. Distance point-droite. Cercle trigonométrique, radian. Formules cos(a±b), sin(a±b).",
    logique:      "Raisonnement par récurrence. Quantificateurs ∀ et ∃. Négation, contraposée. Méthodes de démonstration.",
    probabilites: "Probabilités conditionnelles P(A|B). Formule des probabilités totales. Indépendance. Variables aléatoires discrètes, espérance, variance. Loi binomiale B(n,p).",
    fonctions:    "Fonctions affines et du 2nd degré. Fonction racine carrée et inverse. Dérivée : taux de variation, règles de dérivation. Sens de variation. Extrema locaux.",
    statistiques: "Effectifs et fréquences par classes. Variance et écart-type. Histogramme, boîte à moustaches.",
    enigme:       "Problèmes d'optimisation. Dénombrement : arrangements, combinaisons C(n,k). Triangle de Pascal. Problèmes de géométrie astucieux.",
  },
  bac: {
    calcul:       "Suites arithmétiques et géométriques. Suites récurrentes. Limites de suites et fonctions (formes indéterminées). Continuité et théorème des valeurs intermédiaires.",
    algebre:      "Nombres complexes : forme algébrique, module, argument, conjugué. Opérations dans C. Forme trigonométrique. Formule de Moivre. Forme exponentielle re^{iθ}.",
    geometrie:    "Géométrie dans l'espace : droites et plans. Produit scalaire 3D, orthogonalité. Vecteur normal, équation cartésienne d'un plan. Distance point-plan. Équation de sphère.",
    logique:      "Récurrence rigoureuse. Convergence de suites. Démonstrations d'équivalences. Contre-exemples.",
    probabilites: "Loi normale N(μ,σ²), loi N(0,1), standardisation. Intervalle de confiance 95%. Loi des grands nombres. Variables continues à densité.",
    fonctions:    "Exponentielle e^x et ln x : propriétés, dérivées, équations. Primitives. Intégrale de Riemann. Calcul d'aire. Intégration par parties.",
    statistiques: "Fluctuation d'échantillonnage. Intervalle de fluctuation. Tests d'hypothèses. Régression linéaire.",
    enigme:       "Suites récurrentes : points fixes, convergence. Optimisation avec intégrales. Dénombrement et probabilités. Complexes et géométrie.",
  },
  bac_plus: {
    calcul:       "Développements limités en 0 : formules usuelles, opérations. Séries numériques : convergence, règle de d'Alembert. Calcul matriciel : déterminant, inverse.",
    algebre:      "Espaces vectoriels : base, dimension, famille libre. Applications linéaires : noyau, image, rang. Valeurs propres, diagonalisation. Pivot de Gauss.",
    geometrie:    "Espaces euclidiens, Gram-Schmidt. Courbes paramétrées : tangente, longueur. Coniques : parabole, ellipse, hyperbole. Isométries.",
    logique:      "Récurrence forte. Relations d'ordre et d'équivalence. Raisonnements combinatoires. Démonstrations d'existence et d'unicité.",
    probabilites: "V.a. à densité : uniforme, exponentielle, normale. Couples : loi jointe, marginales, covariance. Théorème central limite. Loi de Poisson.",
    fonctions:    "Intégrales généralisées. Équations différentielles linéaires d'ordre 1 et 2. Dérivées partielles, gradient. Séries de Taylor.",
    statistiques: "Estimation ponctuelle : biais, convergence. Test du khi-deux. Régression multiple. Intervalles de confiance.",
    enigme:       "Optimisation de Lagrange. Dénombrement avancé. Suites et séries de fonctions. Calculs combinatoires.",
  },
};

const LEVEL_LABELS: Record<string, string> = {
  primaire:  "Primaire (CE2-CM2)",
  college:   "Collège (6ème-3ème), niveau brevet des collèges",
  lycee:     "Lycée (Seconde-Première), niveau baccalauréat général",
  bac:       "Terminale, niveau baccalauréat",
  bac_plus:  "Bac+1 à Bac+2 (CPGE, BTS, IUT, L1-L2)",
};

const THEME_LABELS: Record<string, string> = {
  calcul:       "Calcul",
  algebre:      "Algèbre",
  geometrie:    "Géométrie",
  logique:      "Logique",
  probabilites: "Probabilités",
  fonctions:    "Fonctions",
  statistiques: "Statistiques",
  enigme:       "Énigme",
};

const ALL_LEVELS  = ["primaire", "college", "lycee", "bac", "bac_plus"];
const ALL_THEMES  = ["calcul", "algebre", "geometrie", "logique", "probabilites", "fonctions", "statistiques", "enigme"];

// ─── Génération d'un batch ────────────────────────────────────────────────────

async function generateBatch(
  theme: string,
  level: string,
  count: number,
  startId: number,
  existing: Question[],
): Promise<Question[]> {

  const existingSample = existing
    .filter(q => q.theme === theme && q.level === level)
    .slice(-10)
    .map(q => `- "${q.question}"`)
    .join("\n");

  const topicDesc = CURRICULUM[level]?.[theme] ?? "";

  const prompt = `Tu es un expert en mathématiques, spécialisé dans la pédagogie française des années 1990.

Génère exactement ${count} questions QCM de mathématiques originales et variées.

**Niveau :** ${LEVEL_LABELS[level] ?? level}
**Thème :** ${THEME_LABELS[theme] ?? theme}
**Programme :** ${topicDesc}

**Règles absolues :**
1. 4 choix de réponse distincts et plausibles (index 0 à 3)
2. 1 seule bonne réponse correcte — vérifier le calcul
3. L'index "answer" est la POSITION de la bonne réponse dans "choices" (0=premier, 1=deuxième, 2=troisième, 3=quatrième)
4. Varier la position de la bonne réponse (pas toujours 0 ou 1)
5. Questions VARIÉES : couvrir tout le programme, pas un seul sous-thème
6. Difficulté strictement adaptée au niveau ${level}
7. Explication en 2-3 phrases qui justifie la bonne réponse et le raisonnement
8. Questions en français, claires et sans ambiguïté mathématique
9. Les distracteurs (mauvaises réponses) doivent être plausibles

${existingSample ? `**Questions déjà existantes (NE PAS répéter ces thèmes) :**\n${existingSample}\n` : ""}

**Format :** Réponds UNIQUEMENT avec un tableau JSON valide, sans aucun texte autour :
[
  {
    "id": ${startId},
    "type": "static",
    "theme": "${theme}",
    "level": "${level}",
    "question": "Énoncé de la question",
    "choices": ["Réponse A", "Réponse B", "Réponse C", "Réponse D"],
    "answer": 2,
    "explanation": "Explication de la bonne réponse."
  }
]`;

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error(`Pas de JSON valide pour ${theme}/${level}`);

  const questions: Question[] = JSON.parse(jsonMatch[0]);
  return questions.map((q, i) => ({ ...q, id: startId + i }));
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function loadQuestions(p: string): Question[] {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function saveQuestions(p: string, questions: Question[]): void {
  fs.writeFileSync(p, JSON.stringify(questions, null, 2));
}

function countByCell(questions: Question[]): Record<string, number> {
  const c: Record<string, number> = {};
  questions.forEach(q => { const k = `${q.level}|${q.theme}`; c[k] = (c[k] || 0) + 1; });
  return c;
}

function printMatrix(questions: Question[]): void {
  const counts = countByCell(questions);
  const pad = (s: string | number, n: number) => String(s).padEnd(n);
  console.log("\n" + pad("", 12) + ALL_THEMES.map(t => pad(t.substring(0, 7), 9)).join(""));
  ALL_LEVELS.forEach(l => {
    const row = ALL_THEMES.map(t => {
      const n = counts[`${l}|${t}`] || 0;
      return pad(`${n < 10 ? "⚠" : n < 30 ? "·" : "✓"}${n}`, 9);
    }).join("");
    console.log(pad(l, 12) + row);
  });
  console.log("\n⚠=<10  ·=10-29  ✓=30+\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args       = process.argv.slice(2);
  const qPath      = path.join(__dirname, "../lib/questions.json");
  const modeAll    = args.includes("--all");
  const modeFill   = args.includes("--fill");
  const dryRun     = args.includes("--dry-run");
  const theme      = args.find(a => a.startsWith("--theme="))?.split("=")[1];
  const level      = args.find(a => a.startsWith("--level="))?.split("=")[1];
  const count      = parseInt(args.find(a => a.startsWith("--count="))?.split("=")[1] ?? "20");
  const minTarget  = parseInt(args.find(a => a.startsWith("--min="))?.split("=")[1]   ?? "10");

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌  ANTHROPIC_API_KEY manquante dans .env.local");
    process.exit(1);
  }

  let questions = loadQuestions(qPath);
  console.log(`\n📚 Questions actuelles : ${questions.length}`);
  printMatrix(questions);

  // Construire la liste des tâches
  let tasks: { theme: string; level: string; need: number }[] = [];

  if (modeAll) {
    for (const l of ALL_LEVELS)
      for (const t of ALL_THEMES)
        if (CURRICULUM[l]?.[t]) tasks.push({ theme: t, level: l, need: count });

  } else if (modeFill) {
    const counts = countByCell(questions);
    for (const l of ALL_LEVELS)
      for (const t of ALL_THEMES) {
        if (!CURRICULUM[l]?.[t]) continue;
        const cur = counts[`${l}|${t}`] || 0;
        if (cur < minTarget) tasks.push({ theme: t, level: l, need: count });
      }
    console.log(`🎯 Mode fill : ${tasks.length} cases sous le seuil de ${minTarget}`);

  } else if (theme && level) {
    tasks.push({ theme, level, need: count });

  } else {
    console.log(`
Usage :
  # Ciblé (une combinaison)
  npx ts-node scripts/generate-questions.ts --theme=algebre --level=lycee --count=20

  # Remplir les cases avec moins de N questions
  npx ts-node scripts/generate-questions.ts --fill --min=20 --count=25

  # Toutes les combinaisons
  npx ts-node scripts/generate-questions.ts --all --count=50

  # Voir les tâches sans générer
  npx ts-node scripts/generate-questions.ts --fill --min=50 --dry-run
`);
    process.exit(0);
  }

  if (tasks.length === 0) { console.log("✅ Toutes les cases atteignent déjà le seuil !"); return; }

  console.log(`📋 ${tasks.length} combinaison(s) à traiter :`);
  tasks.forEach((t, i) => console.log(`  ${i+1}. ${t.level}/${t.theme} → +${t.need} questions`));
  if (dryRun) { console.log("\n(--dry-run : aucune génération)"); return; }

  console.log("\n🚀 Génération...\n");
  let totalAdded = 0, errors = 0;

  for (let i = 0; i < tasks.length; i++) {
    const { theme: t, level: l, need } = tasks[i];
    const maxId = Math.max(...questions.map(q => q.id), 20060);
    const batchSize = Math.min(need, 25);

    process.stdout.write(`[${i+1}/${tasks.length}] ${l}/${t} (+${batchSize})... `);
    try {
      const newQ = await generateBatch(t, l, batchSize, maxId + 1, questions);
      questions = [...questions, ...newQ];
      totalAdded += newQ.length;
      console.log(`✓ +${newQ.length}  (total: ${questions.length})`);
      saveQuestions(qPath, questions); // sauvegarde incrémentale
      if (i < tasks.length - 1) await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      errors++;
      console.log(`✗ ${err}`);
    }
  }

  console.log(`\n✅ Terminé ! +${totalAdded} questions${errors ? ` (${errors} erreurs)` : ""}`);
  printMatrix(questions);
}

main().catch(err => { console.error("Erreur fatale:", err); process.exit(1); });
