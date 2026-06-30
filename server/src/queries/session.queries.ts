export class SessionQueries {
  public static readonly create = `
    INSERT INTO game_sessions (code, host_name, total_rounds)
    VALUES ($1, $2, $3)
    RETURNING id, code, host_token
  `;

  public static readonly findByCode = `
    SELECT * FROM game_sessions WHERE code = $1
  `;

  public static readonly listPlayers = `
    SELECT id, name, score, is_host, avatar
    FROM session_players
    WHERE session_id = $1
    ORDER BY joined_at
  `;

  public static readonly listBiases = `
    SELECT * FROM biases ORDER BY name
  `;

  public static readonly listQuestions = `
    SELECT * FROM bias_questions ORDER BY position
  `;

  public static readonly listCandidates = `
    SELECT * FROM candidates ORDER BY round_number, position
  `;

  public static readonly listAssignments = `
    SELECT * FROM player_bias_assignments WHERE session_id = $1
  `;

  public static readonly listAnswers = `
    SELECT * FROM bias_question_answers WHERE session_id = $1
  `;

  public static readonly listVotes = `
    SELECT * FROM candidate_votes WHERE session_id = $1
  `;

  public static readonly listGuesses = `
    SELECT * FROM bias_guesses WHERE session_id = $1
  `;

  public static readonly listReady = `
    SELECT player_id, phase_key FROM session_phase_ready WHERE session_id = $1
  `;

  public static readonly listActionCards = `
    SELECT id, title, content, explanation, category FROM cards WHERE type = 'action'
  `;

  public static readonly listPrevotes = `
    SELECT * FROM candidate_prevotes WHERE session_id = $1
  `;

  public static readonly listAchievements = `
    SELECT * FROM player_achievements WHERE session_id = $1
  `;

  public static update(fields: string[]): string {
    const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
    return `UPDATE game_sessions SET ${setClauses} WHERE id = $${fields.length + 1} RETURNING *`;
  }
}
