import { Router } from "express";
import { pool } from "../db/pool.js";
import { io } from "../index.js";

export const chatRouter = Router();

// GET /api/sessions/:id/chat
chatRouter.get("/:id/chat", async (req, res) => {
  const { id } = req.params;
  const { rows } = await pool.query(
    "SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY created_at ASC",
    [id],
  );
  res.json(rows);
});

// POST /api/sessions/:id/chat
chatRouter.post("/:id/chat", async (req, res) => {
  const { id } = req.params;
  const { player_id, player_name, phase, round_number, message } = req.body as {
    player_id: string;
    player_name: string;
    phase: string;
    round_number: number;
    message: string;
  };

  if (!message?.trim()) return res.status(400).json({ error: "message required" });

  const { rows } = await pool.query(
    `INSERT INTO chat_messages (session_id, player_id, player_name, phase, round_number, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [id, player_id, player_name, phase, round_number, message.trim().slice(0, 500)],
  );

  io.to(id).emit("chat:message", rows[0]);
  res.status(201).json(rows[0]);
});
