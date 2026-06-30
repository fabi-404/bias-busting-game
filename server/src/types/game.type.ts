export type CardType = "knowledge" | "truefalse" | "action";
export type SessionStatus = "lobby" | "playing" | "ended";
export type GamePhase =
  | "lobby"
  | "phase1_knowledge"
  | "phase2_questions"
  | "phase3_candidates"
  | "phase4_hire_vote"
  | "phase5_bias_guess"
  | "round_results"
  | "final_results";

export interface Session {
  id: string;
  code: string;
  host_name: string;
  status: SessionStatus;
  phase: GamePhase;
  current_round: number;
  current_candidate_index: number;
  current_question_index: number;
  phase_started_at: string | null;
  total_rounds: number;
  current_action_card_id: string | null;
  action_card_started_at: string | null;
  selected_candidate_ids: string[];
  phase_duration_seconds: number;
  anonymous_voting: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlayerPublic {
  id: string;
  name: string;
  score: number;
  is_host: boolean;
  avatar: string;
}

export interface Card {
  id: string;
  type: CardType;
  title: string;
  content: string;
  example: string | null;
  correct_answer: boolean | null;
  explanation: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
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

export interface Achievement {
  id: string;
  session_id: string;
  player_id: string;
  achievement_key: string;
  bonus_points: number;
  created_at: string;
}

export interface FullSessionState {
  session: Session;
  players: PlayerPublic[];
  biases: Record<string, unknown>[];
  questions: Record<string, unknown>[];
  candidates: Record<string, unknown>[];
  assignments: Record<string, unknown>[];
  answers: Record<string, unknown>[];
  votes: Record<string, unknown>[];
  guesses: Record<string, unknown>[];
  ready: Record<string, unknown>[];
  actionCards: Record<string, unknown>[];
  prevotes: Record<string, unknown>[];
  achievements: Achievement[];
}

// Request body types
export interface CreateSessionBody {
  host_name: string;
  total_rounds?: number;
}

export interface JoinPlayerBody {
  name: string;
  is_host?: boolean;
  avatar?: string;
}

export interface PostChatBody {
  player_id: string;
  player_name: string;
  phase: string;
  round_number: number;
  message: string;
}

export interface PostAnswerBody {
  player_id: string;
  question_id: string;
  answer: boolean;
}

export interface PostVoteBody {
  player_id: string;
  round_number: number;
  candidate_id: string;
}

export interface PostPrevoteBody {
  player_id: string;
  round_number: number;
  candidate_id: string;
  rating: number;
}

export interface PostGuessBody {
  guesses: Array<{
    guesser_player_id: string;
    target_player_id: string;
    round_number: number;
    guessed_bias_id: string;
    is_correct: boolean;
  }>;
}

export interface PostAssignmentsBody {
  rows: Array<{ player_id: string; bias_id: string }>;
}

export interface PostReadyBody {
  player_id: string;
  phase_key: string;
}

export interface PostReflectionBody {
  player_id: string;
  content: string;
}

export interface CardBody {
  type: string;
  title: string;
  content: string;
  example?: string;
  explanation?: string;
  category?: string;
  correct_answer?: boolean | null;
}
