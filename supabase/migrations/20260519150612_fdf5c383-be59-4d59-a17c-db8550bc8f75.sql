
CREATE TABLE public.session_phase_ready (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  player_id uuid NOT NULL,
  phase_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, phase_key)
);

ALTER TABLE public.session_phase_ready ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open read" ON public.session_phase_ready FOR SELECT USING (true);
CREATE POLICY "open write" ON public.session_phase_ready FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.session_phase_ready REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_phase_ready;
