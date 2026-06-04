export type Theme = "calcul" | "algebre" | "geometrie" | "logique" | "probabilites" | "fonctions" | "statistiques";
export type Level = "college" | "lycee" | "bac" | "bac_plus";

export interface Question {
  id: number;
  theme: Theme;
  level: Level;
  question: string;
  choices: string[];
  answer: number; // index de la bonne réponse
  explanation: string;
}

export interface Answer {
  questionId: number;
  selectedIndex: number | null; // null = pas répondu
}

export interface QuizResult {
  answers: Answer[];
  questions: Question[];
  score: number;
  maxScore: number;
  themeScores: Record<Theme, { correct: number; total: number; score: number }>;
  completedAt: Date;
  studyLevel: StudyLevel;
  userName: string;
}

export type StudyLevel =
  | "6eme" | "5eme" | "4eme" | "3eme"
  | "seconde" | "premiere" | "terminale"
  | "bac1" | "bac2" | "bac3" | "bac4" | "bac5"
  | "bac6plus";

export const STUDY_LEVEL_LABELS: Record<StudyLevel, string> = {
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

export const THEME_LABELS: Record<Theme, string> = {
  calcul: "Calcul",
  algebre: "Algèbre",
  geometrie: "Géométrie",
  logique: "Logique",
  probabilites: "Probabilités",
  fonctions: "Fonctions",
  statistiques: "Statistiques",
};

export const THEME_COLORS: Record<Theme, string> = {
  calcul: "#6366f1",
  algebre: "#8b5cf6",
  geometrie: "#06b6d4",
  logique: "#f59e0b",
  probabilites: "#10b981",
  fonctions: "#ef4444",
  statistiques: "#f97316",
};
