export type UserRole = "candidate" | "recruiter" | "admin";

export interface UserProfile {
  id: string;
  email: string;
  first_name: string;
  role: UserRole;
  study_level: string | null;
  class_rating: string | null;
  school_rating: string | null;
  created_at: string;
}

export interface Token {
  id: string;
  code: string;
  generated_by: string;
  used_by: string | null;
  supervised: boolean;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface OfficialResult {
  id: string;
  user_id: string;
  token_id: string;
  candidate_name: string;
  candidate_email: string;
  score: number;
  max_score: number;
  theme_scores: Record<string, { correct: number; total: number; score: number }>;
  questions_count: number;
  duration_seconds: number | null;
  study_level: string | null;
  supervised: boolean;
  hash: string;
  pdf_url: string | null;
  started_at: string | null;
  completed_at: string;
}

export interface RecruiterInvitation {
  id: string;
  email: string;
  invited_by: string;
  invite_code: string;
  accepted_at: string | null;
  created_at: string;
}
