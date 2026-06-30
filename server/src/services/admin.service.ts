import { PostgreSQLConfig } from "../configs/postgreSQL.config.js";
import { AdminQueries } from "../queries/admin.queries.js";
import type { Card, CardBody } from "../types/game.type.js";

export class AdminService {
  static async listAll(): Promise<Card[]> {
    const { rows } = await PostgreSQLConfig.pool.query(AdminQueries.listAll);
    return rows;
  }

  static async create(body: CardBody): Promise<Card> {
    const { type, title, content, example, explanation, category, correct_answer } = body;

    const { rows } = await PostgreSQLConfig.pool.query(AdminQueries.add, [
      type,
      title.trim(),
      content.trim(),
      example ?? null,
      explanation ?? null,
      category ?? null,
      correct_answer ?? null,
    ]);
    return rows[0];
  }

  static async update(id: string, body: CardBody): Promise<Card | null> {
    const { type, title, content, example, explanation, category, correct_answer } = body;

    const { rows } = await PostgreSQLConfig.pool.query(AdminQueries.update, [
      type,
      title.trim(),
      content.trim(),
      example ?? null,
      explanation ?? null,
      category ?? null,
      correct_answer ?? null,
      id,
    ]);
    return rows[0] ?? null;
  }

  static async remove(id: string): Promise<boolean> {
    const { rowCount } = await PostgreSQLConfig.pool.query(AdminQueries.remove, [id]);
    return (rowCount ?? 0) > 0;
  }
}
