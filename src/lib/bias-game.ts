// Shared types & helpers for the BIAS game.

export type GamePhase =
  | "lobby"
  | "phase1_knowledge"
  | "phase2_questions"
  | "phase3_candidates"
  | "phase4_hire_vote"
  | "phase5_bias_guess"
  | "round_results"
  | "final_results";

export interface SessionRow {
  id: string;
  code: string;
  status: "lobby" | "playing" | "ended";
  phase: GamePhase;
  current_round: number;
  current_candidate_index: number;
  current_question_index: number;
  phase_started_at: string | null;
  host_name: string;
  host_token: string;
  total_rounds: number;
}

export interface PlayerRow {
  id: string;
  name: string;
  score: number;
  is_host: boolean;
}

export interface BiasRow {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  knowledge_card_text: string;
  example: string | null;
  color: string;
}

export interface BiasQuestionRow {
  id: string;
  bias_id: string;
  question: string;
  correct_answer: boolean;
  explanation: string;
  position: number;
}

export interface CandidateRow {
  id: string;
  round_number: number;
  position: number;
  name: string;
  age: number | null;
  pronouns: string | null;
  image_url: string | null;
  headline: string;
  description: string;
  qualifications: string;
  appeals_to_bias_id: string | null;
}

export interface AssignmentRow {
  id: string;
  session_id: string;
  player_id: string;
  bias_id: string;
}

export interface QuestionAnswerRow {
  id: string;
  session_id: string;
  player_id: string;
  question_id: string;
  answer: boolean;
  is_correct: boolean;
}

export interface CandidateVoteRow {
  id: string;
  session_id: string;
  player_id: string;
  round_number: number;
  candidate_id: string;
}

export interface BiasGuessRow {
  id: string;
  session_id: string;
  guesser_player_id: string;
  target_player_id: string;
  round_number: number;
  guessed_bias_id: string;
  is_correct: boolean;
}

export const TOTAL_ROUNDS = 1;

export function phaseLabel(phase: GamePhase): string {
  switch (phase) {
    case "lobby": return "Lobby";
    case "phase1_knowledge": return "Phase 1 · Deine Bias";
    case "phase2_questions": return "Phase 2 · Wissensfragen";
    case "phase3_candidates": return "Phase 3 · Bewerber:innen";
    case "phase4_hire_vote": return "Phase 4 · Einstellung";
    case "phase5_bias_guess": return "Phase 5 · Bias raten";
    case "round_results": return "Rundenauswertung";
    case "final_results": return "Endauswertung";
  }
}
