export type Theme = "calcul" | "algebre" | "geometrie" | "logique" | "probabilites" | "fonctions" | "statistiques" | "enigme";
export type Level = "primaire" | "college" | "lycee" | "bac" | "bac_plus";

export interface Question {
  id: number;
  type?: string;
  theme: Theme;
  level: Level;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
}

export interface Answer {
  questionId: number;
  selectedIndex: number | null;
}

export type SelfRating = "bon" | "moyen" | "faible";

export const SELF_RATING_LABELS: Record<SelfRating, string> = {
  bon: "Bon",
  moyen: "Moyen",
  faible: "Faible",
};

export interface UserProfile {
  studyLevel: StudyLevel;
  classRating: SelfRating;
  schoolRating: SelfRating;
}

// Mode de quiz
export type QuizMode = "grand_test" | "entrainement" | "examen_certifiant";

export interface QuizResult {
  mode: QuizMode;
  answers: Answer[];
  questions: Question[];
  score: number;
  maxScore: number;
  themeScores: Record<string, { correct: number; total: number; score: number }>;
  completedAt: string; // ISO string pour sérialisation JSON
  studyLevel: StudyLevel;
  classRating: SelfRating;
  schoolRating: SelfRating;
  userName: string;
  // Pour l'entraînement : thème ciblé et niveau de difficulté utilisé
  trainingTheme?: Theme;
  trainingLevel?: Level;
}

export type StudyLevel =
  | "ce2" | "cm1" | "cm2"
  | "6eme" | "5eme" | "4eme" | "3eme"
  | "seconde" | "premiere" | "terminale"
  | "bac1" | "bac2" | "bac3" | "bac4" | "bac5"
  | "bac6plus";

export const STUDY_LEVEL_LABELS: Record<StudyLevel, string> = {
  "ce2": "CE2",
  "cm1": "CM1",
  "cm2": "CM2",
  "6eme": "6ème",
  "5eme": "5ème",
  "4eme": "4ème",
  "3eme": "3ème",
  "seconde": "Seconde",
  "premiere": "Première",
  "terminale": "Terminale",
  "bac1": "Bac+1",
  "bac2": "Bac+2",
  "bac3": "Bac+3",
  "bac4": "Bac+4",
  "bac5": "Bac+5",
  "bac6plus": "Bac+6 et plus",
};

// Mapping niveau scolaire → niveau de difficulté des questions
export const STUDY_LEVEL_TO_QUESTION_LEVEL: Record<StudyLevel, Level> = {
  "ce2": "primaire",
  "cm1": "primaire",
  "cm2": "primaire",
  "6eme": "college",
  "5eme": "college",
  "4eme": "college",
  "3eme": "college",
  "seconde": "lycee",
  "premiere": "lycee",
  "terminale": "bac",
  "bac1": "bac",
  "bac2": "bac_plus",
  "bac3": "bac_plus",
  "bac4": "bac_plus",
  "bac5": "bac_plus",
  "bac6plus": "bac_plus",
};

export const THEME_LABELS: Record<Theme, string> = {
  calcul: "Calcul",
  algebre: "Algèbre",
  geometrie: "Géométrie",
  logique: "Logique",
  probabilites: "Probabilités",
  fonctions: "Fonctions",
  statistiques: "Statistiques",
  enigme: "Énigme",
};

export const THEME_COLORS: Record<Theme, string> = {
  calcul: "#6366f1",
  algebre: "#8b5cf6",
  geometrie: "#06b6d4",
  logique: "#f59e0b",
  probabilites: "#10b981",
  fonctions: "#ef4444",
  statistiques: "#f97316",
  enigme: "#ec4899",
};

export const THEME_EMOJIS: Record<Theme, string> = {
  calcul: "🔢",
  algebre: "📐",
  geometrie: "📏",
  logique: "🧠",
  probabilites: "🎲",
  fonctions: "📈",
  statistiques: "📊",
  enigme: "🔮",
};
