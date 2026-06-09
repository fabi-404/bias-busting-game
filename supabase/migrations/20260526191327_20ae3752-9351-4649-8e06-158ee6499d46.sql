ALTER TABLE public.game_sessions
  ADD COLUMN IF NOT EXISTS phase_duration_seconds integer NOT NULL DEFAULT 120,
  ADD COLUMN IF NOT EXISTS anonymous_voting boolean NOT NULL DEFAULT true;