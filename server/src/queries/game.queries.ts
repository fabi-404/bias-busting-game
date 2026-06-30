export class GameQueries {
  public static readonly deleteAssignments = `
    DELETE FROM player_bias_assignments WHERE session_id = $1
  `;

  public static readonly addAssignment = `
    INSERT INTO player_bias_assignments (session_id, player_id, bias_id)
    VALUES ($1, $2, $3)
    ON CONFLICT DO NOTHING
  `;

  public static readonly listAssignments = `
    SELECT * FROM player_bias_assignments WHERE session_id = $1
  `;

  public static readonly findQuestion = `
    SELECT correct_answer FROM bias_questions WHERE id = $1
  `;

  public static readonly findSessionPhaseStart = `
    SELECT phase_started_at FROM game_sessions WHERE id = $1
  `;

  public static readonly upsertAnswer = `
    INSERT INTO bias_question_answers (session_id, player_id, question_id, answer, is_correct)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (session_id, player_id, question_id) DO UPDATE
      SET answer = EXCLUDED.answer, is_correct = EXCLUDED.is_correct
    RETURNING *
  `;

  public static readonly addScore = `
    UPDATE session_players SET score = score + $1 WHERE id = $2
  `;

  public static readonly listAnswers = `
    SELECT * FROM bias_question_answers WHERE session_id = $1
  `;

  public static readonly upsertVote = `
    INSERT INTO candidate_votes (session_id, player_id, round_number, candidate_id)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (session_id, player_id, round_number) DO UPDATE SET candidate_id = EXCLUDED.candidate_id
  `;

  public static readonly listVotes = `
    SELECT * FROM candidate_votes WHERE session_id = $1
  `;

  public static readonly upsertPrevote = `
    INSERT INTO candidate_prevotes (session_id, player_id, round_number, candidate_id, rating)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (session_id, player_id, candidate_id) DO UPDATE
      SET rating = EXCLUDED.rating, updated_at = now()
  `;

  public static readonly listPrevotes = `
    SELECT * FROM candidate_prevotes WHERE session_id = $1
  `;

  public static readonly upsertGuess = `
    INSERT INTO bias_guesses
      (session_id, guesser_player_id, target_player_id, round_number, guessed_bias_id, is_correct)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (session_id, guesser_player_id, target_player_id, round_number)
    DO UPDATE SET guessed_bias_id = EXCLUDED.guessed_bias_id, is_correct = EXCLUDED.is_correct
  `;

  public static readonly findPlayerScore = `
    SELECT score FROM session_players WHERE id = $1
  `;

  public static readonly setScore = `
    UPDATE session_players SET score = $1 WHERE id = $2
  `;

  public static readonly listGuesses = `
    SELECT * FROM bias_guesses WHERE session_id = $1
  `;

  public static readonly listPlayersPublic = `
    SELECT id, name, score, is_host, avatar FROM session_players WHERE session_id = $1 ORDER BY joined_at
  `;

  public static readonly addReady = `
    INSERT INTO session_phase_ready (session_id, player_id, phase_key)
    VALUES ($1, $2, $3)
    ON CONFLICT (session_id, player_id, phase_key) DO NOTHING
  `;

  public static readonly listReady = `
    SELECT player_id, phase_key FROM session_phase_ready WHERE session_id = $1
  `;

  public static readonly upsertReflection = `
    INSERT INTO reflection_journals (session_id, player_id, content)
    VALUES ($1, $2, $3)
    ON CONFLICT (session_id, player_id) DO UPDATE SET content = EXCLUDED.content, updated_at = now()
    RETURNING *
  `;

  public static readonly findReflection = `
    SELECT content, updated_at FROM reflection_journals WHERE session_id = $1 AND player_id = $2
  `;

  public static readonly listAchievements = `
    SELECT * FROM player_achievements WHERE session_id = $1
  `;

  public static readonly listPlayersForFinalize = `
    SELECT id FROM session_players WHERE session_id = $1
  `;

  public static readonly listAnswersForFinalize = `
    SELECT player_id, is_correct FROM bias_question_answers WHERE session_id = $1
  `;

  public static readonly listGuessesForFinalize = `
    SELECT guesser_player_id, target_player_id, is_correct FROM bias_guesses WHERE session_id = $1
  `;

  public static readonly listVotesForFinalize = `
    SELECT player_id, candidate_id, round_number FROM candidate_votes WHERE session_id = $1
  `;

  public static readonly chatCountByPlayer = `
    SELECT player_id, COUNT(*)::int AS cnt FROM chat_messages WHERE session_id = $1 GROUP BY player_id
  `;

  public static readonly addAchievement = `
    INSERT INTO player_achievements (session_id, player_id, achievement_key, bonus_points)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (session_id, player_id, achievement_key) DO NOTHING
  `;

  public static readonly addBonus = `
    UPDATE session_players SET score = score + $1 WHERE id = $2
  `;
}
