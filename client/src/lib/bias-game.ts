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
  current_action_card_id: string | null;
  action_card_started_at: string | null;
  selected_candidate_ids: string[] | null;
  phase_duration_seconds: number;
  anonymous_voting: boolean;
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
  self_recognition: string | null;
  source_label: string | null;
  source_url: string | null;
}

export interface ActionCardRow {
  id: string;
  title: string;
  content: string;
  explanation: string | null;
  category: string | null;
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

export interface CandidatePrevoteRow {
  id: string;
  session_id: string;
  player_id: string;
  round_number: number;
  candidate_id: string;
  rating: number;
}

export interface ReadyRow {
  player_id: string;
  phase_key: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  player_id: string;
  player_name: string;
  phase: string;
  round_number: number;
  message: string;
  created_at: string;
}

export interface CardRecord {
  id: string;
  type: "knowledge" | "truefalse" | "action";
  title: string;
  content: string;
  example?: string | null;
  explanation?: string | null;
  category?: string | null;
  correct_answer?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

export type CardType = "knowledge" | "truefalse" | "action";

export interface FullSessionData {
  session: SessionRow;
  players: PlayerRow[];
  biases: BiasRow[];
  questions: BiasQuestionRow[];
  candidates: CandidateRow[];
  assignments: AssignmentRow[];
  answers: QuestionAnswerRow[];
  votes: CandidateVoteRow[];
  guesses: BiasGuessRow[];
  ready: ReadyRow[];
  actionCards: ActionCardRow[];
  prevotes: CandidatePrevoteRow[];
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
