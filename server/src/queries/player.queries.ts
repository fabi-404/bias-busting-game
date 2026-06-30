export class PlayerQueries {
  public static readonly countBySession = `
    SELECT COUNT(*) FROM session_players WHERE session_id = $1
  `;

  public static readonly add = `
    INSERT INTO session_players (session_id, name, is_host, avatar)
    VALUES ($1, $2, $3, $4)
    RETURNING id, player_token, name, score, is_host, avatar
  `;

  public static readonly listBySession = `
    SELECT id, name, score, is_host, avatar
    FROM session_players
    WHERE session_id = $1
    ORDER BY joined_at
  `;

  public static readonly updateScore = `
    UPDATE session_players
    SET score = $1
    WHERE id = $2 AND session_id = $3
    RETURNING id, name, score, is_host, avatar
  `;
}
