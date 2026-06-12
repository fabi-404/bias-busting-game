import { Router } from "express";
import { pool } from "../db/pool.js";

export const adminRouter = Router();

// GET /api/cards
adminRouter.get("/", async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT * FROM cards ORDER BY type, created_at",
  );
  res.json(rows);
});

// POST /api/cards
adminRouter.post("/", async (req, res) => {
  const { type, title, content, example, explanation, category, correct_answer } =
    req.body as {
      type: string;
      title: string;
      content: string;
      example?: string;
      explanation?: string;
      category?: string;
      correct_answer?: boolean | null;
    };

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ error: "title and content required" });
  }

  const { rows } = await pool.query(
    `INSERT INTO cards (type, title, content, example, explanation, category, correct_answer)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [type, title.trim(), content.trim(), example ?? null, explanation ?? null, category ?? null, correct_answer ?? null],
  );
  res.status(201).json(rows[0]);
});

// PUT /api/cards/:id
adminRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { type, title, content, example, explanation, category, correct_answer } =
    req.body as {
      type: string;
      title: string;
      content: string;
      example?: string;
      explanation?: string;
      category?: string;
      correct_answer?: boolean | null;
    };

  if (!title?.trim() || !content?.trim()) {
    return res.status(400).json({ error: "title and content required" });
  }

  const { rows } = await pool.query(
    `UPDATE cards SET type = $1, title = $2, content = $3, example = $4,
     explanation = $5, category = $6, correct_answer = $7
     WHERE id = $8 RETURNING *`,
    [type, title.trim(), content.trim(), example ?? null, explanation ?? null, category ?? null, correct_answer ?? null, id],
  );
  if (!rows.length) return res.status(404).json({ error: "Card not found" });
  res.json(rows[0]);
});

// DELETE /api/cards/:id
adminRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { rowCount } = await pool.query("DELETE FROM cards WHERE id = $1", [id]);
  if (!rowCount) return res.status(404).json({ error: "Card not found" });
  res.json({ ok: true });
});
