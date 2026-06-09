
-- New enum for game phases
CREATE TYPE public.game_phase AS ENUM (
  'lobby',
  'phase1_knowledge',
  'phase2_questions',
  'phase3_candidates',
  'phase4_hire_vote',
  'phase5_bias_guess',
  'round_results',
  'final_results'
);

-- Extend game_sessions
ALTER TABLE public.game_sessions
  ADD COLUMN phase public.game_phase NOT NULL DEFAULT 'lobby',
  ADD COLUMN current_round integer NOT NULL DEFAULT 0,
  ADD COLUMN current_candidate_index integer NOT NULL DEFAULT 0,
  ADD COLUMN phase_started_at timestamptz,
  ADD COLUMN current_question_index integer NOT NULL DEFAULT 0;

-- Biases
CREATE TABLE public.biases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  short_description text NOT NULL,
  knowledge_card_text text NOT NULL,
  example text,
  color text NOT NULL DEFAULT '#7c3aed',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.biases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open read" ON public.biases FOR SELECT USING (true);
CREATE POLICY "open write" ON public.biases FOR ALL USING (true) WITH CHECK (true);

-- Bias questions (true/false)
CREATE TABLE public.bias_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bias_id uuid NOT NULL REFERENCES public.biases(id) ON DELETE CASCADE,
  question text NOT NULL,
  correct_answer boolean NOT NULL,
  explanation text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.bias_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open read" ON public.bias_questions FOR SELECT USING (true);
CREATE POLICY "open write" ON public.bias_questions FOR ALL USING (true) WITH CHECK (true);

-- Candidates (job applicants)
CREATE TABLE public.candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number integer NOT NULL,
  position integer NOT NULL DEFAULT 0,
  name text NOT NULL,
  age integer,
  pronouns text,
  image_url text,
  headline text NOT NULL,
  description text NOT NULL,
  qualifications text NOT NULL,
  -- the bias the candidate "appeals to" (so we can highlight bias matches later)
  appeals_to_bias_id uuid REFERENCES public.biases(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open read" ON public.candidates FOR SELECT USING (true);
CREATE POLICY "open write" ON public.candidates FOR ALL USING (true) WITH CHECK (true);

-- Bias assignments per session/player
CREATE TABLE public.player_bias_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  player_id uuid NOT NULL,
  bias_id uuid NOT NULL REFERENCES public.biases(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id)
);
ALTER TABLE public.player_bias_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open read" ON public.player_bias_assignments FOR SELECT USING (true);
CREATE POLICY "open write" ON public.player_bias_assignments FOR ALL USING (true) WITH CHECK (true);

-- Phase 2 — knowledge question answers
CREATE TABLE public.bias_question_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  player_id uuid NOT NULL,
  question_id uuid NOT NULL REFERENCES public.bias_questions(id) ON DELETE CASCADE,
  answer boolean NOT NULL,
  is_correct boolean NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, question_id)
);
ALTER TABLE public.bias_question_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open read" ON public.bias_question_answers FOR SELECT USING (true);
CREATE POLICY "open write" ON public.bias_question_answers FOR ALL USING (true) WITH CHECK (true);

-- Phase 4 — hiring votes
CREATE TABLE public.candidate_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  player_id uuid NOT NULL,
  round_number integer NOT NULL,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, round_number)
);
ALTER TABLE public.candidate_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open read" ON public.candidate_votes FOR SELECT USING (true);
CREATE POLICY "open write" ON public.candidate_votes FOR ALL USING (true) WITH CHECK (true);

-- Phase 5 — bias guesses (who has which bias)
CREATE TABLE public.bias_guesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  guesser_player_id uuid NOT NULL,
  target_player_id uuid NOT NULL,
  round_number integer NOT NULL,
  guessed_bias_id uuid NOT NULL REFERENCES public.biases(id),
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, guesser_player_id, target_player_id, round_number)
);
ALTER TABLE public.bias_guesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open read" ON public.bias_guesses FOR SELECT USING (true);
CREATE POLICY "open write" ON public.bias_guesses FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_bias_assignments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bias_question_answers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidate_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bias_guesses;

-- Seed: 4 biases
INSERT INTO public.biases (slug, name, short_description, knowledge_card_text, example, color) VALUES
('halo', 'Halo-Effekt', 'Eine positive Eigenschaft überstrahlt alle anderen.',
 'Der Halo-Effekt beschreibt die Tendenz, von einem auffälligen positiven Merkmal einer Person (z.B. attraktives Auftreten, prestigeträchtige Uni) auf andere, unabhängige Eigenschaften (z.B. Kompetenz, Teamfähigkeit) zu schließen — auch ohne Belege.',
 'Eine Bewerberin hat in Harvard studiert. Du gehst automatisch davon aus, dass sie auch in Soft Skills, Führung und Kreativität herausragend ist.',
 '#f59e0b'),
('confirmation', 'Confirmation Bias', 'Du suchst Bestätigung für das, was du schon glaubst.',
 'Der Bestätigungsfehler ist die Neigung, Informationen so auszuwählen, zu deuten und zu erinnern, dass sie die eigenen Erwartungen bestätigen. Widersprechende Hinweise werden ausgeblendet oder kleingeredet.',
 'Du hältst Bewerber X von Anfang an für den besten. Im Gespräch hörst du nur noch die Stärken — Schwächen interpretierst du als „nicht so schlimm".',
 '#3b82f6'),
('similarity', 'Ähnlichkeits-Bias', 'Wer dir ähnelt, gefällt dir besser.',
 'Der Similar-to-me-Bias führt dazu, dass wir Menschen bevorzugen, die uns in Hintergrund, Werten, Hobbys oder Sprache ähneln. Im Recruiting verstärkt das Monokulturen und benachteiligt diverse Profile.',
 'Bewerberin Y spielt wie du Tennis und kommt aus deiner Heimatstadt. Plötzlich wirkt sie sympathischer und „passt besser ins Team".',
 '#10b981'),
('attribution', 'Attributionsfehler', 'Erfolg = Persönlichkeit, Misserfolg = Umstände.',
 'Beim fundamentalen Attributionsfehler werten wir bei anderen Verhalten als Charaktereigenschaft, bei uns selbst aber als Folge der Umstände. Bei Bewerbungsgesprächen kann eine Lücke im Lebenslauf so als „mangelnde Disziplin" gewertet werden — bei uns wäre es „familiäre Situation".',
 'Bewerber Z war ein Jahr arbeitslos. Du denkst: „Wahrscheinlich nicht motiviert genug." Eigene Lücken erklärst du dir mit Pflege von Angehörigen oder Weiterbildung.',
 '#ec4899');

-- Seed: 3 questions per bias
INSERT INTO public.bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM public.biases, (VALUES
  ('Der Halo-Effekt sorgt dafür, dass ein einziges positives Merkmal die Wahrnehmung aller anderen Eigenschaften verzerrt.', true, 'Genau das ist die Definition — ein „Heiligenschein" überstrahlt unabhängige Eigenschaften.', 1),
  ('Der Halo-Effekt tritt nur bei optisch attraktiven Personen auf.', false, 'Er kann auch durch Titel, Universität, Auftreten, Akzent oder ersten Eindruck ausgelöst werden.', 2),
  ('Strukturierte Interviewleitfäden helfen, den Halo-Effekt zu reduzieren.', true, 'Standardisierte Fragen + Bewertungsskalen pro Kompetenz dämpfen den Effekt nachweislich.', 3)
) AS q(q, ans, expl, pos)
WHERE slug = 'halo';

INSERT INTO public.bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM public.biases, (VALUES
  ('Beim Confirmation Bias suchst du aktiv nach Informationen, die deine erste Einschätzung widerlegen.', false, 'Genau das Gegenteil — du suchst Bestätigung und blendest Widersprüchliches aus.', 1),
  ('Confirmation Bias kann durch das Einholen einer zweiten unabhängigen Meinung reduziert werden.', true, 'Devil''s-Advocate-Rollen und unabhängige Reviewer*innen sind effektive Gegenmittel.', 2),
  ('Ein einmal gefasster „Bauchgefühl-Eindruck" lässt sich im weiteren Gespräch fast nicht mehr korrigieren.', true, 'Studien zeigen: bereits nach wenigen Sekunden ist die Einschätzung schwer revidierbar.', 3)
) AS q(q, ans, expl, pos)
WHERE slug = 'confirmation';

INSERT INTO public.bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM public.biases, (VALUES
  ('„Cultural Fit" als Auswahlkriterium ist immer ein Schutz vor Ähnlichkeits-Bias.', false, 'Im Gegenteil — „Fit" wird oft synonym mit „mir ähnlich" gebraucht und verstärkt den Bias.', 1),
  ('Ähnlichkeit in Hobbys oder Sprache wirkt sich oft unbewusst auf die Bewertung der Fachkompetenz aus.', true, 'Symphatie und Kompetenz werden im Kopf vermischt.', 2),
  ('Diverse Auswahlkomitees können den Ähnlichkeits-Bias deutlich abschwächen.', true, 'Unterschiedliche Perspektiven gleichen individuelle Sympathien aus.', 3)
) AS q(q, ans, expl, pos)
WHERE slug = 'similarity';

INSERT INTO public.bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM public.biases, (VALUES
  ('Beim Attributionsfehler erklären wir das Verhalten anderer eher durch Persönlichkeit als durch Umstände.', true, 'Genau — bei uns selbst ist es umgekehrt.', 1),
  ('Eine Lücke im Lebenslauf ist objektiv ein verlässlicher Indikator für mangelnde Motivation.', false, 'Lücken haben unzählige Gründe (Care-Arbeit, Krankheit, Weiterbildung). Die Bewertung als Charakterproblem ist klassischer Attributionsfehler.', 2),
  ('Den Attributionsfehler beseitigt man, indem man Bewerber*innen ausdrücklich nach Kontext zu Lücken oder Brüchen fragt.', true, 'Kontext einholen ist die wirksamste Gegenmaßnahme.', 3)
) AS q(q, ans, expl, pos)
WHERE slug = 'attribution';

-- Seed: 9 candidates (3 per round)
INSERT INTO public.candidates (round_number, position, name, age, pronouns, headline, description, qualifications, appeals_to_bias_id)
SELECT 1, 1, 'Dr. Lena Schäfer', 32, 'sie/ihr',
  'Promovierte Wirtschaftspsychologin, Harvard MBA',
  'Stilsicher, eloquent, internationale Karriere bei Top-Beratungen. Wirkt im Gespräch souverän und schlagfertig.',
  '• MBA Harvard Business School\n• 4 Jahre McKinsey\n• Publikationen zu Leadership\n• Englisch, Französisch, Deutsch verhandlungssicher',
  id FROM public.biases WHERE slug = 'halo';

INSERT INTO public.candidates (round_number, position, name, age, pronouns, headline, description, qualifications, appeals_to_bias_id)
SELECT 1, 2, 'Marcus Berger', 41, 'er/ihm',
  'Quereinsteiger, ehemaliger Tischler',
  '15 Jahre Handwerk, dann Umschulung zum Recruiter. Pragmatisch, geerdet, mit Lücken im klassischen HR-Lebenslauf.',
  '• Meisterprüfung Tischler\n• Recruiter-Zertifikat (IHK)\n• 2 Jahre Personalvermittlung\n• Lücke 2018–2019 (Pflege Angehörige)',
  id FROM public.biases WHERE slug = 'attribution';

INSERT INTO public.candidates (round_number, position, name, age, pronouns, headline, description, qualifications, appeals_to_bias_id)
SELECT 1, 3, 'Aisha Okonkwo', 28, 'sie/ihr',
  'Solide HR-Generalistin mit Datenfokus',
  'Klare Bewerbung, ruhig im Gespräch. Bringt strukturierte HR-Analytics-Erfahrung mit, aber kein „Wow-Faktor".',
  '• B.Sc. HR Management\n• 4 Jahre People Analytics\n• Workday & SAP SuccessFactors\n• People Ops bei zwei Scale-ups',
  NULL;

INSERT INTO public.candidates (round_number, position, name, age, pronouns, headline, description, qualifications, appeals_to_bias_id)
SELECT 2, 1, 'Jonas Weber', 29, 'er/ihm',
  'Triathlet, BWL-Absolvent, „passt ins Team"',
  'Sportlich, kommunikativ, gleiche Hobbys wie viele aus dem Team. Wirkt sofort sympathisch und zugänglich.',
  '• B.Sc. BWL Mannheim\n• 3 Jahre Sales\n• Trainer Triathlon-Verein\n• Aktiv in Alumni-Netzwerk',
  id FROM public.biases WHERE slug = 'similarity';

INSERT INTO public.candidates (round_number, position, name, age, pronouns, headline, description, qualifications, appeals_to_bias_id)
SELECT 2, 2, 'Fatima El-Sayed', 35, 'sie/ihr',
  'Senior People-Lead mit internationalem Profil',
  'Erfahrene Führungskraft, mehrsprachig, klare Kommunikation. Hat in Kairo, Dubai und Berlin gearbeitet.',
  '• 8 Jahre People Leadership\n• Aufbau HR-Abteilung in 3 Ländern\n• MBA INSEAD\n• Coaching-Zertifizierung ICF',
  NULL;

INSERT INTO public.candidates (round_number, position, name, age, pronouns, headline, description, qualifications, appeals_to_bias_id)
SELECT 2, 3, 'Tim Hoffmann', 38, 'er/ihm',
  'Vielversprechend trotz CV-Lücke',
  'Starkes Fachwissen, aber 2 Jahre Lücke vor 5 Jahren. Im Interview offen und reflektiert.',
  '• Senior Recruiter Tech\n• 6 Jahre IT-Recruiting\n• Lücke 2019–2021 (Burnout & Reha)\n• Aktiv in Mental-Health-Initiativen',
  id FROM public.biases WHERE slug = 'attribution';

INSERT INTO public.candidates (round_number, position, name, age, pronouns, headline, description, qualifications, appeals_to_bias_id)
SELECT 3, 1, 'Priya Raman', 30, 'sie/ihr',
  'Tech-Recruiterin mit Stanford-Hintergrund',
  'Beeindruckender Lebenslauf, internationale Awards, charismatisch. Wirkt „zu gut, um wahr zu sein".',
  '• M.Sc. Stanford\n• Lead Talent bei Stripe (2 Jahre)\n• Speakerin auf 5 Konferenzen\n• 30 Under 30 Forbes',
  id FROM public.biases WHERE slug = 'halo';

INSERT INTO public.candidates (round_number, position, name, age, pronouns, headline, description, qualifications, appeals_to_bias_id)
SELECT 3, 2, 'Daniel Krüger', 45, 'er/ihm',
  'Erfahrener Recruiter, „bewährtes Profil"',
  'Klassische Karriere, viele Jahre im selben Unternehmen. Bestätigt alle Erwartungen an einen „Senior Recruiter".',
  '• 15 Jahre Recruiting Mittelstand\n• Diplom-Kaufmann\n• Mentor im DGFP\n• Ruhiger, methodischer Stil',
  id FROM public.biases WHERE slug = 'confirmation';

INSERT INTO public.candidates (round_number, position, name, age, pronouns, headline, description, qualifications, appeals_to_bias_id)
SELECT 3, 3, 'Sam Nguyen', 26, 'they/them',
  'Junges Profil, ungewohnter Werdegang',
  'Quereinstieg über Bootcamp, Erfahrung in zwei Start-ups, unkonventionelle Antworten im Interview.',
  '• People-Ops Bootcamp\n• 2 Jahre HR-Tech Start-up\n• Side-Projekt: DEI-Plattform\n• TikTok-Account zu Recruiting (40k Follower)',
  NULL;
