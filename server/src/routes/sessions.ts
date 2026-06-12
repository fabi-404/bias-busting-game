import { Router } from "express";
import { pool } from "../db/pool.js";
import { io } from "../index.js";

export const sessionsRouter = Router();

function generateCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// POST /api/sessions — Sitzung erstellen
sessionsRouter.post("/", async (req, res) => {
  const { host_name, total_rounds = 1 } = req.body as {
    host_name: string;
    total_rounds?: number;
  };
  if (!host_name?.trim()) {
    return res.status(400).json({ error: "host_name required" });
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateCode();
    try {
      const { rows } = await pool.query(
        `INSERT INTO game_sessions (code, host_name, total_rounds)
         VALUES ($1, $2, $3)
         RETURNING id, code, host_token`,
        [code, host_name.trim(), total_rounds],
      );
      return res.status(201).json(rows[0]);
    } catch (e: unknown) {
      if (attempt === 4) {
        console.error(e);
        return res.status(500).json({ error: "Could not create session" });
      }
    }
  }
});

// GET /api/sessions/:code — Sitzung per Code laden (alles auf einmal)
sessionsRouter.get("/:code", async (req, res) => {
  const { code } = req.params;
  const { rows: sessions } = await pool.query(
    "SELECT * FROM game_sessions WHERE code = $1",
    [code.toUpperCase()],
  );
  if (!sessions.length) return res.status(404).json({ error: "Session not found" });
  const session = sessions[0];

  const [players, biases, questions, candidates, assignments, answers, votes, guesses, ready, actionCards, prevotes, achievements] =
    await Promise.all([
      pool.query("SELECT id, name, score, is_host FROM session_players WHERE session_id = $1 ORDER BY joined_at", [session.id]),
      pool.query("SELECT * FROM biases ORDER BY name"),
      pool.query("SELECT * FROM bias_questions ORDER BY position"),
      pool.query("SELECT * FROM candidates ORDER BY round_number, position"),
      pool.query("SELECT * FROM player_bias_assignments WHERE session_id = $1", [session.id]),
      pool.query("SELECT * FROM bias_question_answers WHERE session_id = $1", [session.id]),
      pool.query("SELECT * FROM candidate_votes WHERE session_id = $1", [session.id]),
      pool.query("SELECT * FROM bias_guesses WHERE session_id = $1", [session.id]),
      pool.query("SELECT player_id, phase_key FROM session_phase_ready WHERE session_id = $1", [session.id]),
      pool.query("SELECT id, title, content, explanation, category FROM cards WHERE type = 'action'"),
      pool.query("SELECT * FROM candidate_prevotes WHERE session_id = $1", [session.id]),
      pool.query("SELECT * FROM player_achievements WHERE session_id = $1", [session.id]),
    ]);

  res.json({
    session,
    players: players.rows,
    biases: biases.rows,
    questions: questions.rows,
    candidates: candidates.rows,
    assignments: assignments.rows,
    answers: answers.rows,
    votes: votes.rows,
    guesses: guesses.rows,
    ready: ready.rows,
    actionCards: actionCards.rows,
    prevotes: prevotes.rows,
    achievements: achievements.rows,
  });
});

// PATCH /api/sessions/:id — Sitzungsstatus aktualisieren (Host)
sessionsRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const updates = req.body as Record<string, unknown>;

  const allowed = [
    "phase", "status", "current_round", "current_candidate_index",
    "current_question_index", "phase_started_at", "selected_candidate_ids",
    "current_action_card_id", "action_card_started_at",
    "phase_duration_seconds", "anonymous_voting",
  ];

  const fields = Object.keys(updates).filter((k) => allowed.includes(k));
  if (!fields.length) return res.status(400).json({ error: "No valid fields" });

  const setClauses = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const values = fields.map((f) => updates[f]);
  values.push(id);

  const { rows } = await pool.query(
    `UPDATE game_sessions SET ${setClauses} WHERE id = $${values.length} RETURNING *`,
    values,
  );
  if (!rows.length) return res.status(404).json({ error: "Session not found" });

  io.to(id).emit("session:updated", rows[0]);
  res.json(rows[0]);
});
