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
 'Der Halo-Effekt (Thorndike, 1920) beschreibt die kognitive Verzerrung, aus einem einzigen auffälligen Merkmal – einem Prestige-Studium, physischer Attraktivität oder souveränem Auftreten – pauschale Schlüsse auf davon unabhängige Eigenschaften wie Fachkompetenz oder Teamfähigkeit zu ziehen. Thorndike (1920) wies nach, dass Vorgesetzte militärische Untergebene in scheinbar unabhängigen Dimensionen (z.B. Intelligenz und Körperpflege) mit unerwartet hoher Korrelation beurteilten. Nisbett & Wilson (1977) zeigten experimentell, dass eine sympathische Ausstrahlung die Bewertung von Akzent und Äußerem verbessert – ohne dass Beurteilende sich dieser Verschiebung bewusst waren. Im Einstellungskontext ist der Effekt besonders ausgeprägt: Eine Metaanalyse von Hosoda, Stone-Romero & Coats (2003) belegt, dass körperliche Attraktivität bis zu 20 % der Varianz in Einstellungsentscheidungen erklären kann – auch bei konstant gehaltener Qualifikation.',
 'Eine Bewerberin hat in Harvard studiert. Du gehst automatisch davon aus, dass sie auch in Soft Skills, Führung und Kreativität herausragend ist.',
 '#f59e0b',
 'Bewerte Kandidat:innen zunächst dimensionsweise – Fachkompetenz, Kommunikation, Führungspotenzial getrennt – bevor du ein Gesamturteil bildest. Balzer & Sulsky (1992) zeigten, dass diese Methode der getrennten Dimensionsbewertung den Halo-Effekt bei Leistungsbeurteilungen nachweislich reduziert. Frage dich konkret: Welchen eigenständigen Beleg habe ich für jede dieser Eigenschaften – unabhängig von meinem Gesamteindruck dieser Person?',
 'Thorndike (1920) · Nisbett & Wilson (1977) · Hosoda et al. (2003, Journal of Vocational Behavior)',
 'https://doi.org/10.1006/jvbe.2002.1994'),

('confirmation', 'Confirmation Bias', 'Du suchst Bestätigung für das, was du schon glaubst.',
 'Der Bestätigungsfehler (Wason, 1960; Nickerson, 1998) bezeichnet die Neigung, Informationen so zu suchen, zu deuten und zu erinnern, dass sie bestehende Überzeugungen bestätigen. Wason (1960) demonstrierte dies mit dem „2-4-6-Task": Versuchspersonen sollten eine Zahlenregel entdecken, testeten aber systematisch nur bestätigende – nie widerlegende – Hypothesen. Im Recruiting zeigt sich der Effekt besonders in der Gesprächsführung: Snyder & Swann (1978) belegten experimentell, dass Interviewer:innen gezielt Fragen stellen, die eine Ausgangshypothese bestätigen (z.B. „Introvertiert") – und damit das Ergebnis unabhängig vom Wahrheitsgehalt ihrer Annahme verzerren. Nickerson (1998) fasst in seiner Übersichtsarbeit zusammen: Bestätigungssuche ist eines der robustesten und ubiquitärsten Muster menschlichen Urteilens.',
 'Du hältst Bewerber X von Anfang an für den besten. Im Gespräch hörst du nur noch die Stärken — Schwächen interpretierst du als „nicht so schlimm".',
 '#3b82f6',
 'Formuliere aktiv die Gegenannahme: „Was würde ich von dieser Person erwarten zu sehen, wenn mein erster Eindruck falsch wäre?" Larrick (2004) identifiziert das explizite Suchen nach gegenläufiger Evidenz als wirksamste Einzelmaßnahme gegen Bestätigungsfehler. Konkret: Bitte jemanden im Team, gezielt Argumente gegen deinen Favoriten zu sammeln – die sogenannte „Devil''s Advocate"-Rolle.',
 'Wason (1960, Quarterly Journal of Experimental Psychology) · Snyder & Swann (1978) · Nickerson (1998, Psychological Bulletin)',
 'https://doi.org/10.1037/0033-2909.124.2.175'),

('similarity', 'Ähnlichkeits-Bias', 'Wer dir ähnelt, gefällt dir besser.',
 'Der Similar-to-me-Bias (Byrne, 1971) bezeichnet die Tendenz, Personen zu bevorzugen, die uns in Hintergrund, Werten, Interessen oder Sprache ähneln. Byrnes Similarity-Attraction-Paradigma belegt: Je mehr gemeinsame Einstellungen, desto höher die interpersonale Anziehung – ein kulturübergreifend robuster Effekt. Im Recruiting hat Rivera (2012) in einer ethnografischen Studie bei drei Elite-Beratungsfirmen gezeigt, dass „Cultural Fit" in der Praxis häufig mit Lifestyle-Ähnlichkeit gleichgesetzt wird: Gemeinsame Hobbys, Sportarten und Freizeitaktivitäten schlugen Qualifikation und Leistungspotenzial in der finalen Kandidatenwahl. Turban & Jones (1988) konnten zeigen, dass Vorgesetzte ähnlichen Untergebenen systematisch bessere Bewertungen gaben – selbst bei kontrollierter objektiver Leistung.',
 'Bewerberin Y spielt wie du Tennis und kommt aus deiner Heimatstadt. Plötzlich wirkt sie sympathischer und „passt besser ins Team".',
 '#10b981',
 'Trenne explizit zwischen „Ich mag diese Person" und „Diese Person ist für die Stelle qualifiziert". Der entscheidende Test: Würde eine Person mit anderem Hintergrund, anderen Hobbys oder einer anderen Hochschule, aber identischer Qualifikation genauso bewertet werden? Diverse Auswahlgremien sind laut Bohnet (2016, „What Works: Gender Equality by Design") die nachweislich wirksamste strukturelle Maßnahme gegen Ähnlichkeitsbias – weil unterschiedliche Perspektiven individuelle Sympathien ausgleichen.',
 'Byrne (1971, The Attraction Paradigm) · Rivera (2012, American Sociological Review) · Turban & Jones (1988, Journal of Applied Psychology)',
 'https://doi.org/10.1177/0003122412463213'),

('attribution', 'Attributionsfehler', 'Erfolg = Persönlichkeit, Misserfolg = Umstände.',
 'Der fundamentale Attributionsfehler (Ross, 1977) beschreibt die Tendenz, das Verhalten anderer Personen übermäßig auf stabile Charaktereigenschaften zurückzuführen und situative Erklärungen zu unterschätzen – während wir bei uns selbst Situationsfaktoren viel stärker berücksichtigen. Jones & Harris (1967) zeigten in einer Klassiker-Studie: Selbst wenn Versuchspersonen wussten, dass jemand eine politische Position aus Pflicht vortrug (nicht aus Überzeugung), schrieben sie ihm diese Ansicht als persönliche Meinung zu. Im Recruiting bedeutet das: Eine Lücke im Lebenslauf wird rasch als Zeichen mangelnder Motivation gewertet. Weisshaar (2018) belegt in einer Audit-Studie, dass Eltern nach familienbedingter Erwerbspause signifikant weniger Rückrufe erhielten als vergleichbare Kandidat:innen – ein Effekt, der sich nicht durch objektive Qualifikationsunterschiede erklären lässt.',
 'Bewerber Z war ein Jahr arbeitslos. Du denkst: „Wahrscheinlich nicht motiviert genug." Eigene Lücken erklärst du dir mit Pflege von Angehörigen oder Weiterbildung.',
 '#ec4899',
 'Hinterfrage jede Charakterschlussfolgerung aktiv: „Welche situativen Faktoren könnten dieses Verhalten erklären, ohne dass es etwas über den Charakter dieser Person aussagt?" Levashina & Campion (2007) empfehlen behaviorale Interviewfragen mit explizitem Kontext: „Beschreiben Sie eine Situation, in der X passiert ist – welche Rahmenbedingungen lagen vor?" Dieser Ansatz zwingt Interviewer:innen, Situationsfaktoren aktiv zu erfassen, statt direkt auf Persönlichkeit zu schließen.',
 'Ross (1977, Advances in Experimental Social Psychology) · Jones & Harris (1967, Journal of Experimental Social Psychology) · Weisshaar (2018, American Sociological Review)',
 'https://doi.org/10.1177/0003122417739558');

-- ============================================================
-- SEED: Bias-Fragen (3 pro Bias)
-- ============================================================

INSERT INTO bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM biases, (VALUES
  ('Der Halo-Effekt sorgt dafür, dass ein einziges positives Merkmal die Wahrnehmung aller anderen Eigenschaften verzerrt.', true, 'Genau das ist die Definition — ein „Heiligenschein" überstrahlt unabhängige Eigenschaften.', 1),
  ('Der Halo-Effekt tritt nur bei optisch attraktiven Personen auf.', false, 'Er kann auch durch Titel, Universität, Auftreten, Akzent oder ersten Eindruck ausgelöst werden.', 2),
  ('Strukturierte Interviewleitfäden helfen, den Halo-Effekt zu reduzieren.', true, 'Eine Metaanalyse von Huffcutt & Arthur (1994, Journal of Applied Psychology) belegt: Strukturierte Interviews erhöhen die Vorhersagevalidität für Jobperformance von r ≈ .20 (unstrukturiert) auf r ≈ .51 (strukturiert) – und reduzieren Halo-Effekte, weil jede Kompetenz isoliert und kriterienbasiert bewertet wird.', 3)
) AS q(q, ans, expl, pos)
WHERE slug = 'halo';

INSERT INTO bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM biases, (VALUES
  ('Beim Confirmation Bias suchst du aktiv nach Informationen, die deine erste Einschätzung widerlegen.', false, 'Genau das Gegenteil — du suchst Bestätigung und blendest Widersprüchliches aus.', 1),
  ('Confirmation Bias kann durch das Einholen einer zweiten unabhängigen Meinung reduziert werden.', true, 'Devil''s-Advocate-Rollen und unabhängige Reviewer*innen sind effektive Gegenmittel.', 2),
  ('Ein einmal gefasster „Bauchgefühl-Eindruck" lässt sich im weiteren Gespräch fast nicht mehr korrigieren.', true, 'Ambady & Rosenthal (1992) zeigten in ihrer „Thin-Slices"-Forschung, dass 30-Sekunden-Eindrücke von Lehrenden die Semesterbewertungen durch Studierende vorhersagen. Parsons et al. (2011) bestätigten im Interviewkontext: Eindrücke aus den ersten Minuten korrelieren stark mit dem Gesamturteil – spätere Informationen werden systematisch weniger gewichtet.', 3)
) AS q(q, ans, expl, pos)
WHERE slug = 'confirmation';

INSERT INTO bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM biases, (VALUES
  ('„Cultural Fit" als Auswahlkriterium ist immer ein Schutz vor Ähnlichkeits-Bias.', false, 'Rivera (2012) zeigte in einer ethnografischen Studie bei drei Top-Beratungsfirmen: In der Praxis bedeutete „Cultural Fit" vor allem geteilte Freizeitinteressen und Lifestyle – Tennis, Skifahren, Schulzugehörigkeit – und nicht gemeinsame Arbeitswerte oder -methoden. Damit wird „Fit" zum direkten Verstärker des Ähnlichkeitsbias.', 1),
  ('Ähnlichkeit in Hobbys oder Sprache wirkt sich oft unbewusst auf die Bewertung der Fachkompetenz aus.', true, 'Sympathie und Kompetenz werden im Kopf vermischt.', 2),
  ('Diverse Auswahlkomitees können den Ähnlichkeits-Bias deutlich abschwächen.', true, 'Unterschiedliche Perspektiven gleichen individuelle Sympathien aus.', 3)
) AS q(q, ans, expl, pos)
WHERE slug = 'similarity';

INSERT INTO bias_questions (bias_id, question, correct_answer, explanation, position)
SELECT id, q, ans, expl, pos FROM biases, (VALUES
  ('Beim Attributionsfehler erklären wir das Verhalten anderer eher durch Persönlichkeit als durch Umstände.', true, 'Jones & Harris (1967) belegten dies mit dem sogenannten Koerzions-Experiment: Versuchspersonen lasen Aufsätze mit einer politischen Position und schätzten ein, ob der Autor diese Meinung wirklich vertrat – selbst wenn ihnen gesagt wurde, die Position sei zufällig zugewiesen worden, schrieben sie sie dem Charakter des Autors zu.', 1),
  ('Eine Lücke im Lebenslauf ist objektiv ein verlässlicher Indikator für mangelnde Motivation.', false, 'Weisshaar (2018) führte eine Audit-Studie mit fiktiven, qualifikationsgleichen Lebensläufen durch: Eltern mit familienbedingter Erwerbslücke erhielten signifikant weniger Rückrufe als Kandidat:innen ohne Lücke – ein Effekt, der sich nicht durch objektive Qualifikationsunterschiede erklären lässt und direkter Ausdruck des Attributionsfehlers ist.', 2),
  ('Den Attributionsfehler beseitigt man, indem man Bewerber:innen ausdrücklich nach Kontext zu Lücken oder Brüchen fragt.', true, 'Kontext einholen ist die wirksamste Gegenmaßnahme.', 3)
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
('action', 'Der Lebenslauf', 'Zwei nahezu identische Lebensläufe gehen ein – einer mit dem Namen „Lukas Müller", einer mit „Aishe Yılmaz". Lukas wird zum Gespräch eingeladen, Aishe nicht. Wie reagiert ihr im Team?', 'Bertrand & Mullainathan (2004, American Economic Review) versandten in einer Feldstudie identische Lebensläufe mit typisch weißen und typisch afroamerikanischen Namen – weiß klingende Namen erhielten 50 % mehr Rückrufe. Kaas & Manger (2012) belegen vergleichbare Effekte für türkisch klingende Namen in Deutschland bei ansonsten identischen Bewerbungsunterlagen.', 'Szenario'),
('action', 'Das Bewerbungsgespräch', 'Eine Kollegin fragt eine Bewerberin: „Planen Sie in den nächsten Jahren Kinder?" Was tut ihr in dieser Situation – im Moment und danach?', 'Fragen zur Familienplanung sind in Deutschland nach § 1 AGG (Allgemeines Gleichbehandlungsgesetz) unzulässig – auch in indirekter Form. Correll, Benard & Paik (2007) belegen die sogenannte „Mutterschaftsstrafe": Mütter wurden bei identischen Qualifikationen als weniger kompetent und weniger engagiert eingeschätzt als kinderlose Frauen – und häufiger abgelehnt.', 'Szenario'),
('action', 'Die Empfehlung', 'Euer Team rekrutiert hauptsächlich über persönliche Empfehlungen. Welche Effekte hat das auf Diversität – und welche Alternativen gibt es?', 'Netzwerkbasiertes Recruiting verstärkt bestehende Homogenität: Erickson & Petersen (2021) zeigen, dass Empfehlungen vor allem Kandidat:innen aus demselben sozialen Milieu einbringen und strukturelle Zugangshürden für Außenstehende erhöhen. Rivera (2016) beschreibt, wie informelle „Back-Channel"-Referenzen in Elite-Netzwerken gezielt genutzt werden und die Diversität weiter einschränken.', 'Szenario'),
('action', 'Der Akzent', 'Ein Kandidat spricht Deutsch mit starkem Akzent. Eine Kollegin sagt im Debrief: „Im Kundenkontakt schwierig." Wie geht ihr damit um?', 'Carlson & McHenry (2006) belegen, dass ein fremdsprachiger Akzent die Rückrufrate bei Bewerbungen reduziert – selbst wenn die sprachliche Verständlichkeit objektiv einwandfrei ist. Purkiss et al. (2006) zeigen zudem: Ein Akzent löst über den Halo-Effekt eine Verzerrung aus, bei der auch fachliche Kompetenzen schlechter bewertet werden – obwohl sie vom Akzent völlig unabhängig sind.', 'Szenario'),
('action', 'Die Quote', 'Geschäftsleitung schlägt eine 50%-Frauenquote im Recruiting vor. Welche Argumente dafür und dagegen hört ihr im eigenen Umfeld – und wie steht ihr dazu?', 'Bohnet (2016, „What Works: Gender Equality by Design") zeigt, dass isolierte Quoten ohne begleitende strukturelle Maßnahmen häufig Backlash-Effekte auslösen und die Wahrnehmung begünstigen, Eingestellte seien nur wegen der Quote berücksichtigt worden. Wirksamere Alternativen: strukturierte, kriterienbasierte Bewertungsverfahren und die Entfernung von Namen und Fotos in der Erstauswahl (blinde Bewerbungsverfahren).', 'Szenario');
