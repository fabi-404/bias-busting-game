
-- Add deeper bias explanation fields
ALTER TABLE public.biases
  ADD COLUMN IF NOT EXISTS self_recognition text,
  ADD COLUMN IF NOT EXISTS source_label text,
  ADD COLUMN IF NOT EXISTS source_url text;

-- Seed deeper content for the 4 existing biases
UPDATE public.biases SET
  self_recognition = 'Achte darauf, ob du jemanden aufgrund eines einzelnen positiven Merkmals (Aussehen, Auftreten, Prestige-Uni) pauschal positiver bewertest. Frage dich: "Würde ich diese Person genauso gut finden, wenn dieses eine Merkmal fehlen würde?"',
  source_label = 'Thorndike (1920) · Nisbett & Wilson (1977)',
  source_url = 'https://en.wikipedia.org/wiki/Halo_effect'
WHERE slug = 'halo';

UPDATE public.biases SET
  self_recognition = 'Wenn du dich bei einer Bewerbung schnell auf eine Meinung festlegst und dann nur noch nach Belegen dafür suchst, bist du im Confirmation Bias. Teste dich: "Welche Information würde meine Einschätzung widerlegen — und habe ich aktiv danach gesucht?"',
  source_label = 'Wason (1960) · Kahneman, Schnelles Denken, langsames Denken (2011)',
  source_url = 'https://en.wikipedia.org/wiki/Confirmation_bias'
WHERE slug = 'confirmation';

UPDATE public.biases SET
  self_recognition = 'Bemerke, wenn du jemanden besonders sympathisch findest, weil ihr aus derselben Stadt kommt, dieselbe Uni besucht habt oder ähnliche Hobbys teilt. Frage dich: "Bewerte ich gerade die Qualifikation oder die Ähnlichkeit zu mir selbst?"',
  source_label = 'Byrne (1971) · Rivera, Hiring as Cultural Matching (2012)',
  source_url = 'https://en.wikipedia.org/wiki/Similarity-attraction_theory'
WHERE slug = 'similarity';

UPDATE public.biases SET
  self_recognition = 'Wenn du das Verhalten einer Person sofort auf den Charakter zurückführst ("ist unzuverlässig") statt auf die Situation ("hatte einen schlechten Tag, kam aus dem Stau"), wirkt der Attributionsfehler. Frage dich: "Welche situativen Erklärungen gäbe es noch?"',
  source_label = 'Ross (1977) · Jones & Harris (1967)',
  source_url = 'https://en.wikipedia.org/wiki/Fundamental_attribution_error'
WHERE slug = 'attribution';

-- Action card state on session
ALTER TABLE public.game_sessions
  ADD COLUMN IF NOT EXISTS current_action_card_id uuid,
  ADD COLUMN IF NOT EXISTS action_card_started_at timestamptz;

-- Reflection journals table (open access — matches accepted-risk model)
CREATE TABLE IF NOT EXISTS public.reflection_journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  player_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reflection_journals TO anon, authenticated;
GRANT ALL ON public.reflection_journals TO service_role;

ALTER TABLE public.reflection_journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open read" ON public.reflection_journals FOR SELECT USING (true);
CREATE POLICY "open write" ON public.reflection_journals FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER reflection_journals_touch
  BEFORE UPDATE ON public.reflection_journals
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
