/**
 * Programme de mathématiques par niveau et par thème
 * Basé sur les programmes français des années 1990
 * (avant les allègements successifs)
 */

import { Level, Theme } from "./types";

export interface CurriculumTopic {
  label: string;      // ex: "Fonctions affines"
  detail?: string;    // ex: "f(x) = ax + b, représentation graphique"
}

export type CurriculumMap = Partial<Record<Theme, CurriculumTopic[]>>;

export const CURRICULUM: Record<Level, CurriculumMap> = {

  // ─── PRIMAIRE (CE2 · CM1 · CM2) ────────────────────────────────────────────
  primaire: {
    calcul: [
      { label: "Quatre opérations", detail: "Addition, soustraction, multiplication, division posée" },
      { label: "Tables de multiplication", detail: "Tables de 2 à 9, produits en croix" },
      { label: "Fractions simples", detail: "½, ¼, ¾ — lecture et comparaison" },
      { label: "Nombres décimaux", detail: "Lecture, écriture, comparaison au dixième et centième" },
      { label: "Calcul mental", detail: "Doubles, moitiés, compléments à 10, 100, 1000" },
    ],
    geometrie: [
      { label: "Figures planes", detail: "Carré, rectangle, triangle, cercle — propriétés" },
      { label: "Périmètre et aire", detail: "Calcul sur des figures simples" },
      { label: "Symétrie axiale", detail: "Axe de symétrie, figures symétriques" },
      { label: "Angles droits", detail: "Reconnaissance, tracé à l'équerre" },
      { label: "Solides", detail: "Cube, pavé droit, cylindre — vocabulaire" },
    ],
    logique: [
      { label: "Suites logiques", detail: "Suites numériques et figuratives, loi de formation" },
      { label: "Classement et tri", detail: "Critères de classement, tableaux à double entrée" },
      { label: "Problèmes énoncés", detail: "Lecture, extraction des données, raisonnement" },
    ],
    statistiques: [
      { label: "Lecture de graphiques", detail: "Diagrammes en barres, camemberts simples" },
      { label: "Tableaux de données", detail: "Lecture et complétion de tableaux" },
    ],
  },

  // ─── COLLÈGE (6ème → 3ème) ──────────────────────────────────────────────────
  college: {
    calcul: [
      { label: "Fractions", detail: "Simplification, addition, soustraction, multiplication, division" },
      { label: "Nombres relatifs", detail: "Opposé, valeur absolue, opérations sur Z" },
      { label: "Puissances entières", detail: "Notation an, règles de calcul, puissances de 10" },
      { label: "Racine carrée", detail: "Définition, calcul approché, simplification √a×b" },
      { label: "Pourcentages", detail: "Taux, augmentation, réduction, valeur initiale" },
      { label: "PGCD et PPCM", detail: "Algorithme d'Euclide, décomposition en facteurs premiers" },
    ],
    algebre: [
      { label: "Expressions littérales", detail: "Substitution, développement, factorisation" },
      { label: "Équations du 1er degré", detail: "ax + b = c, résolution par équivalences" },
      { label: "Inéquations", detail: "ax + b < c, représentation sur la droite réelle" },
      { label: "Systèmes 2×2", detail: "Substitution, combinaison linéaire, problèmes" },
      { label: "Identités remarquables", detail: "(a+b)², (a−b)², (a+b)(a−b)" },
    ],
    geometrie: [
      { label: "Théorème de Pythagore", detail: "Démonstration, réciproque, calculs dans le triangle rectangle" },
      { label: "Théorème de Thalès", detail: "Droites parallèles, rapports de longueurs" },
      { label: "Triangles", detail: "Cas d'égalité (LLL, LAL, ALA), construction" },
      { label: "Cercle", detail: "Tangente, angle inscrit, angle au centre" },
      { label: "Transformations", detail: "Translation, rotation, homothétie, symétries" },
      { label: "Trigonométrie (3ème)", detail: "cos, sin, tan dans le triangle rectangle" },
    ],
    probabilites: [
      { label: "Dénombrement", detail: "Principe multiplicatif, arrangements, combinaisons" },
      { label: "Probabilité classique", detail: "Événements équiprobables, P(A) = cas favorables / total" },
      { label: "Fréquences", detail: "Fréquence relative, fréquence cumulée" },
    ],
    statistiques: [
      { label: "Moyenne", detail: "Calcul, propriétés, moyenne pondérée" },
      { label: "Médiane et quartiles", detail: "Définition, calcul sur série ordonnée" },
      { label: "Diagrammes", detail: "Histogramme, diagramme en bâtons, courbe des effectifs" },
    ],
    logique: [
      { label: "Raisonnement par l'absurde", detail: "Hypothèse fausse menant à contradiction" },
      { label: "Implication et équivalence", detail: "⇒, ⇔, contraposée" },
      { label: "Suites numériques", detail: "Loi de récurrence, terme général" },
    ],
  },

  // ─── LYCÉE (Seconde · Première) ─────────────────────────────────────────────
  lycee: {
    calcul: [
      { label: "Calcul algébrique avancé", detail: "Factorisations, fractions rationnelles, mise au même dénominateur" },
      { label: "Valeur absolue", detail: "Définition, inégalités avec valeur absolue, distance" },
      { label: "Intervalles et inégalités", detail: "Tableau de signes, résolution d'inéquations produit/quotient" },
      { label: "Puissances et racines", detail: "Exposants rationnels, règles de calcul, simplification" },
      { label: "Logarithme décimal (1ère)", detail: "log(ab), log(a/b), log(aⁿ), équations logarithmiques" },
    ],
    algebre: [
      { label: "Polynômes du 2nd degré", detail: "Forme développée, factorisée, canonique" },
      { label: "Discriminant", detail: "Δ = b²−4ac, nature des racines, formule" },
      { label: "Équations du 2nd degré", detail: "Résolution complète, relation coefficient-racines" },
      { label: "Inéquations du 2nd degré", detail: "Signe du trinôme selon Δ, tableau de signe" },
      { label: "Systèmes et matrices (1ère)", detail: "Élimination, substitution, écriture matricielle 2×2" },
    ],
    fonctions: [
      { label: "Fonctions affines", detail: "f(x) = ax + b, pente, ordonnée à l'origine, représentation" },
      { label: "Fonctions du 2nd degré", detail: "Parabole, sommet, axe de symétrie, variations" },
      { label: "Fonctions racine et inverse", detail: "√x et 1/x : domaine, variations, représentation" },
      { label: "Dérivée — définition (1ère)", detail: "Taux de variation, tangente, nombre dérivé" },
      { label: "Règles de dérivation (1ère)", detail: "(u+v)', (uv)', (u/v)', formules usuelles" },
      { label: "Variations via la dérivée", detail: "Signe de f' ⇒ sens de variation, extrema" },
    ],
    geometrie: [
      { label: "Vecteurs", detail: "Coordonnées, norme, addition, produit scalaire" },
      { label: "Géométrie analytique", detail: "Droite (y = ax + b, ax + by + c = 0), distance point-droite" },
      { label: "Trigonométrie étendue", detail: "Cercle trigonométrique, radian, cos/sin sur [0 ; 2π]" },
      { label: "Formules trigonométriques", detail: "cos(a+b), sin(a+b), cos²+sin²=1" },
      { label: "Géométrie du plan (1ère)", detail: "Droites parallèles, perpendiculaires, médiatrice, bissectrice" },
    ],
    probabilites: [
      { label: "Probabilités conditionnelles", detail: "P(A|B) = P(A∩B)/P(B), formule des probabilités totales" },
      { label: "Indépendance", detail: "P(A∩B) = P(A)×P(B), vérification" },
      { label: "Variables aléatoires discrètes", detail: "Loi de probabilité, espérance, variance" },
      { label: "Loi binomiale (1ère)", detail: "B(n,p), formule, espérance np, applications" },
    ],
    statistiques: [
      { label: "Statistiques descriptives", detail: "Série statistique, effectifs, fréquences, regroupement en classes" },
      { label: "Variance et écart-type", detail: "Définitions, calcul, interprétation" },
      { label: "Représentations graphiques", detail: "Histogramme, boîte à moustaches, nuage de points" },
    ],
    enigme: [
      { label: "Problèmes d'optimisation", detail: "Trouver le maximum/minimum d'une grandeur sous contrainte" },
      { label: "Raisonnement par récurrence", detail: "Initialisation, hérédité, conclusion" },
      { label: "Dénombrement avancé", detail: "Arrangements, combinaisons, triangle de Pascal" },
    ],
  },

  // ─── BAC (Terminale) ────────────────────────────────────────────────────────
  bac: {
    calcul: [
      { label: "Suites arithmétiques", detail: "Terme général, somme des n premiers termes, convergence" },
      { label: "Suites géométriques", detail: "Terme général, somme géométrique, limites" },
      { label: "Limites de fonctions", detail: "Limites en ±∞ et en un point, formes indéterminées" },
      { label: "Continuité et TVI", detail: "Théorème des valeurs intermédiaires, méthode de dichotomie" },
    ],
    algebre: [
      { label: "Nombres complexes", detail: "Forme algébrique a+ib, module, argument, conjugué" },
      { label: "Calcul dans C", detail: "Opérations, équations dans C, racines complexes" },
      { label: "Forme trigonométrique", detail: "r(cos θ + i sin θ), multiplication, formule de Moivre" },
      { label: "Forme exponentielle", detail: "re^{iθ}, formules d'Euler, racines n-ièmes" },
    ],
    fonctions: [
      { label: "Fonction exponentielle", detail: "e^x, propriétés, dérivée, limites, équations" },
      { label: "Logarithme népérien", detail: "ln x, propriétés, dérivée, équations, inéquations" },
      { label: "Primitives et intégrales", detail: "Primitives usuelles, intégrale de Riemann, relation fondamentale" },
      { label: "Calcul d'aire et intégration", detail: "Aire entre courbes, valeur moyenne, intégration par parties" },
      { label: "Étude complète de fonction", detail: "Domaine, limites, dérivée, variations, tableau, asymptotes" },
    ],
    geometrie: [
      { label: "Géométrie dans l'espace", detail: "Droites et plans, positions relatives, intersection" },
      { label: "Produit scalaire 3D", detail: "Coordonnées dans l'espace, norme, orthogonalité" },
      { label: "Vecteur normal à un plan", detail: "Équation cartésienne d'un plan, distance point-plan" },
      { label: "Sphère et solides", detail: "Équation de sphère, sections planes, volumes" },
    ],
    probabilites: [
      { label: "Loi normale", detail: "Densité, courbe de Gauss, P(a ≤ X ≤ b), loi N(0,1)" },
      { label: "Intervalle de confiance", detail: "Estimation d'une proportion, niveau de confiance 95%" },
      { label: "Loi des grands nombres", detail: "Convergence en probabilité, applications" },
      { label: "Variables continues", detail: "Densité de probabilité, espérance, variance" },
    ],
    statistiques: [
      { label: "Échantillonnage", detail: "Fluctuation d'échantillonnage, intervalle de fluctuation" },
      { label: "Tests d'hypothèses", detail: "Hypothèse nulle, seuil de signification, décision" },
      { label: "Régression linéaire", detail: "Droite des moindres carrés, coefficient de corrélation" },
    ],
    logique: [
      { label: "Raisonnement par récurrence", detail: "Initialisation, hérédité, conclusion rigoureuse" },
      { label: "Quantificateurs", detail: "∀, ∃, négation, implication, équivalence logique" },
      { label: "Démonstration directe et contraposée", detail: "Méthodes de preuve, contre-exemples" },
    ],
    enigme: [
      { label: "Problèmes d'optimisation", detail: "Extrema sous contraintes, modélisation" },
      { label: "Suites récurrentes", detail: "u_{n+1} = f(u_n), points fixes, monotonie" },
      { label: "Dénombrement et combinatoire", detail: "Combinaisons, arrangements, probabilités associées" },
    ],
  },

  // ─── BAC+ (Bac+1 à Bac+2) ───────────────────────────────────────────────────
  bac_plus: {
    calcul: [
      { label: "Développements limités", detail: "DL en 0 et en a, opérations, applications (limites, équivalents)" },
      { label: "Séries numériques", detail: "Convergence, séries géométriques, critères de d'Alembert et Riemann" },
      { label: "Calcul matriciel", detail: "Opérations, transposée, déterminant, matrice inverse" },
      { label: "Fractions rationnelles", detail: "Décomposition en éléments simples, intégration" },
    ],
    algebre: [
      { label: "Espaces vectoriels", detail: "Sous-espaces, base, dimension, famille libre/génératrice" },
      { label: "Applications linéaires", detail: "Noyau, image, rang, théorème du rang" },
      { label: "Valeurs propres et vecteurs propres", detail: "Polynôme caractéristique, diagonalisation" },
      { label: "Systèmes linéaires", detail: "Méthode du pivot de Gauss, discussion selon les paramètres" },
      { label: "Déterminants", detail: "Développement par rapport à une ligne/colonne, calcul" },
    ],
    fonctions: [
      { label: "Intégrales généralisées", detail: "Convergence, intégrales de Gauss et Bertrand, comparaisons" },
      { label: "Équations différentielles", detail: "Ordre 1 (y' + ay = f), ordre 2 à coefficients constants" },
      { label: "Fonctions de 2 variables", detail: "Dérivées partielles, gradient, extrema, plan tangent" },
      { label: "Séries de Taylor", detail: "Formule de Taylor-Lagrange, reste, rayon de convergence" },
    ],
    geometrie: [
      { label: "Espaces euclidiens", detail: "Produit scalaire, norme, orthogonalité, procédé de Gram-Schmidt" },
      { label: "Courbes paramétrées", detail: "Tangente, point singulier, arc, longueur" },
      { label: "Géométrie affine", detail: "Barycentres, transformations affines, convexité" },
    ],
    probabilites: [
      { label: "Variables aléatoires à densité", detail: "Loi uniforme, exponentielle, normale — calculs" },
      { label: "Couples de variables aléatoires", detail: "Loi jointe, loi marginale, covariance, corrélation" },
      { label: "Théorème central limite", detail: "Convergence en loi, applications à l'approximation" },
      { label: "Lois usuelles", detail: "Binomiale, Poisson, normale, khi-deux — usages courants" },
    ],
    statistiques: [
      { label: "Estimation ponctuelle", detail: "Estimateurs, biais, efficacité, méthode des moments" },
      { label: "Tests paramétriques", detail: "Test de Student, test du khi-deux, ANOVA" },
      { label: "Régression multiple", detail: "Modèle linéaire général, moindres carrés ordinaires" },
      { label: "Analyse en composantes principales", detail: "Inertie, axes factoriels, représentation" },
    ],
    enigme: [
      { label: "Problèmes de combinatoire avancée", detail: "Principe des tiroirs, inclusion-exclusion, générations" },
      { label: "Suites et séries de fonctions", detail: "Convergence simple/uniforme, interversion limite-intégrale" },
      { label: "Optimisation sous contraintes", detail: "Multiplicateurs de Lagrange, conditions KKT" },
    ],
  },
};

/**
 * Retourne les thèmes couverts à un niveau donné, avec le nombre de questions disponibles
 */
export function getCurriculumForLevel(level: Level): CurriculumMap {
  return CURRICULUM[level] ?? {};
}
