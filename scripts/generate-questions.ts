/**
 * Script de génération de questions via Claude API
 * Usage: npx ts-node scripts/generate-questions.ts --theme=algebre --level=lycee --count=20
 *
 * Variables d'environnement requises:
 *   ANTHROPIC_API_KEY=sk-ant-...
 */

import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as path from "path";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const THEME_DESCRIPTIONS: Record<string, string> = {
  calcul: "calcul numérique, fractions, puissances, racines, factorielles, PGCD/PPCM",
  algebre: "équations, inéquations, systèmes, factorisation, identités remarquables, polynômes",
  geometrie: "figures planes, solides, trigonométrie, vecteurs, transformations, coordonnées",
  logique: "raisonnement, déduction, contraposée, récurrence, ensembles, combinatoire",
  probabilites: "probabilités classiques, conditionnelles, lois discrètes, indépendance",
  fonctions: "fonctions usuelles, dérivées, limites, étude de fonctions, primitives, intégrales",
  statistiques: "moyenne, médiane, mode, écart-type, variance, représentations graphiques",
};

const LEVEL_DESCRIPTIONS: Record<string, string> = {
  college: "collège (6ème-3ème), niveau brevet des collèges",
  lycee: "lycée général (2nde-1ère), niveau intermédiaire",
  bac: "terminale et baccalauréat",
  bac_plus: "bac+1 et bac+2 (CPGE, BTS, IUT, L1-L2)",
};

async function generateBatch(theme: string, level: string, count: number, startId: number) {
  const prompt = `Tu es un expert en mathématiques et en pédagogie. Génère exactement ${count} questions QCM de mathématiques.

Thème : ${theme} — ${THEME_DESCRIPTIONS[theme]}
Niveau : ${level} — ${LEVEL_DESCRIPTIONS[level]}

Contraintes :
- 4 choix de réponse par question (index 0 à 3)
- 1 seule bonne réponse
- Questions variées, ne pas répéter le même type
- Explication concise (2-3 phrases max) qui explique le raisonnement
- Difficulté adaptée au niveau demandé
- Questions en français

Réponds UNIQUEMENT avec un tableau JSON valide, aucun texte autour :
[
  {
    "id": ${startId},
    "type": "static",
    "theme": "${theme}",
    "level": "${level}",
    "question": "...",
    "choices": ["...", "...", "...", "..."],
    "answer": 0,
    "explanation": "..."
  },
  ...
]`;

  const response = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 8000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  // Extraire le JSON (au cas où Claude ajouterait du texte)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("Pas de JSON valide dans la réponse");

  return JSON.parse(jsonMatch[0]);
}

async function main() {
  const args = process.argv.slice(2);
  const theme = args.find((a) => a.startsWith("--theme="))?.split("=")[1] || "algebre";
  const level = args.find((a) => a.startsWith("--level="))?.split("=")[1] || "lycee";
  const count = parseInt(args.find((a) => a.startsWith("--count="))?.split("=")[1] || "20");

  // Charger les questions existantes pour éviter les ID en double
  const questionsPath = path.join(__dirname, "../lib/questions.json");
  const existing = JSON.parse(fs.readFileSync(questionsPath, "utf-8"));
  const maxId = Math.max(...existing.map((q: { id: number }) => q.id), 0);

  console.log(`Génération de ${count} questions — thème: ${theme}, niveau: ${level}`);
  console.log(`ID de départ: ${maxId + 1}`);

  const batches = Math.ceil(count / 20);
  const allNew: object[] = [];

  for (let i = 0; i < batches; i++) {
    const batchCount = Math.min(20, count - i * 20);
    const startId = maxId + 1 + i * 20;
    console.log(`Batch ${i + 1}/${batches} (${batchCount} questions, IDs ${startId}-${startId + batchCount - 1})...`);

    const questions = await generateBatch(theme, level, batchCount, startId);
    allNew.push(...questions);
    console.log(`  ✓ ${questions.length} questions générées`);

    // Pause entre les batches
    if (i < batches - 1) await new Promise((r) => setTimeout(r, 1000));
  }

  // Fusionner avec les existantes
  const merged = [...existing, ...allNew];
  fs.writeFileSync(questionsPath, JSON.stringify(merged, null, 2));
  console.log(`\n✅ ${allNew.length} questions ajoutées. Total: ${merged.length} questions.`);
}

main().catch(console.error);
