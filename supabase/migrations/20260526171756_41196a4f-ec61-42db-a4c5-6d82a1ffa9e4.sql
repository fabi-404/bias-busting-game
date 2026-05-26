CREATE TABLE public.candidate_prevotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  player_id uuid NOT NULL,
  round_number integer NOT NULL,
  candidate_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, candidate_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_prevotes TO anon, authenticated;
GRANT ALL ON public.candidate_prevotes TO service_role;

ALTER TABLE public.candidate_prevotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open read" ON public.candidate_prevotes FOR SELECT USING (true);
CREATE POLICY "open write" ON public.candidate_prevotes FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX idx_candidate_prevotes_session ON public.candidate_prevotes(session_id, round_number);

ALTER PUBLICATION supabase_realtime ADD TABLE public.candidate_prevotes;
