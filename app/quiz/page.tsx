"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Answer, StudyLevel, SelfRating } from "@/lib/types";
import { getGrandTestQuestions, computeResult, saveResult } from "@/lib/quiz";
import QuizEngine from "@/components/QuizEngine";

export default function GrandTestPage() {
  const router = useRouter();
  const [questions] = useState(() => getGrandTestQuestions());
  const [profile, setProfile] = useState<{ sl: StudyLevel; cr: SelfRating; sr: SelfRating }>({
    sl: "terminale", cr: "moyen", sr: "moyen",
  });

  useEffect(() => {
    setProfile({
      sl: (localStorage.getItem("mathos_pending_level")         as StudyLevel) || "terminale",
      cr: (localStorage.getItem("mathos_pending_class_rating")  as SelfRating) || "moyen",
      sr: (localStorage.getItem("mathos_pending_school_rating") as SelfRating) || "moyen",
    });
  }, []);

  const handleFinish = useCallback((answers: Answer[]) => {
    const result = computeResult(answers, questions, profile.sl, profile.cr, profile.sr, "", "grand_test");
    saveResult(result);
    localStorage.setItem("mathos_last_result", JSON.stringify(result));
    router.push("/resultats");
  }, [questions, profile, router]);

  return (
    <QuizEngine
      questions={questions}
      modeLabel="🏆 Grand Test"
      totalSeconds={30 * 60}
      onFinish={handleFinish}
    />
  );
}
