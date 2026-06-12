import { Router } from "express";
import { pool } from "../db/pool.js";
import { io } from "../index.js";

export const playersRouter = Router();

// POST /api/sessions/:id/players — Spieler beitreten
playersRouter.post("/:id/players", async (req, res) => {
  const { id } = req.params;
  const { name, is_host = false, avatar = "🙂" } = req.body as {
    name: string;
    is_host?: boolean;
    avatar?: string;
  };
  if (!name?.trim()) return res.status(400).json({ error: "name required" });

  const { rows } = await pool.query(
    `INSERT INTO session_players (session_id, name, is_host, avatar)
     VALUES ($1, $2, $3, $4)
     RETURNING id, player_token, name, score, is_host, avatar`,
    [id, name.trim(), is_host, (avatar || "🙂").slice(0, 8)],
  );

  const updated = await pool.query(
    "SELECT id, name, score, is_host, avatar FROM session_players WHERE session_id = $1 ORDER BY joined_at",
    [id],
  );
  io.to(id).emit("players:updated", updated.rows);

  res.status(201).json(rows[0]);
});

// PATCH /api/sessions/:id/players/:playerId — Score aktualisieren
playersRouter.patch("/:id/players/:playerId", async (req, res) => {
  const { id, playerId } = req.params;
  const { score } = req.body as { score: number };

  const { rows } = await pool.query(
    "UPDATE session_players SET score = $1 WHERE id = $2 AND session_id = $3 RETURNING id, name, score, is_host, avatar",
    [score, playerId, id],
  );
  if (!rows.length) return res.status(404).json({ error: "Player not found" });

  const updated = await pool.query(
    "SELECT id, name, score, is_host, avatar FROM session_players WHERE session_id = $1 ORDER BY joined_at",
    [id],
  );
  io.to(id).emit("players:updated", updated.rows);

  res.json(rows[0]);
});
