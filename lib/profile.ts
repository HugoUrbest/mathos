// Helpers de profil utilisateur (localStorage) — SANS dépendance à questions.json.
// Volontairement séparé de lib/quiz.ts pour que des pages sensibles (ex. l'examen)
// puissent les utiliser sans embarquer la banque de questions (et ses réponses)
// dans le bundle client.

import { StudyLevel, Level, SelfRating, STUDY_LEVEL_TO_QUESTION_LEVEL } from "./types";

export function getLevelForStudyLevel(studyLevel: StudyLevel): Level {
  return STUDY_LEVEL_TO_QUESTION_LEVEL[studyLevel] ?? "bac";
}

/** Charge le profil utilisateur depuis localStorage (valeurs par défaut si absent). */
export function getStoredProfile(): {
  studyLevel: StudyLevel;
  classRating: SelfRating;
  schoolRating: SelfRating;
} {
  if (typeof window === "undefined") {
    return { studyLevel: "terminale", classRating: "moyen", schoolRating: "moyen" };
  }
  return {
    studyLevel: (localStorage.getItem("mathos_pending_level") as StudyLevel) || "terminale",
    classRating: (localStorage.getItem("mathos_pending_class_rating") as SelfRating) || "moyen",
    schoolRating: (localStorage.getItem("mathos_pending_school_rating") as SelfRating) || "moyen",
  };
}
