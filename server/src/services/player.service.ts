import { PostgreSQLConfig } from "../configs/postgreSQL.config.js";
import { PlayerQueries } from "../queries/player.queries.js";
import { signToken } from "../utils/jwt.util.js";
import type { JoinPlayerBody, PlayerPublic } from "../types/game.type.js";

export class PlayerService {
  static async join(
    sessionId: string,
    body: JoinPlayerBody,
  ): Promise<Record<string, unknown>> {
    const { name, is_host = false, avatar = "🙂" } = body;

    const { rows: countRows } = await PostgreSQLConfig.pool.query(
      PlayerQueries.countBySession,
      [sessionId],
    );
    if (parseInt(countRows[0].count, 10) >= 5) {
      throw Object.assign(new Error("Raum ist voll (max. 5 Spieler:innen)."), { status: 409 });
    }

    const { rows } = await PostgreSQLConfig.pool.query(PlayerQueries.add, [
      sessionId,
      name.trim(),
      is_host,
      (avatar || "🙂").slice(0, 8),
    ]);
    const { id, name: playerName, score, is_host: isHost, avatar: playerAvatar } = rows[0] as {
      id: string; name: string; score: number; is_host: boolean; avatar: string;
    };
    const player_token = signToken({ sub: id, role: isHost ? "host" : "player", sessionId, playerId: id });
    return { id, player_token, name: playerName, score, is_host: isHost, avatar: playerAvatar };
  }

  static async listBySession(sessionId: string): Promise<PlayerPublic[]> {
    const { rows } = await PostgreSQLConfig.pool.query(PlayerQueries.listBySession, [sessionId]);
    return rows;
  }

  static async updateScore(
    sessionId: string,
    playerId: string,
    score: number,
  ): Promise<PlayerPublic | null> {
    const { rows } = await PostgreSQLConfig.pool.query(PlayerQueries.updateScore, [
      score,
      playerId,
      sessionId,
    ]);
    return rows[0] ?? null;
  }
}
