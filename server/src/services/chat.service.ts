import { PostgreSQLConfig } from "../configs/postgreSQL.config.js";
import { ChatQueries } from "../queries/chat.queries.js";
import type { ChatMessage, PostChatBody } from "../types/game.type.js";

export class ChatService {
  static async listBySession(sessionId: string): Promise<ChatMessage[]> {
    const { rows } = await PostgreSQLConfig.pool.query(ChatQueries.listBySession, [sessionId]);
    return rows;
  }

  static async add(sessionId: string, body: PostChatBody): Promise<ChatMessage> {
    const { player_id, player_name, phase, round_number, message } = body;

    const { rows } = await PostgreSQLConfig.pool.query(ChatQueries.add, [
      sessionId,
      player_id,
      player_name,
      phase,
      round_number,
      message.trim().slice(0, 500),
    ]);
    return rows[0];
  }
}
