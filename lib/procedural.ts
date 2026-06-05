/**
 * Générateur procédural de questions mathématiques
 * Chaque générateur produit une question unique avec paramètres aléatoires,
 * calcule la bonne réponse et génère des distracteurs plausibles.
 */

import { Theme, Level, Question } from "./types";

// ─── Utilitaires ──────────────────────────────────────────────────────────────

let _procId = 90000;
function nextId() { return _procId++; }

/** Entier aléatoire entre min et max inclus */
function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Choisit un élément aléatoire dans un tableau */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Mélange un tableau (Fisher-Yates) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Construit un QCM : place la bonne réponse à un index aléatoire */
function buildChoices(correct: string, wrongs: string[]): { choices: string[]; answer: number } {
  const idx = rand(0, 3);
  const choices = [...wrongs.slice(0, 3)];
  choices.splice(idx, 0, correct);
  return { choices: choices.slice(0, 4), answer: idx };
}

/** Formate un nombre : évite -0, affiche fractions si besoin */
function fmt(n: number): string {
  if (Object.is(n, -0)) return "0";
  return String(n);
}

// ─── Type d'un générateur ─────────────────────────────────────────────────────

interface Generator {
  theme: Theme;
  level: Level;
  weight: number; // fréquence relative de sélection
  generate: () => Omit<Question, "id" | "type">;
}

// ─── CALCUL — Primaire ────────────────────────────────────────────────────────

const additionPrimaire: Generator = {
  theme: "calcul", level: "primaire", weight: 3,
  generate() {
    const a = rand(10, 99), b = rand(10, 99);
    const correct = a + b;
    const wrongs = shuffle([correct + 1, correct - 1, correct + 10, a + b + rand(2, 9)].filter(v => v !== correct)).slice(0, 3);
    const { choices, answer } = buildChoices(fmt(correct), wrongs.map(fmt));
    return { theme: "calcul", level: "primaire", question: `Combien font ${a} + ${b} ?`, choices, answer, explanation: `${a} + ${b} = ${correct}. On additionne d'abord les unités puis les dizaines en gérant la retenue si nécessaire.` };
  },
};

const soustractionPrimaire: Generator = {
  theme: "calcul", level: "primaire", weight: 3,
  generate() {
    const b = rand(10, 50), a = rand(b + 1, b + 50);
    const correct = a - b;
    const wrongs = shuffle([correct + 1, correct - 1, correct + 10, b - (a - b)].filter(v => v !== correct && v > 0)).slice(0, 3);
    const { choices, answer } = buildChoices(fmt(correct), wrongs.map(fmt));
    return { theme: "calcul", level: "primaire", question: `Combien font ${a} - ${b} ?`, choices, answer, explanation: `${a} - ${b} = ${correct}. Vérification : ${correct} + ${b} = ${a} ✓` };
  },
};

const multiplicationTablePrimaire: Generator = {
  theme: "calcul", level: "primaire", weight: 4,
  generate() {
    const a = rand(2, 9), b = rand(2, 9);
    const correct = a * b;
    const wrongs = shuffle([
      (a + 1) * b, a * (b + 1), (a - 1) * b, a * b + rand(1, 3)
    ].filter(v => v !== correct)).slice(0, 3);
    const { choices, answer } = buildChoices(fmt(correct), wrongs.map(fmt));
    return { theme: "calcul", level: "primaire", question: `Combien font ${a} × ${b} ?`, choices, answer, explanation: `${a} × ${b} = ${correct}. Table de ${a} : ${Array.from({length: 5}, (_, i) => `${a}×${i+1}=${a*(i+1)}`).join(", ")}...` };
  },
};

const divisionTablePrimaire: Generator = {
  theme: "calcul", level: "primaire", weight: 3,
  generate() {
    const b = rand(2, 9), correct = rand(2, 9);
    const a = b * correct;
    const wrongs = shuffle([correct + 1, correct - 1, correct + 2, b].filter(v => v !== correct && v > 0)).slice(0, 3);
    const { choices, answer } = buildChoices(fmt(correct), wrongs.map(fmt));
    return { theme: "calcul", level: "primaire", question: `Combien font ${a} ÷ ${b} ?`, choices, answer, explanation: `${a} ÷ ${b} = ${correct} car ${b} × ${correct} = ${a}.` };
  },
};

const pourcentageSimplePrimaire: Generator = {
  theme: "calcul", level: "primaire", weight: 2,
  generate() {
    const total = pick([10, 20, 50, 100, 200]);
    const pct = pick([10, 20, 25, 50]);
    const correct = (total * pct) / 100;
    const wrongs = shuffle([correct + 5, correct - 5, correct * 2, total - correct].filter(v => v !== correct && v > 0)).slice(0, 3);
    const { choices, answer } = buildChoices(fmt(correct), wrongs.map(fmt));
    return { theme: "calcul", level: "primaire", question: `Combien font ${pct}% de ${total} ?`, choices, answer, explanation: `${pct}% de ${total} = ${total} × ${pct}/100 = ${correct}.` };
  },
};

// ─── CALCUL — Collège ─────────────────────────────────────────────────────────

const puissanceCollege: Generator = {
  theme: "calcul", level: "college", weight: 3,
  generate() {
    const base = rand(2, 5), exp = rand(2, 4);
    const correct = Math.pow(base, exp);
    const wrongs = shuffle([base * exp, correct + rand(1, 5), correct - rand(1, 5), Math.pow(base, exp - 1)].filter(v => v !== correct && v > 0)).slice(0, 3);
    const { choices, answer } = buildChoices(fmt(correct), wrongs.map(fmt));
    const steps = Array.from({length: exp}, () => base).join(" × ");
    return { theme: "calcul", level: "college", question: `Calculer ${base}^${exp}`, choices, answer, explanation: `${base}^${exp} = ${steps} = ${correct}. On multiplie ${base} par lui-même ${exp} fois.` };
  },
};

const fractionAdditionCollege: Generator = {
  theme: "calcul", level: "college", weight: 3,
  generate() {
    const denom = pick([2, 3, 4, 5, 6]);
    const n1 = rand(1, denom - 1), n2 = rand(1, denom - 1);
    const numSum = n1 + n2;
    // Simplification
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const g = gcd(numSum, denom);
    const rNum = numSum / g, rDen = denom / g;
    const correctStr = rDen === 1 ? fmt(rNum) : `${rNum}/${rDen}`;
    const wrongStrs = shuffle([
      `${n1 + n2}/${denom * 2}`,
      `${n1 * n2}/${denom}`,
      `${rNum + 1}/${rDen}`,
      `${rNum}/${rDen + 1}`,
    ].filter(s => s !== correctStr)).slice(0, 3);
    const { choices, answer } = buildChoices(correctStr, wrongStrs);
    return {
      theme: "calcul", level: "college",
      question: `Calculer : ${n1}/${denom} + ${n2}/${denom}`,
      choices, answer,
      explanation: `Même dénominateur : ${n1}/${denom} + ${n2}/${denom} = ${numSum}/${denom}${g > 1 ? ` = ${correctStr}` : ""}. On additionne les numérateurs et on garde le dénominateur.`,
    };
  },
};

const pourcentageCollege: Generator = {
  theme: "calcul", level: "college", weight: 3,
  generate() {
    const pct = pick([10, 15, 20, 25, 30, 40, 50]);
    const base = pick([40, 60, 80, 120, 150, 200, 240, 300]);
    const correct = (base * pct) / 100;
    const wrongs = shuffle([correct + pct, correct - pct, base - correct, correct * 2].filter(v => v !== correct && v > 0)).slice(0, 3);
    const { choices, answer } = buildChoices(fmt(correct), wrongs.map(fmt));
    return { theme: "calcul", level: "college", question: `Calculer ${pct}% de ${base}.`, choices, answer, explanation: `${pct}% de ${base} = ${base} × ${pct}/100 = ${base} × 0,${pct < 10 ? "0" + pct : pct} = ${correct}.` };
  },
};

// ─── ALGÈBRE — Collège ────────────────────────────────────────────────────────

const equationLineaireCollege: Generator = {
  theme: "algebre", level: "college", weight: 4,
  generate() {
    const a = rand(2, 9), x = rand(1, 10), b = rand(1, 20);
    const c = a * x + b;
    const correct = x;
    const wrongs = shuffle([x + 1, x - 1, x + 2, c - b].filter(v => v !== correct)).slice(0, 3);
    const { choices, answer } = buildChoices(`x = ${correct}`, wrongs.map(v => `x = ${v}`));
    return { theme: "algebre", level: "college", question: `Résoudre : ${a}x + ${b} = ${c}`, choices, answer, explanation: `${a}x + ${b} = ${c} → ${a}x = ${c} - ${b} = ${c - b} → x = ${c - b}/${a} = ${correct}.` };
  },
};

const developperCollege: Generator = {
  theme: "algebre", level: "college", weight: 3,
  generate() {
    const a = rand(2, 6), b = rand(1, 8), c = rand(1, 8);
    // a(x + b) = ax + ab... mais ici on fait a(bx + c)
    const ab = a * b, ac = a * c;
    const correct = `${ab}x + ${ac}`;
    const wrongs = [`${a}x + ${ac}`, `${ab}x + ${c}`, `${a + b}x + ${ac}`];
    const { choices, answer } = buildChoices(correct, wrongs);
    return { theme: "algebre", level: "college", question: `Développer : ${a}(${b}x + ${c})`, choices, answer, explanation: `On distribue : ${a} × ${b}x = ${ab}x et ${a} × ${c} = ${ac}. Résultat : ${ab}x + ${ac}.` };
  },
};

// ─── ALGÈBRE — Lycée ──────────────────────────────────────────────────────────

const equationQuadratiqueSimpleLycee: Generator = {
  theme: "algebre", level: "lycee", weight: 3,
  generate() {
    const r1 = rand(1, 7), r2 = rand(1, 7);
    const s = r1 + r2, p = r1 * r2;
    const sStr = s > 0 ? `- ${s}` : `+ ${Math.abs(s)}`;
    const pStr = p > 0 ? `+ ${p}` : `- ${Math.abs(p)}`;
    const correct = `x = ${r1} ou x = ${r2}`;
    const wrongs = [`x = ${r1 + 1} ou x = ${r2}`, `x = ${s} ou x = ${p}`, `x = -${r1} ou x = -${r2}`];
    const { choices, answer } = buildChoices(correct, wrongs);
    return { theme: "algebre", level: "lycee", question: `Résoudre : x² ${sStr}x ${pStr} = 0`, choices, answer, explanation: `On cherche deux nombres de somme ${s} et produit ${p} : ce sont ${r1} et ${r2}. Vérif : (x-${r1})(x-${r2}) ✓` };
  },
};

const inegLycee: Generator = {
  theme: "algebre", level: "lycee", weight: 3,
  generate() {
    const a = rand(2, 5), b = rand(1, 10), c = rand(b + 1, b + 20);
    const rhs = c - b;
    const xVal = rhs / a;
    const correct = Number.isInteger(xVal) ? `x > ${xVal}` : `x > ${rhs}/${a}`;
    const wrongs = [
      `x < ${Number.isInteger(xVal) ? xVal : `${rhs}/${a}`}`,
      `x > ${c}`,
      `x > ${a + b}`,
    ];
    const { choices, answer } = buildChoices(correct, wrongs);
    return { theme: "algebre", level: "lycee", question: `Résoudre : ${a}x + ${b} > ${c}`, choices, answer, explanation: `${a}x > ${c} - ${b} = ${rhs} → x > ${rhs}/${a}${Number.isInteger(xVal) ? " = " + xVal : ""}.` };
  },
};

// ─── GÉOMÉTRIE — Primaire & Collège ──────────────────────────────────────────

const aireRectangle: Generator = {
  theme: "geometrie", level: "primaire", weight: 3,
  generate() {
    const l = rand(2, 15), w = rand(2, 10);
    const correct = l * w;
    const wrongs = shuffle([2 * (l + w), correct + rand(1, 5), l * w + l, l + w].filter(v => v !== correct)).slice(0, 3);
    const { choices, answer } = buildChoices(`${correct} cm²`, wrongs.map(v => `${v} cm²`));
    return { theme: "geometrie", level: "primaire", question: `Quelle est l'aire d'un rectangle de ${l} cm × ${w} cm ?`, choices, answer, explanation: `Aire = longueur × largeur = ${l} × ${w} = ${correct} cm².` };
  },
};

const perimetreRectangle: Generator = {
  theme: "geometrie", level: "primaire", weight: 3,
  generate() {
    const l = rand(3, 15), w = rand(2, 10);
    const correct = 2 * (l + w);
    const wrongs = shuffle([l * w, l + w, correct + 2, correct - 2].filter(v => v !== correct && v > 0)).slice(0, 3);
    const { choices, answer } = buildChoices(`${correct} cm`, wrongs.map(v => `${v} cm`));
    return { theme: "geometrie", level: "primaire", question: `Quel est le périmètre d'un rectangle de ${l} cm × ${w} cm ?`, choices, answer, explanation: `Périmètre = 2 × (longueur + largeur) = 2 × (${l} + ${w}) = 2 × ${l + w} = ${correct} cm.` };
  },
};

const pythagoreTripletCollege: Generator = {
  theme: "geometrie", level: "college", weight: 3,
  generate() {
    const triplets: [number, number, number][] = [[3,4,5],[5,12,13],[8,15,17],[7,24,25],[6,8,10],[9,12,15],[12,16,20]];
    const [a, b, c] = pick(triplets);
    const correct = `${c} cm`;
    const wrongs = [`${a + b} cm`, `${Math.round(Math.sqrt(a + b))} cm`, `${c + 1} cm`];
    const { choices, answer } = buildChoices(correct, wrongs);
    return { theme: "geometrie", level: "college", question: `Triangle rectangle avec les deux côtés de l'angle droit = ${a} cm et ${b} cm. Quelle est la longueur de l'hypoténuse ?`, choices, answer, explanation: `Pythagore : c² = ${a}² + ${b}² = ${a*a} + ${b*b} = ${c*c}, donc c = √${c*c} = ${c} cm.` };
  },
};

const distancePointsLycee: Generator = {
  theme: "geometrie", level: "lycee", weight: 3,
  generate() {
    const x1 = rand(0, 5), y1 = rand(0, 5);
    const dx = rand(1, 6), dy = rand(1, 6);
    const x2 = x1 + dx, y2 = y1 + dy;
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(d2);
    const dStr = Number.isInteger(d) ? `${d}` : `√${d2}`;
    const correct = `${dStr} unités`;
    const wrongs = [`${dx + dy} unités`, `√${d2 + 1} unités`, `${Math.abs(dx - dy)} unités`];
    const { choices, answer } = buildChoices(correct, wrongs);
    return { theme: "geometrie", level: "lycee", question: `Quelle est la distance entre A(${x1}, ${y1}) et B(${x2}, ${y2}) ?`, choices, answer, explanation: `AB = √[(${x2}-${x1})² + (${y2}-${y1})²] = √[${dx}² + ${dy}²] = √[${dx*dx} + ${dy*dy}] = √${d2} = ${dStr}.` };
  },
};

const aireCercleLycee: Generator = {
  theme: "geometrie", level: "lycee", weight: 2,
  generate() {
    const r = rand(2, 10);
    const correct = `${r * r}π cm²`;
    const wrongs = [`${2 * r}π cm²`, `${r * r * 2}π cm²`, `${r}π cm²`];
    const { choices, answer } = buildChoices(correct, wrongs);
    return { theme: "geometrie", level: "lycee", question: `Quelle est l'aire d'un disque de rayon ${r} cm ?`, choices, answer, explanation: `Aire = π × r² = π × ${r}² = ${r*r}π cm².` };
  },
};

// ─── PROBABILITÉS ─────────────────────────────────────────────────────────────

const probSimpleLycee: Generator = {
  theme: "probabilites", level: "lycee", weight: 3,
  generate() {
    const total = pick([4, 5, 6, 8, 10, 12]);
    const fav = rand(1, total - 1);
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const g = gcd(fav, total);
    const rN = fav / g, rD = total / g;
    const correct = rD === 1 ? `${rN}` : `${rN}/${rD}`;
    const wrong1 = `${fav + 1}/${total}`;
    const wrong2 = `${total - fav}/${total}`;
    const wrong3 = `1/${total}`;
    const { choices, answer } = buildChoices(correct, [wrong1, wrong2, wrong3].filter(w => w !== correct).slice(0, 3));
    const objet = pick(["billes rouges", "cartes de cœur", "boules blanches", "jetons bleus"]);
    return {
      theme: "probabilites", level: "lycee",
      question: `Un sac contient ${total} objets dont ${fav} ${objet}. Quelle est la probabilité d'en tirer un au hasard ?`,
      choices, answer,
      explanation: `P = ${fav}/${total}${g > 1 ? ` = ${correct}` : ""}. On divise le nombre d'issues favorables par le total des issues possibles.`,
    };
  },
};

const probComplementaire: Generator = {
  theme: "probabilites", level: "lycee", weight: 2,
  generate() {
    const num = rand(1, 9), den = rand(num + 1, 10);
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const g = gcd(den - num, den);
    const rN = (den - num) / g, rD = den / g;
    const correct = rD === 1 ? `${rN}` : `${rN}/${rD}`;
    const wrong1 = `${num}/${den}`;
    const wrong2 = `${den - num + 1}/${den}`;
    const wrong3 = `1/${den}`;
    const { choices, answer } = buildChoices(correct, [wrong1, wrong2, wrong3].filter(w => w !== correct).slice(0, 3));
    return {
      theme: "probabilites", level: "lycee",
      question: `P(A) = ${num}/${den}. Quelle est P(non A) ?`,
      choices, answer,
      explanation: `P(non A) = 1 - P(A) = 1 - ${num}/${den} = ${den - num}/${den}${g > 1 ? ` = ${correct}` : ""}. Événement complémentaire.`,
    };
  },
};

// ─── FONCTIONS ────────────────────────────────────────────────────────────────

const evaluerFonctionLycee: Generator = {
  theme: "fonctions", level: "lycee", weight: 3,
  generate() {
    const a = rand(1, 5), b = rand(0, 8), x0 = rand(1, 6);
    const correct = a * x0 + b;
    const wrongs = shuffle([correct + 1, correct - 1, a * x0, b + x0].filter(v => v !== correct)).slice(0, 3);
    const { choices, answer } = buildChoices(fmt(correct), wrongs.map(fmt));
    return { theme: "fonctions", level: "lycee", question: `Si f(x) = ${a}x + ${b}, que vaut f(${x0}) ?`, choices, answer, explanation: `f(${x0}) = ${a} × ${x0} + ${b} = ${a * x0} + ${b} = ${correct}.` };
  },
};

const deriveeMonome: Generator = {
  theme: "fonctions", level: "bac", weight: 3,
  generate() {
    const n = rand(2, 5), a = rand(1, 6);
    const coef = a * n;
    const correct = `${coef}x^${n - 1}`;
    const wrongs = [`${a}x^${n - 1}`, `${coef}x^${n}`, `${n}x^${n - 1}`];
    const { choices, answer } = buildChoices(correct, wrongs.filter(w => w !== correct).slice(0, 3));
    return { theme: "fonctions", level: "bac", question: `Quelle est la dérivée de f(x) = ${a}x^${n} ?`, choices, answer, explanation: `(ax^n)' = n·a·x^(n-1). Ici : (${a}x^${n})' = ${n}×${a}·x^(${n}-1) = ${coef}x^${n - 1}.` };
  },
};

const deriveePolynome: Generator = {
  theme: "fonctions", level: "bac", weight: 3,
  generate() {
    const a = rand(1, 4), b = rand(1, 6), c = rand(0, 8);
    const da = 2 * a, db = b;
    const correct = `${da}x + ${db}`;
    const wrongs = [`${a}x + ${db}`, `${da}x² + ${db}x`, `${da}x + ${c}`];
    const { choices, answer } = buildChoices(correct, wrongs.filter(w => w !== correct).slice(0, 3));
    return { theme: "fonctions", level: "bac", question: `Quelle est la dérivée de f(x) = ${a}x² + ${b}x + ${c} ?`, choices, answer, explanation: `f'(x) : (${a}x²)' = ${da}x, (${b}x)' = ${db}, (${c})' = 0. Donc f'(x) = ${da}x + ${db}.` };
  },
};

const limitePolynomeBac: Generator = {
  theme: "fonctions", level: "bac", weight: 2,
  generate() {
    const a = rand(1, 5), b = rand(0, 6);
    const x0 = rand(1, 5);
    const correct = a * x0 * x0 + b;
    const wrongs = [a * x0 + b, correct + 1, 2 * a * x0].filter(v => v !== correct).slice(0, 3);
    const { choices, answer } = buildChoices(fmt(correct), wrongs.map(fmt));
    return { theme: "fonctions", level: "bac", question: `Calculer la limite de f(x) = ${a}x² + ${b} quand x → ${x0}.`, choices, answer, explanation: `On substitue directement : lim = ${a}×${x0}² + ${b} = ${a * x0 * x0} + ${b} = ${correct}.` };
  },
};

const suiteArithmetiqueBacPlus: Generator = {
  theme: "fonctions", level: "bac_plus", weight: 3,
  generate() {
    const u1 = rand(1, 10), r = rand(1, 8), n = rand(5, 12);
    const un = u1 + (n - 1) * r;
    const correct = fmt(un);
    const wrongs = [fmt(u1 + n * r), fmt(u1 + (n - 2) * r), fmt(u1 * r)].filter(v => v !== correct).slice(0, 3);
    const { choices, answer } = buildChoices(correct, wrongs);
    return { theme: "fonctions", level: "bac_plus", question: `Suite arithmétique : u₁ = ${u1}, raison = ${r}. Que vaut u${n} ?`, choices, answer, explanation: `uₙ = u₁ + (n-1)×r = ${u1} + (${n}-1)×${r} = ${u1} + ${(n - 1) * r} = ${un}.` };
  },
};

const suiteGeometriqueBacPlus: Generator = {
  theme: "fonctions", level: "bac_plus", weight: 3,
  generate() {
    const u1 = rand(1, 5), q = rand(2, 3), n = rand(3, 6);
    const un = u1 * Math.pow(q, n - 1);
    const correct = fmt(un);
    const wrongs = [fmt(u1 * Math.pow(q, n)), fmt(u1 + (n - 1) * q), fmt(un + q)].filter(v => v !== correct).slice(0, 3);
    const { choices, answer } = buildChoices(correct, wrongs);
    return { theme: "fonctions", level: "bac_plus", question: `Suite géométrique : u₁ = ${u1}, raison = ${q}. Que vaut u${n} ?`, choices, answer, explanation: `uₙ = u₁ × q^(n-1) = ${u1} × ${q}^${n - 1} = ${u1} × ${Math.pow(q, n - 1)} = ${un}.` };
  },
};

// ─── STATISTIQUES ─────────────────────────────────────────────────────────────

const moyenneLycee: Generator = {
  theme: "statistiques", level: "lycee", weight: 3,
  generate() {
    const n = rand(4, 6);
    const values = Array.from({ length: n }, () => rand(5, 18));
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / n;
    const correct = Number.isInteger(avg) ? fmt(avg) : (Math.round(avg * 10) / 10).toString();
    const wrongs = [fmt(Math.round(avg) + 1), fmt(Math.round(avg) - 1), fmt(Math.max(...values))].filter(v => v !== correct).slice(0, 3);
    const { choices, answer } = buildChoices(correct, wrongs);
    return { theme: "statistiques", level: "lycee", question: `Quelle est la moyenne de la série : ${values.join(", ")} ?`, choices, answer, explanation: `Moyenne = (${values.join("+")}) / ${n} = ${sum} / ${n} = ${correct}.` };
  },
};

const ecartTypeLycee: Generator = {
  theme: "statistiques", level: "lycee", weight: 2,
  generate() {
    const variance = pick([4, 9, 16, 25, 36, 49]);
    const ecartType = Math.sqrt(variance);
    const correct = fmt(ecartType);
    const wrongs = [fmt(variance), fmt(ecartType + 1), fmt(ecartType * 2)].filter(v => v !== correct).slice(0, 3);
    const { choices, answer } = buildChoices(correct, wrongs);
    return { theme: "statistiques", level: "lycee", question: `La variance d'une série est ${variance}. Quel est son écart-type ?`, choices, answer, explanation: `Écart-type σ = √variance = √${variance} = ${ecartType}.` };
  },
};

// ─── LOGIQUE ──────────────────────────────────────────────────────────────────

const divisibilitéCollege: Generator = {
  theme: "logique", level: "college", weight: 3,
  generate() {
    const divisor = pick([2, 3, 4, 5, 6, 9]);
    const quotient = rand(10, 99);
    const isDivisible = Math.random() > 0.4;
    const n = isDivisible ? quotient * divisor : quotient * divisor + rand(1, divisor - 1);
    const correct = isDivisible ? "Oui" : "Non";
    const { choices, answer } = buildChoices(correct, [isDivisible ? "Non" : "Oui", "Impossible à dire", "Ça dépend"]);
    const hint = divisor === 2 ? "un nombre pair (termine par 0,2,4,6 ou 8)"
      : divisor === 3 ? "la somme de ses chiffres est divisible par 3"
      : divisor === 5 ? "il termine par 0 ou 5"
      : divisor === 9 ? "la somme de ses chiffres est divisible par 9"
      : `${n} ÷ ${divisor} = ${Math.floor(n / divisor)} reste ${n % divisor}`;
    return { theme: "logique", level: "college", question: `Le nombre ${n} est-il divisible par ${divisor} ?`, choices, answer, explanation: `${n} ÷ ${divisor} = ${Math.floor(n / divisor)} (reste ${n % divisor}). ${isDivisible ? `Oui, ${hint}.` : `Non (reste ${n % divisor}).`}` };
  },
};

const suiteLogiqueCollege: Generator = {
  theme: "logique", level: "college", weight: 3,
  generate() {
    const type = pick(["arith", "geo", "carres"]);
    let terms: number[], next: number, expl: string;
    if (type === "arith") {
      const start = rand(1, 20), step = rand(2, 8);
      terms = Array.from({ length: 4 }, (_, i) => start + i * step);
      next = start + 4 * step;
      expl = `Suite arithmétique de raison +${step} : chaque terme augmente de ${step}.`;
    } else if (type === "geo") {
      const start = rand(1, 4), ratio = rand(2, 3);
      terms = Array.from({ length: 4 }, (_, i) => start * Math.pow(ratio, i));
      next = start * Math.pow(ratio, 4);
      expl = `Suite géométrique de raison ${ratio} : chaque terme est multiplié par ${ratio}.`;
    } else {
      const offset = rand(0, 3);
      terms = Array.from({ length: 4 }, (_, i) => (i + 1 + offset) * (i + 1 + offset));
      next = (5 + offset) * (5 + offset);
      expl = `Suite des carrés : ${terms.map((t, i) => `${i + 1 + offset}²=${t}`).join(", ")}, ${5 + offset}²=${next}.`;
    }
    const correct = fmt(next);
    const wrongs = shuffle([next + terms[1] - terms[0], next - 1, next * 2].filter(v => v !== next)).slice(0, 3).map(fmt);
    const { choices, answer } = buildChoices(correct, wrongs);
    return { theme: "logique", level: "college", question: `Quelle est la suite logique : ${terms.join(", ")}, ... ?`, choices, answer, explanation: expl };
  },
};

// ─── Registre de tous les générateurs ────────────────────────────────────────

const GENERATORS: Generator[] = [
  additionPrimaire, soustractionPrimaire, multiplicationTablePrimaire,
  divisionTablePrimaire, pourcentageSimplePrimaire,
  puissanceCollege, fractionAdditionCollege, pourcentageCollege,
  equationLineaireCollege, developperCollege,
  equationQuadratiqueSimpleLycee, inegLycee,
  aireRectangle, perimetreRectangle, pythagoreTripletCollege,
  distancePointsLycee, aireCercleLycee,
  probSimpleLycee, probComplementaire,
  evaluerFonctionLycee, deriveeMonome, deriveePolynome,
  limitePolynomeBac, suiteArithmetiqueBacPlus, suiteGeometriqueBacPlus,
  moyenneLycee, ecartTypeLycee,
  divisibilitéCollege, suiteLogiqueCollege,
];

// ─── API publique ─────────────────────────────────────────────────────────────

/** Génère une question procédurale aléatoire */
export function generateQuestion(theme?: Theme, level?: Level): Question {
  let pool = GENERATORS;
  if (theme) pool = pool.filter(g => g.theme === theme);
  if (level) pool = pool.filter(g => g.level === level);
  if (pool.length === 0) pool = GENERATORS; // fallback

  // Sélection pondérée par weight
  const totalWeight = pool.reduce((s, g) => s + g.weight, 0);
  let r = Math.random() * totalWeight;
  let chosen = pool[0];
  for (const g of pool) { r -= g.weight; if (r <= 0) { chosen = g; break; } }

  const q = chosen.generate();
  return { ...q, id: nextId(), type: "static" as const };
}

/** Génère n questions procédurales */
export function generateQuestions(n: number, theme?: Theme, level?: Level): Question[] {
  return Array.from({ length: n }, () => generateQuestion(theme, level));
}

/** Liste les thèmes/niveaux couverts par le générateur procédural */
export function getProceduralCoverage(): { theme: Theme; level: Level }[] {
  return [...new Set(GENERATORS.map(g => `${g.theme}|${g.level}`))].map(s => {
    const [theme, level] = s.split("|");
    return { theme: theme as Theme, level: level as Level };
  });
}
