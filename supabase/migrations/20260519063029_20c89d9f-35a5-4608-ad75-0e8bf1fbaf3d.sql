
-- Card types enum
CREATE TYPE card_type AS ENUM ('knowledge', 'truefalse', 'action');
CREATE TYPE session_status AS ENUM ('lobby', 'playing', 'ended');

-- Cards library
CREATE TABLE public.cards (
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

-- Game sessions
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  host_token UUID NOT NULL DEFAULT gen_random_uuid(),
  host_name TEXT NOT NULL,
  status session_status NOT NULL DEFAULT 'lobby',
  current_card_id UUID REFERENCES public.cards(id) ON DELETE SET NULL,
  revealed BOOLEAN NOT NULL DEFAULT false,
  round_number INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX game_sessions_code_idx ON public.game_sessions(code);

-- Players in a session
CREATE TABLE public.session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_token UUID NOT NULL DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX session_players_session_idx ON public.session_players(session_id);

-- Votes on true/false cards
CREATE TABLE public.session_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.session_players(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  vote BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, round_number)
);

CREATE INDEX session_votes_session_idx ON public.session_votes(session_id, round_number);

-- Card draw history
CREATE TABLE public.session_card_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX session_card_history_session_idx ON public.session_card_history(session_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER cards_touch BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER game_sessions_touch BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- RLS
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_card_history ENABLE ROW LEVEL SECURITY;

-- Open access (no auth game, gated by room code)
CREATE POLICY "open read" ON public.cards FOR SELECT USING (true);
CREATE POLICY "open write" ON public.cards FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "open read" ON public.game_sessions FOR SELECT USING (true);
CREATE POLICY "open write" ON public.game_sessions FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "open read" ON public.session_players FOR SELECT USING (true);
CREATE POLICY "open write" ON public.session_players FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "open read" ON public.session_votes FOR SELECT USING (true);
CREATE POLICY "open write" ON public.session_votes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "open read" ON public.session_card_history FOR SELECT USING (true);
CREATE POLICY "open write" ON public.session_card_history FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_votes;

ALTER TABLE public.game_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.session_players REPLICA IDENTITY FULL;
ALTER TABLE public.session_votes REPLICA IDENTITY FULL;

-- Seed cards
INSERT INTO public.cards (type, title, content, example, category) VALUES
('knowledge', 'Affinity Bias', 'Die Tendenz, Menschen zu bevorzugen, die uns ähnlich sind – ob in Herkunft, Ausbildung, Interessen oder Auftreten.', 'Ein Recruiter stellt jemanden ein, weil sie an der gleichen Uni waren und beide Fußball mögen – fachlich wäre eine andere Person geeigneter.', 'Bias'),
('knowledge', 'Halo Effect', 'Ein einzelnes positives Merkmal überstrahlt die Gesamtbewertung einer Person.', 'Ein selbstbewusster Auftritt im Interview lässt eine Kandidatin pauschal als kompetent erscheinen, obwohl die Antworten schwach waren.', 'Bias'),
('knowledge', 'Mikroaggression', 'Subtile, oft unbewusste verbale oder nonverbale Botschaften, die Menschen aus marginalisierten Gruppen herabsetzen.', '„Sie sprechen aber gut Deutsch!" zu einer in Deutschland geborenen Person of Color.', 'Diskriminierung'),
('knowledge', 'Confirmation Bias', 'Die Neigung, Informationen so wahrzunehmen, dass sie unsere bestehenden Annahmen bestätigen.', 'Wer glaubt, junge Eltern seien weniger belastbar, achtet im Interview gezielt auf Anzeichen dafür – und übersieht Gegenbeispiele.', 'Bias'),
('knowledge', 'Gender Bias', 'Geschlechtsbezogene Vorurteile beeinflussen Auswahl, Bewertung und Bezahlung von Bewerber:innen.', 'Eine Frau wird in einem technischen Interview häufiger nach „Teamfähigkeit" gefragt als nach Architektur-Entscheidungen.', 'Diskriminierung'),

('truefalse', 'Anonyme Bewerbungen', 'Anonyme Bewerbungen (ohne Foto, Name, Alter) reduzieren nachweislich Diskriminierung im Auswahlprozess.', NULL, 'Recruiting'),
('truefalse', 'Lücken im Lebenslauf', 'Lücken im Lebenslauf sind ein verlässlicher Indikator für mangelnde Motivation.', NULL, 'Recruiting'),
('truefalse', 'Strukturierte Interviews', 'Strukturierte Interviews mit standardisierten Fragen führen zu valideren Auswahlentscheidungen als freie Gespräche.', NULL, 'Recruiting'),
('truefalse', 'Diverse Teams', 'Diverse Teams sind in Studien im Schnitt innovativer und treffen bessere Entscheidungen.', NULL, 'Diversity'),
('truefalse', 'Kulturelle Passung', 'Der Fokus auf „Cultural Fit" ist ein neutrales, objektives Auswahlkriterium.', NULL, 'Recruiting'),

('action', 'Der Lebenslauf', 'Zwei nahezu identische Lebensläufe gehen ein – einer mit dem Namen „Lukas Müller", einer mit „Aishe Yılmaz". Lukas wird zum Gespräch eingeladen, Aishe nicht. Wie reagiert ihr im Team?', NULL, 'Szenario'),
('action', 'Das Bewerbungsgespräch', 'Eine Kollegin fragt eine Bewerberin: „Planen Sie in den nächsten Jahren Kinder?" Was tut ihr in dieser Situation – im Moment und danach?', NULL, 'Szenario'),
('action', 'Die Empfehlung', 'Euer Team rekrutiert hauptsächlich über persönliche Empfehlungen. Welche Effekte hat das auf Diversität – und welche Alternativen gibt es?', NULL, 'Szenario'),
('action', 'Der Akzent', 'Ein Kandidat spricht Deutsch mit starkem Akzent. Eine Kollegin sagt im Debrief: „Im Kundenkontakt schwierig." Wie geht ihr damit um?', NULL, 'Szenario'),
('action', 'Die Quote', 'Geschäftsleitung schlägt eine 50%-Frauenquote im Recruiting vor. Welche Argumente dafür und dagegen hört ihr im eigenen Umfeld – und wie steht ihr dazu?', NULL, 'Szenario');

INSERT INTO public.cards (type, title, content, correct_answer, explanation, category) VALUES
('truefalse', 'Anonyme Bewerbungen', 'Anonyme Bewerbungen (ohne Foto, Name, Alter) reduzieren nachweislich Diskriminierung im Auswahlprozess.', true, 'Studien (u.a. der Antidiskriminierungsstelle des Bundes) zeigen, dass anonyme Bewerbungsverfahren die Chancen von Menschen mit Migrationshintergrund und Frauen messbar erhöhen.', 'Recruiting')
ON CONFLICT DO NOTHING;

-- Update T/F cards with answers (since we couldn't combine above easily)
UPDATE public.cards SET correct_answer = true,  explanation = 'Studien (u.a. der Antidiskriminierungsstelle des Bundes) zeigen, dass anonyme Bewerbungsverfahren die Chancen marginalisierter Gruppen messbar erhöhen.' WHERE type='truefalse' AND title='Anonyme Bewerbungen' AND correct_answer IS NULL;
UPDATE public.cards SET correct_answer = false, explanation = 'Lücken haben viele Gründe (Care-Arbeit, Krankheit, Weiterbildung, Sabbatical). Sie pauschal negativ zu deuten ist selbst ein Bias.' WHERE type='truefalse' AND title='Lücken im Lebenslauf' AND correct_answer IS NULL;
UPDATE public.cards SET correct_answer = true,  explanation = 'Strukturierte Interviews haben in der Eignungsdiagnostik deutlich höhere Validität als unstrukturierte Gespräche.' WHERE type='truefalse' AND title='Strukturierte Interviews' AND correct_answer IS NULL;
UPDATE public.cards SET correct_answer = true,  explanation = 'Meta-Analysen (u.a. McKinsey, BCG) zeigen positive Zusammenhänge zwischen Diversität und Innovations- bzw. Finanzkennzahlen – Voraussetzung ist eine inklusive Kultur.' WHERE type='truefalse' AND title='Diverse Teams' AND correct_answer IS NULL;
UPDATE public.cards SET correct_answer = false, explanation = '„Cultural Fit" ist oft ein Einfallstor für Affinity Bias. Besser ist „Culture Add": Was bringt diese Person neu mit?' WHERE type='truefalse' AND title='Kulturelle Passung' AND correct_answer IS NULL;

-- Delete the duplicate "Anonyme Bewerbungen" we inserted twice
DELETE FROM public.cards a USING public.cards b
WHERE a.id > b.id AND a.title = b.title AND a.type = b.type;
