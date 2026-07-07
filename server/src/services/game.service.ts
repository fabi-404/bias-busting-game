import { PostgreSQLConfig } from "../configs/postgreSQL.config.js";
import { GameQueries } from "../queries/game.queries.js";
import type {
  Achievement,
  PlayerPublic,
  PostAnswerBody,
  PostAssignmentsBody,
  PostGuessBody,
  PostPrevoteBody,
  PostReadyBody,
  PostReflectionBody,
  PostVoteBody,
} from "../types/game.type.js";

const SPEED_BONUS_WINDOW_MS = 15_000;
const QUESTIONS_PER_PLAYER = 3;

export class GameService {
  static async assign(
    sessionId: string,
    body: PostAssignmentsBody,
  ): Promise<Record<string, unknown>[]> {
    const { rows: bias_assignments } = body;

    await PostgreSQLConfig.pool.query(GameQueries.deleteAssignments, [sessionId]);
    for (const row of bias_assignments) {
      await PostgreSQLConfig.pool.query(GameQueries.addAssignment, [
        sessionId,
        row.player_id,
        row.bias_id,
      ]);
    }

    const { rows } = await PostgreSQLConfig.pool.query(GameQueries.listAssignments, [sessionId]);
    return rows;
  }

  static async answer(
    sessionId: string,
    body: PostAnswerBody,
  ): Promise<{ answer_row: Record<string, unknown>; points_awarded: number; players: PlayerPublic[] }> {
    const { player_id, question_id, answer } = body;

    const { rows: questions } = await PostgreSQLConfig.pool.query(GameQueries.findQuestion, [
      question_id,
    ]);
    if (!questions.length) throw Object.assign(new Error("Question not found"), { status: 404 });

    const is_correct = questions[0].correct_answer === answer;

    const { rows: sessions } = await PostgreSQLConfig.pool.query(
      GameQueries.findSessionPhaseStart,
      [sessionId],
    );
    const startedAt = sessions[0]?.phase_started_at
      ? new Date(sessions[0].phase_started_at).getTime()
      : null;
    const isFast = startedAt !== null && Date.now() - startedAt <= SPEED_BONUS_WINDOW_MS;
    const points_awarded = is_correct ? (isFast ? 2 : 1) : 0;

    const { rows } = await PostgreSQLConfig.pool.query(GameQueries.upsertAnswer, [
      sessionId,
      player_id,
      question_id,
      answer,
      is_correct,
    ]);

    let players: PlayerPublic[] = [];
    if (points_awarded > 0) {
      await PostgreSQLConfig.pool.query(GameQueries.addScore, [points_awarded, player_id]);
      const updated = await PostgreSQLConfig.pool.query(GameQueries.listPlayersPublic, [sessionId]);
      players = updated.rows;
    }

    return { answer_row: { ...rows[0], points_awarded }, points_awarded, players };
  }

  static async listAnswers(sessionId: string): Promise<Record<string, unknown>[]> {
    const { rows } = await PostgreSQLConfig.pool.query(GameQueries.listAnswers, [sessionId]);
    return rows;
  }

  static async vote(
    sessionId: string,
    body: PostVoteBody,
  ): Promise<Record<string, unknown>[]> {
    const { player_id, round_number, candidate_id } = body;

    await PostgreSQLConfig.pool.query(GameQueries.upsertVote, [
      sessionId,
      player_id,
      round_number,
      candidate_id,
    ]);

    const { rows } = await PostgreSQLConfig.pool.query(GameQueries.listVotes, [sessionId]);
    return rows;
  }

  static async resolveRound(
    sessionId: string,
    roundNumber: number,
  ): Promise<{ correct_candidate_id: string | null; players: PlayerPublic[] }> {
    const { rows: correctRows } = await PostgreSQLConfig.pool.query(GameQueries.findCorrectCandidate, [
      roundNumber,
    ]);
    const correctCandidateId: string | null = correctRows[0]?.id ?? null;

    if (!correctCandidateId) {
      const players = await PostgreSQLConfig.pool.query(GameQueries.listPlayersPublic, [sessionId]);
      return { correct_candidate_id: null, players: players.rows };
    }

    const { rows: roundVotes } = await PostgreSQLConfig.pool.query(GameQueries.listVotesForRound, [
      sessionId,
      roundNumber,
    ]);
    const correctVoters = roundVotes.filter((v) => v.candidate_id === correctCandidateId);

    for (const v of correctVoters) {
      const { rows: inserted } = await PostgreSQLConfig.pool.query(GameQueries.addRoundHireBonus, [
        sessionId,
        v.player_id,
        roundNumber,
        2,
      ]);
      if (inserted.length) {
        await PostgreSQLConfig.pool.query(GameQueries.addScore, [2, v.player_id]);
      }
    }

    const { rows: players } = await PostgreSQLConfig.pool.query(GameQueries.listPlayersPublic, [
      sessionId,
    ]);
    return { correct_candidate_id: correctCandidateId, players };
  }

  static async prevote(
    sessionId: string,
    body: PostPrevoteBody,
  ): Promise<Record<string, unknown>[]> {
    const { player_id, round_number, candidate_id, rating } = body;

    await PostgreSQLConfig.pool.query(GameQueries.upsertPrevote, [
      sessionId,
      player_id,
      round_number,
      candidate_id,
      rating,
    ]);

    const { rows } = await PostgreSQLConfig.pool.query(GameQueries.listPrevotes, [sessionId]);
    return rows;
  }

  static async guess(
    sessionId: string,
    body: PostGuessBody,
  ): Promise<{ guesses: Record<string, unknown>[]; correct: number; players: PlayerPublic[] }> {
    const { guesses } = body;

    let correctCount = 0;
    for (const g of guesses) {
      if (g.is_correct) correctCount++;
      await PostgreSQLConfig.pool.query(GameQueries.upsertGuess, [
        sessionId,
        g.guesser_player_id,
        g.target_player_id,
        g.round_number,
        g.guessed_bias_id,
        g.is_correct,
      ]);
    }

    let players: PlayerPublic[] = [];
    if (correctCount > 0) {
      const { rows: playerRows } = await PostgreSQLConfig.pool.query(GameQueries.findPlayerScore, [
        guesses[0].guesser_player_id,
      ]);
      if (playerRows.length) {
        await PostgreSQLConfig.pool.query(GameQueries.setScore, [
          playerRows[0].score + correctCount,
          guesses[0].guesser_player_id,
        ]);
        const updated = await PostgreSQLConfig.pool.query(GameQueries.listPlayersPublic, [
          sessionId,
        ]);
        players = updated.rows;
      }
    }

    const { rows } = await PostgreSQLConfig.pool.query(GameQueries.listGuesses, [sessionId]);
    return { guesses: rows, correct: correctCount, players };
  }

  static async ready(
    sessionId: string,
    body: PostReadyBody,
  ): Promise<Record<string, unknown>[]> {
    const { player_id, phase_key } = body;

    await PostgreSQLConfig.pool.query(GameQueries.addReady, [sessionId, player_id, phase_key]);

    const { rows } = await PostgreSQLConfig.pool.query(GameQueries.listReady, [sessionId]);
    return rows;
  }

  static async saveReflection(
    sessionId: string,
    body: PostReflectionBody,
  ): Promise<Record<string, unknown>> {
    const { player_id, content } = body;

    const { rows } = await PostgreSQLConfig.pool.query(GameQueries.upsertReflection, [
      sessionId,
      player_id,
      content ?? "",
    ]);
    return rows[0];
  }

  static async getReflection(
    sessionId: string,
    playerId: string,
  ): Promise<Record<string, unknown> | null> {
    const { rows } = await PostgreSQLConfig.pool.query(GameQueries.findReflection, [
      sessionId,
      playerId,
    ]);
    return rows[0] ?? null;
  }

  static async finalize(
    sessionId: string,
  ): Promise<{ achievements: Achievement[]; players: PlayerPublic[] }> {
    const existing = await PostgreSQLConfig.pool.query(GameQueries.listAchievements, [sessionId]);
    if (existing.rows.length > 0) {
      const players = await PostgreSQLConfig.pool.query(GameQueries.listPlayersPublic, [sessionId]);
      return { achievements: existing.rows, players: players.rows };
    }

    const [playersQ, answersQ, guessesQ, votesQ, chatQ] = await Promise.all([
      PostgreSQLConfig.pool.query(GameQueries.listPlayersForFinalize, [sessionId]),
      PostgreSQLConfig.pool.query(GameQueries.listAnswersForFinalize, [sessionId]),
      PostgreSQLConfig.pool.query(GameQueries.listGuessesForFinalize, [sessionId]),
      PostgreSQLConfig.pool.query(GameQueries.listVotesForFinalize, [sessionId]),
      PostgreSQLConfig.pool.query(GameQueries.chatCountByPlayer, [sessionId]),
    ]);

    const players = playersQ.rows as { id: string }[];
    const awards: { player_id: string; key: string; bonus: number }[] = [];

    for (const p of players) {
      const myAnswers = answersQ.rows.filter((a) => a.player_id === p.id);
      if (myAnswers.length >= QUESTIONS_PER_PLAYER && myAnswers.every((a) => a.is_correct)) {
        awards.push({ player_id: p.id, key: "quiz_master", bonus: 1 });
      }

      const myGuesses = guessesQ.rows.filter((g) => g.guesser_player_id === p.id);
      if (
        players.length > 1 &&
        myGuesses.length >= players.length - 1 &&
        myGuesses.every((g) => g.is_correct)
      ) {
        awards.push({ player_id: p.id, key: "bias_detective", bonus: 1 });
      }

      const guessesAboutMe = guessesQ.rows.filter((g) => g.target_player_id === p.id);
      if (guessesAboutMe.length > 0 && guessesAboutMe.every((g) => !g.is_correct)) {
        awards.push({ player_id: p.id, key: "undercover", bonus: 2 });
      }
    }

    // Teamgespür: eigene Stimme entsprach der eingestellten Person (letzte Runde)
    const lastRound = votesQ.rows.reduce((m: number, v: { round_number: number }) => Math.max(m, v.round_number), 0);
    const lastVotes = votesQ.rows.filter((v: { round_number: number }) => v.round_number === lastRound);
    const tally = new Map<string, number>();
    for (const v of lastVotes) tally.set(v.candidate_id, (tally.get(v.candidate_id) ?? 0) + 1);
    const sorted = [...tally.entries()].sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && (sorted.length === 1 || sorted[0][1] > sorted[1][1])) {
      for (const v of lastVotes.filter((v: { candidate_id: string }) => v.candidate_id === sorted[0][0])) {
        awards.push({ player_id: v.player_id, key: "team_compass", bonus: 0 });
      }
    }

    // Diskussionsfreudig: meiste Chat-Beiträge (mindestens 3)
    const maxChat = chatQ.rows.reduce((m: number, r: { cnt: number }) => Math.max(m, r.cnt), 0);
    if (maxChat >= 3) {
      for (const r of chatQ.rows.filter((r: { cnt: number }) => r.cnt === maxChat)) {
        awards.push({ player_id: r.player_id, key: "chat_champion", bonus: 0 });
      }
    }

    for (const a of awards) {
      await PostgreSQLConfig.pool.query(GameQueries.addAchievement, [
        sessionId,
        a.player_id,
        a.key,
        a.bonus,
      ]);
      if (a.bonus > 0) {
        await PostgreSQLConfig.pool.query(GameQueries.addBonus, [a.bonus, a.player_id]);
      }
    }

    const { rows: achievements } = await PostgreSQLConfig.pool.query(GameQueries.listAchievements, [
      sessionId,
    ]);
    const updatedPlayers = await PostgreSQLConfig.pool.query(GameQueries.listPlayersPublic, [
      sessionId,
    ]);

    return { achievements, players: updatedPlayers.rows };
  }
}
