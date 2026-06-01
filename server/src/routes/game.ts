import { Router } from "express";
import { pool } from "../db/pool.js";
import { io } from "../index.js";

export const gameRouter = Router();

// POST /api/sessions/:id/assignments — Biases zuordnen (Host)
gameRouter.post("/:id/assignments", async (req, res) => {
  const { id } = req.params;
  const { rows: bias_assignments } = req.body as { rows: { player_id: string; bias_id: string }[] };

  if (!bias_assignments?.length) return res.status(400).json({ error: "rows required" });

  await pool.query("DELETE FROM player_bias_assignments WHERE session_id = $1", [id]);

  for (const row of bias_assignments) {
    await pool.query(
      "INSERT INTO player_bias_assignments (session_id, player_id, bias_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
      [id, row.player_id, row.bias_id],
    );
  }

  const { rows } = await pool.query(
    "SELECT * FROM player_bias_assignments WHERE session_id = $1",
    [id],
  );
  io.to(id).emit("assignments:updated", rows);
  res.json(rows);
});

// POST /api/sessions/:id/answers — Frage beantworten
gameRouter.post("/:id/answers", async (req, res) => {
  const { id } = req.params;
  const { player_id, question_id, answer } = req.body as {
    player_id: string;
    question_id: string;
    answer: boolean;
  };

  const { rows: questions } = await pool.query(
    "SELECT correct_answer FROM bias_questions WHERE id = $1",
    [question_id],
  );
  if (!questions.length) return res.status(404).json({ error: "Question not found" });
  const is_correct = questions[0].correct_answer === answer;

  const { rows } = await pool.query(
    `INSERT INTO bias_question_answers (session_id, player_id, question_id, answer, is_correct)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (session_id, player_id, question_id) DO UPDATE
       SET answer = EXCLUDED.answer, is_correct = EXCLUDED.is_correct
     RETURNING *`,
    [id, player_id, question_id, answer, is_correct],
  );

  if (is_correct) {
    const { rows: players } = await pool.query(
      "SELECT score FROM session_players WHERE id = $1",
      [player_id],
    );
    if (players.length) {
      await pool.query(
        "UPDATE session_players SET score = $1 WHERE id = $2",
        [players[0].score + 1, player_id],
      );
      const updated = await pool.query(
        "SELECT id, name, score, is_host FROM session_players WHERE session_id = $1 ORDER BY joined_at",
        [id],
      );
      io.to(id).emit("players:updated", updated.rows);
    }
  }

  const allAnswers = await pool.query(
    "SELECT * FROM bias_question_answers WHERE session_id = $1",
    [id],
  );
  io.to(id).emit("answers:updated", allAnswers.rows);
  res.json(rows[0]);
});

// POST /api/sessions/:id/votes — Kandidaten-Abstimmung
gameRouter.post("/:id/votes", async (req, res) => {
  const { id } = req.params;
  const { player_id, round_number, candidate_id } = req.body as {
    player_id: string;
    round_number: number;
    candidate_id: string;
  };

  await pool.query(
    `INSERT INTO candidate_votes (session_id, player_id, round_number, candidate_id)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (session_id, player_id, round_number) DO UPDATE SET candidate_id = EXCLUDED.candidate_id`,
    [id, player_id, round_number, candidate_id],
  );

  const { rows } = await pool.query(
    "SELECT * FROM candidate_votes WHERE session_id = $1",
    [id],
  );
  io.to(id).emit("votes:updated", rows);
  res.json({ ok: true });
});

// POST /api/sessions/:id/prevotes — Stille Kandidaten-Bewertung
gameRouter.post("/:id/prevotes", async (req, res) => {
  const { id } = req.params;
  const { player_id, round_number, candidate_id, rating } = req.body as {
    player_id: string;
    round_number: number;
    candidate_id: string;
    rating: number;
  };

  await pool.query(
    `INSERT INTO candidate_prevotes (session_id, player_id, round_number, candidate_id, rating)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (session_id, player_id, candidate_id) DO UPDATE
       SET rating = EXCLUDED.rating, updated_at = now()`,
    [id, player_id, round_number, candidate_id, rating],
  );

  const { rows } = await pool.query(
    "SELECT * FROM candidate_prevotes WHERE session_id = $1",
    [id],
  );
  io.to(id).emit("prevotes:updated", rows);
  res.json({ ok: true });
});

// POST /api/sessions/:id/guesses — Bias-Tipps abgeben
gameRouter.post("/:id/guesses", async (req, res) => {
  const { id } = req.params;
  const { guesses } = req.body as {
    guesses: Array<{
      guesser_player_id: string;
      target_player_id: string;
      round_number: number;
      guessed_bias_id: string;
      is_correct: boolean;
    }>;
  };

  if (!guesses?.length) return res.status(400).json({ error: "guesses required" });

  let correctCount = 0;
  for (const g of guesses) {
    if (g.is_correct) correctCount++;
    await pool.query(
      `INSERT INTO bias_guesses (session_id, guesser_player_id, target_player_id, round_number, guessed_bias_id, is_correct)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (session_id, guesser_player_id, target_player_id, round_number)
       DO UPDATE SET guessed_bias_id = EXCLUDED.guessed_bias_id, is_correct = EXCLUDED.is_correct`,
      [id, g.guesser_player_id, g.target_player_id, g.round_number, g.guessed_bias_id, g.is_correct],
    );
  }

  if (correctCount > 0) {
    const { rows: players } = await pool.query(
      "SELECT score FROM session_players WHERE id = $1",
      [guesses[0].guesser_player_id],
    );
    if (players.length) {
      await pool.query(
        "UPDATE session_players SET score = $1 WHERE id = $2",
        [players[0].score + correctCount, guesses[0].guesser_player_id],
      );
      const updated = await pool.query(
        "SELECT id, name, score, is_host FROM session_players WHERE session_id = $1 ORDER BY joined_at",
        [id],
      );
      io.to(id).emit("players:updated", updated.rows);
    }
  }

  const { rows } = await pool.query(
    "SELECT * FROM bias_guesses WHERE session_id = $1",
    [id],
  );
  io.to(id).emit("guesses:updated", rows);
  res.json({ ok: true, correct: correctCount });
});

// POST /api/sessions/:id/ready — Phase bereit markieren
gameRouter.post("/:id/ready", async (req, res) => {
  const { id } = req.params;
  const { player_id, phase_key } = req.body as { player_id: string; phase_key: string };

  await pool.query(
    `INSERT INTO session_phase_ready (session_id, player_id, phase_key)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id, player_id, phase_key) DO NOTHING`,
    [id, player_id, phase_key],
  );

  const { rows } = await pool.query(
    "SELECT player_id, phase_key FROM session_phase_ready WHERE session_id = $1",
    [id],
  );
  io.to(id).emit("ready:updated", rows);
  res.json({ ok: true });
});

// POST /api/sessions/:id/reflection — Reflexions-Journal
gameRouter.post("/:id/reflection", async (req, res) => {
  const { id } = req.params;
  const { player_id, content } = req.body as { player_id: string; content: string };

  const { rows } = await pool.query(
    `INSERT INTO reflection_journals (session_id, player_id, content)
     VALUES ($1, $2, $3)
     ON CONFLICT (session_id, player_id) DO UPDATE SET content = EXCLUDED.content, updated_at = now()
     RETURNING *`,
    [id, player_id, content ?? ""],
  );
  res.json(rows[0]);
});

// GET /api/sessions/:id/reflection/:playerId
gameRouter.get("/:id/reflection/:playerId", async (req, res) => {
  const { id, playerId } = req.params;
  const { rows } = await pool.query(
    "SELECT content, updated_at FROM reflection_journals WHERE session_id = $1 AND player_id = $2",
    [id, playerId],
  );
  res.json(rows[0] ?? null);
});
