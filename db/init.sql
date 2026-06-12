-- ============================================================
-- Recruiting BIAS – Vollständiges Datenbankschema
-- ============================================================

-- Enums
CREATE TYPE card_type AS ENUM ('knowledge', 'truefalse', 'action');
CREATE TYPE session_status AS ENUM ('lobby', 'playing', 'ended');
CREATE TYPE game_phase AS ENUM (
  'lobby', 'phase1_knowledge', 'phase2_questions', 'phase3_candidates',
  'phase4_hire_vote', 'phase5_bias_guess', 'round_results', 'final_results'
);

-- Updated-at trigger function
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- Statische Spielinhalte
-- ============================================================

CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type card_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  example TEXT,
  correct_answer BOOLEAN,
  explanation TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER cards_touch BEFORE UPDATE ON cards
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE biases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_description TEXT NOT NULL,
  knowledge_card_text TEXT NOT NULL,
  example TEXT,
  color TEXT NOT NULL DEFAULT '#7c3aed',
  self_recognition TEXT,
  source_label TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bias_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bias_id UUID NOT NULL REFERENCES biases(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  correct_answer BOOLEAN NOT NULL,
  explanation TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  age INTEGER,
  pronouns TEXT,
  image_url TEXT,
  headline TEXT NOT NULL,
  description TEXT NOT NULL,
  qualifications TEXT NOT NULL,
  appeals_to_bias_id UUID REFERENCES biases(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Spielsitzungen
-- ============================================================

CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  host_token UUID NOT NULL DEFAULT gen_random_uuid(),
  host_name TEXT NOT NULL,
  status session_status NOT NULL DEFAULT 'lobby',
  phase game_phase NOT NULL DEFAULT 'lobby',
  current_round INTEGER NOT NULL DEFAULT 0,
  current_candidate_index INTEGER NOT NULL DEFAULT 0,
  current_question_index INTEGER NOT NULL DEFAULT 0,
  phase_started_at TIMESTAMPTZ,
  total_rounds INTEGER NOT NULL DEFAULT 1,
  current_action_card_id UUID,
  action_card_started_at TIMESTAMPTZ,
  selected_candidate_ids TEXT[] DEFAULT '{}',
  phase_duration_seconds INTEGER NOT NULL DEFAULT 120,
  anonymous_voting BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX game_sessions_code_idx ON game_sessions(code);

CREATE TRIGGER game_sessions_touch BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_token UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  is_host BOOLEAN NOT NULL DEFAULT false,
  avatar TEXT NOT NULL DEFAULT '🙂',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX session_players_session_idx ON session_players(session_id);

-- ============================================================
-- Spieleraktionen
-- ============================================================

CREATE TABLE player_bias_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  bias_id UUID NOT NULL REFERENCES biases(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id)
);

CREATE TABLE bias_question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES bias_questions(id) ON DELETE CASCADE,
  answer BOOLEAN NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, question_id)
);

CREATE TABLE candidate_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, round_number)
);

CREATE TABLE bias_guesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  guesser_player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  target_player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  guessed_bias_id UUID NOT NULL REFERENCES biases(id),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, guesser_player_id, target_player_id, round_number)
);

CREATE TABLE candidate_prevotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  candidate_id UUID NOT NULL REFERENCES candidates(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, candidate_id)
);

CREATE INDEX idx_candidate_prevotes_session ON candidate_prevotes(session_id, round_number);

CREATE TRIGGER candidate_prevotes_touch BEFORE UPDATE ON candidate_prevotes
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE session_phase_ready (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  phase_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, phase_key)
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  phase TEXT NOT NULL,
  round_number INTEGER NOT NULL DEFAULT 0,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_session_idx ON chat_messages(session_id, created_at);

CREATE TABLE reflection_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id)
);

CREATE TRIGGER reflection_journals_touch BEFORE UPDATE ON reflection_journals
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TABLE player_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES session_players(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  bonus_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, achievement_key)
);

CREATE INDEX player_achievements_session_idx ON player_achievements(session_id);

-- ============================================================
-- SEED: Biases
-- ============================================================

INSERT INTO biases (slug, name, short_description, knowledge_card_text, example, color, self_recognition, source_label, source_url) VALUES
('halo', 'Halo-Effekt', 'Eine positive Eigenschaft überstrahlt alle anderen.',
 'Der Halo-Effekt beschreibt die Tendenz, von einem auffälligen positiven Merkmal einer Person (z.B. attraktives Auftreten, prestigeträchtige Uni) auf andere, unabhängige Eigenschaften (z.B. Kompetenz, Teamfähigkeit) zu schließen — auch ohne Belege.',
 'Eine Bewerberin hat in Harvard studiert. Du gehst automatisch davon aus, dass sie auch in Soft Skills, Führung und Kreativität herausragend ist.',
 '#f59e0b',
 'Achte darauf, ob du jemanden aufgrund eines einzelnen positiven Merkmals (Aussehen, Auftreten, Prestige-Uni) pauschal positiver bewertest. Frage dich: "Würde ich diese Person genauso gut finden, wenn dieses eine Merkmal fehlen würde?"',
 'Thorndike (1920) · Nisbett & Wilson (1977)',
 'https://en.wikipedia.org/wiki/Halo_effect'),

('confirmation', 'Confirmation Bias', 'Du suchst Bestätigung für das, was du schon glaubst.',
 'Der Bestätigungsfehler ist die Neigung, Informationen so auszuwählen, zu deuten und zu erinnern, dass sie die eigenen Erwartungen bestätigen. Widersprechende Hinweise werden ausgeblendet oder kleingeredet.',
 'Du hältst Bewerber X von Anfang an für den besten. Im Gespräch hörst du nur noch die Stärken — Schwächen interpretierst du als „nicht so schlimm".',
 '#3b82f6',
 'Wenn du dich bei einer Bewerbung schnell auf eine Meinung festlegst und dann nur noch nach Belegen dafür suchst, bist du im Confirmation Bias. Teste dich: "Welche Information würde meine Einschätzung widerlegen — und habe ich aktiv danach gesucht?"',
 'Wason (1960) · Kahneman, Schnelles Denken, langsames Denken (2011)',
 'https://en.wikipedia.org/wiki/Confirmation_bias'),

('similarity', 'Ähnlichkeits-Bias', 'Wer dir ähnelt, gefällt dir besser.',
 'Der Similar-to-me-Bias führt dazu, dass wir Menschen bevorzugen, die uns in Hintergrund, Werten, Hobbys oder Sprache ähneln. Im Recruiting verstärkt das Monokulturen und benachteiligt diverse Profile.',
 'Bewerberin Y spielt wie du Tennis und kommt aus deiner Heimatstadt. Plötzlich wirkt sie sympathischer und „passt besser ins Team".',
 '#10b981',
 'Bemerke, wenn du jemanden besonders sympathisch findest, weil ihr aus derselben Stadt kommt, dieselbe Uni besucht habt oder ähnliche Hobbys teilt. Frage dich: "Bewerte ich gerade die Qualifikation oder die Ähnlichkeit zu mir selbst?"',
 'Byrne (1971) · Rivera, Hiring as Cultural Matching (2012)',
 'https://en.wikipedia.org/wiki/Similarity-attraction_theory'),

('attribution', 'Attributionsfehler', 'Erfolg = Persönlichkeit, Misserfolg = Umstände.',
 'Beim fundamentalen Attributionsfehler werten wir bei anderen Verhalten als Charaktereigenschaft, bei uns selbst aber als Folge der Umstände. Bei Bewerbungsgesprächen kann eine Lücke im Lebenslauf so als „mangelnde Disziplin" gewertet werden — bei uns wäre es „familiäre Situation".',
 'Bewerber Z war ein Jahr arbeitslos. Du denkst: „Wahrscheinlich nicht motiviert genug." Eigene Lücken erklärst du dir mit Pflege von Angehörigen oder Weiterbildung.',
 '#ec4899',
 'Wenn du das Verhalten einer Person sofort auf den Charakter zurückführst ("ist unzuverlässig") statt auf die Situation ("hatte einen schlechten Tag"), wirkt der Attributionsfehler. Frage dich: "Welche situativen Erklärungen gäbe es noch?"',
 'Ross (1977) · Jones & Harris (1967)',
 'https://en.wikipedia.org/wiki/Fundamental_attribution_error');

-- ============================================================
-- SEED: Bias-Fragen (3 pro Bias)
-- ============================================================

INSERT INTO bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM biases, (VALUES
  ('Der Halo-Effekt sorgt dafür, dass ein einziges positives Merkmal die Wahrnehmung aller anderen Eigenschaften verzerrt.', true, 'Genau das ist die Definition — ein „Heiligenschein" überstrahlt unabhängige Eigenschaften.', 1),
  ('Der Halo-Effekt tritt nur bei optisch attraktiven Personen auf.', false, 'Er kann auch durch Titel, Universität, Auftreten, Akzent oder ersten Eindruck ausgelöst werden.', 2),
  ('Strukturierte Interviewleitfäden helfen, den Halo-Effekt zu reduzieren.', true, 'Standardisierte Fragen + Bewertungsskalen pro Kompetenz dämpfen den Effekt nachweislich.', 3)
) AS q(q, ans, expl, pos)
WHERE slug = 'halo';

INSERT INTO bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM biases, (VALUES
  ('Beim Confirmation Bias suchst du aktiv nach Informationen, die deine erste Einschätzung widerlegen.', false, 'Genau das Gegenteil — du suchst Bestätigung und blendest Widersprüchliches aus.', 1),
  ('Confirmation Bias kann durch das Einholen einer zweiten unabhängigen Meinung reduziert werden.', true, 'Devil''s-Advocate-Rollen und unabhängige Reviewer*innen sind effektive Gegenmittel.', 2),
  ('Ein einmal gefasster „Bauchgefühl-Eindruck" lässt sich im weiteren Gespräch fast nicht mehr korrigieren.', true, 'Studien zeigen: bereits nach wenigen Sekunden ist die Einschätzung schwer revidierbar.', 3)
) AS q(q, ans, expl, pos)
WHERE slug = 'confirmation';

INSERT INTO bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM biases, (VALUES
  ('„Cultural Fit" als Auswahlkriterium ist immer ein Schutz vor Ähnlichkeits-Bias.', false, 'Im Gegenteil — „Fit" wird oft synonym mit „mir ähnlich" gebraucht und verstärkt den Bias.', 1),
  ('Ähnlichkeit in Hobbys oder Sprache wirkt sich oft unbewusst auf die Bewertung der Fachkompetenz aus.', true, 'Sympathie und Kompetenz werden im Kopf vermischt.', 2),
  ('Diverse Auswahlkomitees können den Ähnlichkeits-Bias deutlich abschwächen.', true, 'Unterschiedliche Perspektiven gleichen individuelle Sympathien aus.', 3)
) AS q(q, ans, expl, pos)
WHERE slug = 'similarity';

INSERT INTO bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM biases, (VALUES
  ('Beim Attributionsfehler erklären wir das Verhalten anderer eher durch Persönlichkeit als durch Umstände.', true, 'Genau — bei uns selbst ist es umgekehrt.', 1),
  ('Eine Lücke im Lebenslauf ist objektiv ein verlässlicher Indikator für mangelnde Motivation.', false, 'Lücken haben unzählige Gründe (Care-Arbeit, Krankheit, Weiterbildung). Die Bewertung als Charakterproblem ist klassischer Attributionsfehler.', 2),
  ('Den Attributionsfehler beseitigt man, indem man Bewerber*innen ausdrücklich nach Kontext zu Lücken oder Brüchen fragt.', true, 'Kontext einholen ist die wirksamste Gegenmaßnahme.', 3)
) AS q(q, ans, expl, pos)
WHERE slug = 'attribution';

-- ============================================================
-- SEED: Kandidat:innen (9 gesamt, 3 pro Runde)
-- ============================================================

INSERT INTO candidates (round_number, position, name, age, pronouns, headline, description, qualifications, appeals_to_bias_id)
VALUES
(1, 1, 'Dr. Lena Schäfer', 32, 'sie/ihr',
 'Promovierte Wirtschaftspsychologin, Harvard MBA',
 'Stilsicher, eloquent, internationale Karriere bei Top-Beratungen. Wirkt im Gespräch souverän und schlagfertig.',
 '• MBA Harvard Business School' || chr(10) || '• 4 Jahre McKinsey' || chr(10) || '• Publikationen zu Leadership' || chr(10) || '• Englisch, Französisch, Deutsch verhandlungssicher',
 (SELECT id FROM biases WHERE slug = 'halo')),

(1, 2, 'Marcus Berger', 41, 'er/ihm',
 'Quereinsteiger, ehemaliger Tischler',
 '15 Jahre Handwerk, dann Umschulung zum Recruiter. Pragmatisch, geerdet, mit Lücken im klassischen HR-Lebenslauf.',
 '• Meisterprüfung Tischler' || chr(10) || '• Recruiter-Zertifikat (IHK)' || chr(10) || '• 2 Jahre Personalvermittlung' || chr(10) || '• Lücke 2018–2019 (Pflege Angehörige)',
 (SELECT id FROM biases WHERE slug = 'attribution')),

(1, 3, 'Aisha Okonkwo', 28, 'sie/ihr',
 'Solide HR-Generalistin mit Datenfokus',
 'Klare Bewerbung, ruhig im Gespräch. Bringt strukturierte HR-Analytics-Erfahrung mit, aber kein „Wow-Faktor".',
 '• B.Sc. HR Management' || chr(10) || '• 4 Jahre People Analytics' || chr(10) || '• Workday & SAP SuccessFactors' || chr(10) || '• People Ops bei zwei Scale-ups',
 NULL),

(2, 1, 'Jonas Weber', 29, 'er/ihm',
 'Triathlet, BWL-Absolvent, „passt ins Team"',
 'Sportlich, kommunikativ, gleiche Hobbys wie viele aus dem Team. Wirkt sofort sympathisch und zugänglich.',
 '• B.Sc. BWL Mannheim' || chr(10) || '• 3 Jahre Sales' || chr(10) || '• Trainer Triathlon-Verein' || chr(10) || '• Aktiv in Alumni-Netzwerk',
 (SELECT id FROM biases WHERE slug = 'similarity')),

(2, 2, 'Fatima El-Sayed', 35, 'sie/ihr',
 'Senior People-Lead mit internationalem Profil',
 'Erfahrene Führungskraft, mehrsprachig, klare Kommunikation. Hat in Kairo, Dubai und Berlin gearbeitet.',
 '• 8 Jahre People Leadership' || chr(10) || '• Aufbau HR-Abteilung in 3 Ländern' || chr(10) || '• MBA INSEAD' || chr(10) || '• Coaching-Zertifizierung ICF',
 NULL),

(2, 3, 'Tim Hoffmann', 38, 'er/ihm',
 'Vielversprechend trotz CV-Lücke',
 'Starkes Fachwissen, aber 2 Jahre Lücke vor 5 Jahren. Im Interview offen und reflektiert.',
 '• Senior Recruiter Tech' || chr(10) || '• 6 Jahre IT-Recruiting' || chr(10) || '• Lücke 2019–2021 (Burnout & Reha)' || chr(10) || '• Aktiv in Mental-Health-Initiativen',
 (SELECT id FROM biases WHERE slug = 'attribution')),

(3, 1, 'Priya Raman', 30, 'sie/ihr',
 'Tech-Recruiterin mit Stanford-Hintergrund',
 'Beeindruckender Lebenslauf, internationale Awards, charismatisch. Wirkt „zu gut, um wahr zu sein".',
 '• M.Sc. Stanford' || chr(10) || '• Lead Talent bei Stripe (2 Jahre)' || chr(10) || '• Speakerin auf 5 Konferenzen' || chr(10) || '• 30 Under 30 Forbes',
 (SELECT id FROM biases WHERE slug = 'halo')),

(3, 2, 'Daniel Krüger', 45, 'er/ihm',
 'Erfahrener Recruiter, „bewährtes Profil"',
 'Klassische Karriere, viele Jahre im selben Unternehmen. Bestätigt alle Erwartungen an einen „Senior Recruiter".',
 '• 15 Jahre Recruiting Mittelstand' || chr(10) || '• Diplom-Kaufmann' || chr(10) || '• Mentor im DGFP' || chr(10) || '• Ruhiger, methodischer Stil',
 (SELECT id FROM biases WHERE slug = 'confirmation')),

(3, 3, 'Sam Nguyen', 26, 'they/them',
 'Junges Profil, ungewohnter Werdegang',
 'Quereinstieg über Bootcamp, Erfahrung in zwei Start-ups, unkonventionelle Antworten im Interview.',
 '• People-Ops Bootcamp' || chr(10) || '• 2 Jahre HR-Tech Start-up' || chr(10) || '• Side-Projekt: DEI-Plattform' || chr(10) || '• TikTok-Account zu Recruiting (40k Follower)',
 NULL);

-- ============================================================
-- SEED: Action-Karten
-- ============================================================

INSERT INTO cards (type, title, content, explanation, category) VALUES
('action', 'Der Lebenslauf', 'Zwei nahezu identische Lebensläufe gehen ein – einer mit dem Namen „Lukas Müller", einer mit „Aishe Yılmaz". Lukas wird zum Gespräch eingeladen, Aishe nicht. Wie reagiert ihr im Team?', NULL, 'Szenario'),
('action', 'Das Bewerbungsgespräch', 'Eine Kollegin fragt eine Bewerberin: „Planen Sie in den nächsten Jahren Kinder?" Was tut ihr in dieser Situation – im Moment und danach?', NULL, 'Szenario'),
('action', 'Die Empfehlung', 'Euer Team rekrutiert hauptsächlich über persönliche Empfehlungen. Welche Effekte hat das auf Diversität – und welche Alternativen gibt es?', NULL, 'Szenario'),
('action', 'Der Akzent', 'Ein Kandidat spricht Deutsch mit starkem Akzent. Eine Kollegin sagt im Debrief: „Im Kundenkontakt schwierig." Wie geht ihr damit um?', NULL, 'Szenario'),
('action', 'Die Quote', 'Geschäftsleitung schlägt eine 50%-Frauenquote im Recruiting vor. Welche Argumente dafür und dagegen hört ihr im eigenen Umfeld – und wie steht ihr dazu?', NULL, 'Szenario');
