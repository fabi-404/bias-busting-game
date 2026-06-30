export class ChatQueries {
  public static readonly listBySession = `
    SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC
  `;

  public static readonly add = `
    INSERT INTO chat_messages (session_id, player_id, player_name, phase, round_number, message)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `;
}
