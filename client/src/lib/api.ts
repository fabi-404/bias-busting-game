const BASE = "/api";

let _token: string | null = null;
export function setApiToken(token: string | null) { _token = token; }

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const authHeader: Record<string, string> = _token ? { Authorization: `Bearer ${_token}` } : {};
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...authHeader, ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ===== Sessions =====
export const api = {
  createSession: (host_name: string, total_rounds = 1) =>
    request<{ id: string; code: string; host_token: string }>("/sessions", {
      method: "POST",
      body: JSON.stringify({ host_name, total_rounds }),
    }),

  getSession: (code: string) =>
    request<import("./bias-game").FullSessionData>(`/sessions/${code}`),

  updateSession: (id: string, updates: Record<string, unknown>) =>
    request<import("./bias-game").SessionRow>(`/sessions/${id}`, {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  // ===== Players =====
  joinSession: (sessionId: string, name: string, is_host = false, avatar = "🙂") =>
    request<{ id: string; player_token: string; name: string; score: number; is_host: boolean; avatar: string }>(
      `/sessions/${sessionId}/players`,
      { method: "POST", body: JSON.stringify({ name, is_host, avatar }) },
    ),

  updatePlayerScore: (sessionId: string, playerId: string, score: number) =>
    request(`/sessions/${sessionId}/players/${playerId}`, {
      method: "PATCH",
      body: JSON.stringify({ score }),
    }),

  // ===== Game Actions =====
  assignBiases: (sessionId: string, rows: { player_id: string; bias_id: string }[]) =>
    request(`/sessions/${sessionId}/assignments`, {
      method: "POST",
      body: JSON.stringify({ rows }),
    }),

  submitAnswer: (sessionId: string, player_id: string, question_id: string, answer: boolean) =>
    request<import("./bias-game").QuestionAnswerRow & { points_awarded: number }>(
      `/sessions/${sessionId}/answers`,
      { method: "POST", body: JSON.stringify({ player_id, question_id, answer }) },
    ),

  submitVote: (sessionId: string, player_id: string, round_number: number, candidate_id: string) =>
    request(`/sessions/${sessionId}/votes`, {
      method: "POST",
      body: JSON.stringify({ player_id, round_number, candidate_id }),
    }),

  submitPrevote: (sessionId: string, player_id: string, round_number: number, candidate_id: string, rating: number) =>
    request(`/sessions/${sessionId}/prevotes`, {
      method: "POST",
      body: JSON.stringify({ player_id, round_number, candidate_id, rating }),
    }),

  submitGuesses: (
    sessionId: string,
    guesses: Array<{
      guesser_player_id: string;
      target_player_id: string;
      round_number: number;
      guessed_bias_id: string;
      is_correct: boolean;
    }>,
  ) =>
    request<{ ok: boolean; correct: number }>(`/sessions/${sessionId}/guesses`, {
      method: "POST",
      body: JSON.stringify({ guesses }),
    }),

  finalizeSession: (sessionId: string) =>
    request<import("./bias-game").AchievementRow[]>(`/sessions/${sessionId}/finalize`, {
      method: "POST",
    }),

  markReady: (sessionId: string, player_id: string, phase_key: string) =>
    request(`/sessions/${sessionId}/ready`, {
      method: "POST",
      body: JSON.stringify({ player_id, phase_key }),
    }),

  // ===== Chat =====
  getChat: (sessionId: string) =>
    request<import("./bias-game").ChatMessage[]>(`/sessions/${sessionId}/chat`),

  sendChat: (
    sessionId: string,
    player_id: string,
    player_name: string,
    phase: string,
    round_number: number,
    message: string,
  ) =>
    request(`/sessions/${sessionId}/chat`, {
      method: "POST",
      body: JSON.stringify({ player_id, player_name, phase, round_number, message }),
    }),

  // ===== Reflection =====
  getReflection: (sessionId: string, playerId: string) =>
    request<{ content: string; updated_at: string } | null>(`/sessions/${sessionId}/reflection/${playerId}`),

  saveReflection: (sessionId: string, player_id: string, content: string) =>
    request(`/sessions/${sessionId}/reflection`, {
      method: "POST",
      body: JSON.stringify({ player_id, content }),
    }),

  // ===== Admin / Cards =====
  getCards: () => request<import("./bias-game").CardRecord[]>("/cards"),

  createCard: (card: Omit<import("./bias-game").CardRecord, "id" | "created_at" | "updated_at">) =>
    request<import("./bias-game").CardRecord>("/cards", {
      method: "POST",
      body: JSON.stringify(card),
    }),

  updateCard: (id: string, card: Partial<import("./bias-game").CardRecord>) =>
    request<import("./bias-game").CardRecord>(`/cards/${id}`, {
      method: "PUT",
      body: JSON.stringify(card),
    }),

  deleteCard: (id: string) =>
    request(`/cards/${id}`, { method: "DELETE" }),
};
