import { PostgreSQLConfig } from "../configs/postgreSQL.config.js";
import { SessionQueries } from "../queries/session.queries.js";
import { signToken } from "../utils/jwt.util.js";
import type { CreateSessionBody, FullSessionState, Session } from "../types/game.type.js";

export class SessionService {
  private static generateCode(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  static async create(
    body: CreateSessionBody,
  ): Promise<{ id: string; code: string; host_token: string }> {
    const { host_name, total_rounds = 1 } = body;

    for (let attempt = 0; attempt < 5; attempt++) {
      const code = SessionService.generateCode();
      try {
        const { rows } = await PostgreSQLConfig.pool.query(SessionQueries.create, [
          code,
          host_name.trim(),
          total_rounds,
        ]);
        const { id } = rows[0] as { id: string; code: string };
        const host_token = signToken({ sub: id, role: "host", sessionId: id });
        return { id, code, host_token };
      } catch {
        if (attempt === 4) throw new Error("Could not create session");
      }
    }
    throw new Error("Could not create session");
  }

  static async findByCode(code: string): Promise<FullSessionState | null> {
    const { rows: sessions } = await PostgreSQLConfig.pool.query(SessionQueries.findByCode, [
      code.toUpperCase(),
    ]);
    if (!sessions.length) return null;

    const session = sessions[0] as Session;

    const [
      players,
      biases,
      questions,
      candidates,
      assignments,
      answers,
      votes,
      guesses,
      ready,
      actionCards,
      prevotes,
      achievements,
    ] = await Promise.all([
      PostgreSQLConfig.pool.query(SessionQueries.listPlayers, [session.id]),
      PostgreSQLConfig.pool.query(SessionQueries.listBiases),
      PostgreSQLConfig.pool.query(SessionQueries.listQuestions),
      PostgreSQLConfig.pool.query(SessionQueries.listCandidates),
      PostgreSQLConfig.pool.query(SessionQueries.listAssignments, [session.id]),
      PostgreSQLConfig.pool.query(SessionQueries.listAnswers, [session.id]),
      PostgreSQLConfig.pool.query(SessionQueries.listVotes, [session.id]),
      PostgreSQLConfig.pool.query(SessionQueries.listGuesses, [session.id]),
      PostgreSQLConfig.pool.query(SessionQueries.listReady, [session.id]),
      PostgreSQLConfig.pool.query(SessionQueries.listActionCards),
      PostgreSQLConfig.pool.query(SessionQueries.listPrevotes, [session.id]),
      PostgreSQLConfig.pool.query(SessionQueries.listAchievements, [session.id]),
    ]);

    return {
      session,
      players: players.rows,
      biases: biases.rows,
      questions: questions.rows,
      candidates: candidates.rows,
      assignments: assignments.rows,
      answers: answers.rows,
      votes: votes.rows,
      guesses: guesses.rows,
      ready: ready.rows,
      actionCards: actionCards.rows,
      prevotes: prevotes.rows,
      achievements: achievements.rows,
    };
  }

  static async update(
    id: string,
    updates: Record<string, unknown>,
  ): Promise<Session | null> {
    const allowed = [
      "phase",
      "status",
      "current_round",
      "current_candidate_index",
      "current_question_index",
      "phase_started_at",
      "selected_candidate_ids",
      "current_action_card_id",
      "action_card_started_at",
      "phase_duration_seconds",
      "anonymous_voting",
      "total_rounds",
    ];

    const fields = Object.keys(updates).filter((k) => allowed.includes(k));
    if (!fields.length) return null;

    const values = [...fields.map((f) => updates[f]), id];
    const { rows } = await PostgreSQLConfig.pool.query(SessionQueries.update(fields), values);
    return rows[0] ?? null;
  }
}
