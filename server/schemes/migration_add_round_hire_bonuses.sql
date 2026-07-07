-- ============================================================
-- Migration: Bonuspunkte für die objektiv richtige Kandidat:innen-Wahl pro Runde
-- ============================================================

CREATE TABLE round_hire_bonuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  bonus_points INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, round_number)
);

CREATE INDEX round_hire_bonuses_session_idx ON round_hire_bonuses(session_id);
