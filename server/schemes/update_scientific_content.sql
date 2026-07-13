-- ============================================================
-- Migration: Wissenschaftliche Fundierung der Spielinhalte
-- Für laufende Railway-Instanz (init.sql wird nicht re-executed)
-- Alle 14 Statements sind idempotent – mehrfaches Ausführen sicher.
-- ============================================================

-- ============================================================
-- 1. BIASES — knowledge_card_text, self_recognition, sources
-- ============================================================

UPDATE biases SET
  knowledge_card_text = $$Der Halo-Effekt (Thorndike, 1920) beschreibt die kognitive Verzerrung, aus einem einzigen auffälligen Merkmal – einem Prestige-Studium, physischer Attraktivität oder souveränem Auftreten – pauschale Schlüsse auf davon unabhängige Eigenschaften wie Fachkompetenz oder Teamfähigkeit zu ziehen. Thorndike (1920) wies nach, dass Vorgesetzte militärische Untergebene in scheinbar unabhängigen Dimensionen (z.B. Intelligenz und Körperpflege) mit unerwartet hoher Korrelation beurteilten. Nisbett & Wilson (1977) zeigten experimentell, dass eine sympathische Ausstrahlung die Bewertung von Akzent und Äußerem verbessert – ohne dass Beurteilende sich dieser Verschiebung bewusst waren. Im Einstellungskontext ist der Effekt besonders ausgeprägt: Eine Metaanalyse von Hosoda, Stone-Romero & Coats (2003) belegt, dass körperliche Attraktivität bis zu 20 % der Varianz in Einstellungsentscheidungen erklären kann – auch bei konstant gehaltener Qualifikation.$$,
  self_recognition    = $$Bewerte Kandidat:innen zunächst dimensionsweise – Fachkompetenz, Kommunikation, Führungspotenzial getrennt – bevor du ein Gesamturteil bildest. Balzer & Sulsky (1992) zeigten, dass diese Methode der getrennten Dimensionsbewertung den Halo-Effekt bei Leistungsbeurteilungen nachweislich reduziert. Frage dich konkret: Welchen eigenständigen Beleg habe ich für jede dieser Eigenschaften – unabhängig von meinem Gesamteindruck dieser Person?$$,
  source_label        = $$Thorndike (1920) · Nisbett & Wilson (1977) · Hosoda et al. (2003, Personnel Psychology)$$,
  source_url          = 'https://doi.org/10.1111/j.1744-6570.2003.tb00157.x'
WHERE slug = 'halo';

UPDATE biases SET
  knowledge_card_text = $$Der Bestätigungsfehler (Wason, 1960; Nickerson, 1998) bezeichnet die Neigung, Informationen so zu suchen, zu deuten und zu erinnern, dass sie bestehende Überzeugungen bestätigen. Wason (1960) demonstrierte dies mit dem „2-4-6-Task": Versuchspersonen sollten eine Zahlenregel entdecken, testeten aber systematisch nur bestätigende – nie widerlegende – Hypothesen. Im Recruiting zeigt sich der Effekt besonders in der Gesprächsführung: Snyder & Swann (1978) belegten experimentell, dass Interviewer:innen gezielt Fragen stellen, die eine Ausgangshypothese bestätigen (z.B. „Introvertiert") – und damit das Ergebnis unabhängig vom Wahrheitsgehalt ihrer Annahme verzerren. Nickerson (1998) fasst in seiner Übersichtsarbeit zusammen: Bestätigungssuche ist eines der robustesten und ubiquitärsten Muster menschlichen Urteilens.$$,
  self_recognition    = $$Formuliere aktiv die Gegenannahme: „Was würde ich von dieser Person erwarten zu sehen, wenn mein erster Eindruck falsch wäre?" Larrick (2004) identifiziert das explizite Suchen nach gegenläufiger Evidenz als wirksamste Einzelmaßnahme gegen Bestätigungsfehler. Konkret: Bitte jemanden im Team, gezielt Argumente gegen deinen Favoriten zu sammeln – die sogenannte „Devil's Advocate"-Rolle.$$,
  source_label        = $$Wason (1960, Quarterly Journal of Experimental Psychology) · Snyder & Swann (1978) · Nickerson (1998, Review of General Psychology)$$,
  source_url          = 'https://doi.org/10.1037/1089-2680.2.2.175'
WHERE slug = 'confirmation';

UPDATE biases SET
  knowledge_card_text = $$Der Similar-to-me-Bias (Byrne, 1971) bezeichnet die Tendenz, Personen zu bevorzugen, die uns in Hintergrund, Werten, Interessen oder Sprache ähneln. Byrnes Similarity-Attraction-Paradigma belegt: Je mehr gemeinsame Einstellungen, desto höher die interpersonale Anziehung – ein kulturübergreifend robuster Effekt. Im Recruiting hat Rivera (2012) in einer ethnografischen Studie bei drei Elite-Beratungsfirmen gezeigt, dass „Cultural Fit" in der Praxis häufig mit Lifestyle-Ähnlichkeit gleichgesetzt wird: Gemeinsame Hobbys, Sportarten und Freizeitaktivitäten schlugen Qualifikation und Leistungspotenzial in der finalen Kandidatenwahl. Turban & Jones (1988) konnten zeigen, dass Vorgesetzte ähnlichen Untergebenen systematisch bessere Bewertungen gaben – selbst bei kontrollierter objektiver Leistung.$$,
  self_recognition    = $$Trenne explizit zwischen „Ich mag diese Person" und „Diese Person ist für die Stelle qualifiziert". Der entscheidende Test: Würde eine Person mit anderem Hintergrund, anderen Hobbys oder einer anderen Hochschule, aber identischer Qualifikation genauso bewertet werden? Diverse Auswahlgremien sind laut Bohnet (2016, „What Works: Gender Equality by Design") die nachweislich wirksamste strukturelle Maßnahme gegen Ähnlichkeitsbias – weil unterschiedliche Perspektiven individuelle Sympathien ausgleichen.$$,
  source_label        = $$Byrne (1971, The Attraction Paradigm) · Rivera (2012, American Sociological Review) · Turban & Jones (1988, Journal of Applied Psychology)$$,
  source_url          = 'https://doi.org/10.1177/0003122412463213'
WHERE slug = 'similarity';

UPDATE biases SET
  knowledge_card_text = $$Der fundamentale Attributionsfehler (Ross, 1977) beschreibt die Tendenz, das Verhalten anderer Personen übermäßig auf stabile Charaktereigenschaften zurückzuführen und situative Erklärungen zu unterschätzen – während wir bei uns selbst Situationsfaktoren viel stärker berücksichtigen. Jones & Harris (1967) zeigten in einer Klassiker-Studie: Selbst wenn Versuchspersonen wussten, dass jemand eine politische Position aus Pflicht vortrug (nicht aus Überzeugung), schrieben sie ihm diese Ansicht als persönliche Meinung zu. Im Recruiting bedeutet das: Eine Lücke im Lebenslauf wird rasch als Zeichen mangelnder Motivation gewertet. Weisshaar (2018) belegt in einer Audit-Studie, dass Eltern nach familienbedingter Erwerbspause signifikant weniger Rückrufe erhielten als vergleichbare Kandidat:innen – ein Effekt, der sich nicht durch objektive Qualifikationsunterschiede erklären lässt.$$,
  self_recognition    = $$Hinterfrage jede Charakterschlussfolgerung aktiv: „Welche situativen Faktoren könnten dieses Verhalten erklären, ohne dass es etwas über den Charakter dieser Person aussagt?" Levashina & Campion (2007) empfehlen behaviorale Interviewfragen mit explizitem Kontext: „Beschreiben Sie eine Situation, in der X passiert ist – welche Rahmenbedingungen lagen vor?" Dieser Ansatz zwingt Interviewer:innen, Situationsfaktoren aktiv zu erfassen, statt direkt auf Persönlichkeit zu schließen.$$,
  source_label        = $$Ross (1977, Advances in Experimental Social Psychology) · Jones & Harris (1967, Journal of Experimental Social Psychology) · Weisshaar (2018, American Sociological Review)$$,
  source_url          = 'https://doi.org/10.1177/0003122417752355'
WHERE slug = 'attribution';

-- ============================================================
-- 2. BIAS_QUESTIONS — explanation by slug + position
-- ============================================================

-- Halo Q3: Strukturierte Interviews reduzieren den Halo-Effekt
UPDATE bias_questions SET
  explanation = $$Eine Metaanalyse von Huffcutt & Arthur (1994, Journal of Applied Psychology) belegt: Strukturierte Interviews erhöhen die Vorhersagevalidität für Jobperformance von r ≈ .20 (unstrukturiert) auf r ≈ .51 (strukturiert) – und reduzieren Halo-Effekte, weil jede Kompetenz isoliert und kriterienbasiert bewertet wird.$$
WHERE bias_id = (SELECT id FROM biases WHERE slug = 'halo')
  AND position = 3;

-- Confirmation Q3: Erster Eindruck schwer revidierbar
UPDATE bias_questions SET
  explanation = $$Ambady & Rosenthal (1992) zeigten in ihrer „Thin-Slices"-Forschung, dass 30-Sekunden-Eindrücke von Lehrenden die Semesterbewertungen durch Studierende vorhersagen. Parsons et al. (2011) bestätigten im Interviewkontext: Eindrücke aus den ersten Minuten korrelieren stark mit dem Gesamturteil – spätere Informationen werden systematisch weniger gewichtet.$$
WHERE bias_id = (SELECT id FROM biases WHERE slug = 'confirmation')
  AND position = 3;

-- Similarity Q1: Cultural Fit ist kein Schutz vor Ähnlichkeitsbias
UPDATE bias_questions SET
  explanation = $$Rivera (2012) zeigte in einer ethnografischen Studie bei drei Top-Beratungsfirmen: In der Praxis bedeutete „Cultural Fit" vor allem geteilte Freizeitinteressen und Lifestyle – Tennis, Skifahren, Schulzugehörigkeit – und nicht gemeinsame Arbeitswerte oder -methoden. Damit wird „Fit" zum direkten Verstärker des Ähnlichkeitsbias.$$
WHERE bias_id = (SELECT id FROM biases WHERE slug = 'similarity')
  AND position = 1;

-- Attribution Q1: Verhalten wird Persönlichkeit statt Umständen zugeschrieben
UPDATE bias_questions SET
  explanation = $$Jones & Harris (1967) belegten dies mit dem sogenannten Koerzions-Experiment: Versuchspersonen lasen Aufsätze mit einer politischen Position und schätzten ein, ob der Autor diese Meinung wirklich vertrat – selbst wenn ihnen gesagt wurde, die Position sei zufällig zugewiesen worden, schrieben sie sie dem Charakter des Autors zu.$$
WHERE bias_id = (SELECT id FROM biases WHERE slug = 'attribution')
  AND position = 1;

-- Attribution Q2: CV-Lücke ist kein verlässlicher Indikator für mangelnde Motivation
UPDATE bias_questions SET
  explanation = $$Weisshaar (2018) führte eine Audit-Studie mit fiktiven, qualifikationsgleichen Lebensläufen durch: Eltern mit familienbedingter Erwerbslücke erhielten signifikant weniger Rückrufe als Kandidat:innen ohne Lücke – ein Effekt, der sich nicht durch objektive Qualifikationsunterschiede erklären lässt und direkter Ausdruck des Attributionsfehlers ist.$$
WHERE bias_id = (SELECT id FROM biases WHERE slug = 'attribution')
  AND position = 2;

-- ============================================================
-- 3. CARDS — explanation für Action-Karten (bisher alle NULL)
-- ============================================================

UPDATE cards SET
  explanation = $$Bertrand & Mullainathan (2004, American Economic Review) versandten in einer Feldstudie identische Lebensläufe mit typisch weißen und typisch afroamerikanischen Namen – weiß klingende Namen erhielten 50 % mehr Rückrufe. Kaas & Manger (2012) belegen vergleichbare Effekte für türkisch klingende Namen in Deutschland bei ansonsten identischen Bewerbungsunterlagen.$$
WHERE title = 'Der Lebenslauf' AND type = 'action';

UPDATE cards SET
  explanation = $$Fragen zur Familienplanung sind in Deutschland nach § 1 AGG (Allgemeines Gleichbehandlungsgesetz) unzulässig – auch in indirekter Form. Correll, Benard & Paik (2007) belegen die sogenannte „Mutterschaftsstrafe": Mütter wurden bei identischen Qualifikationen als weniger kompetent und weniger engagiert eingeschätzt als kinderlose Frauen – und häufiger abgelehnt.$$
WHERE title = 'Das Bewerbungsgespräch' AND type = 'action';

UPDATE cards SET
  explanation = $$Netzwerkbasiertes Recruiting verstärkt bestehende Homogenität: Erickson & Petersen (2021) zeigen, dass Empfehlungen vor allem Kandidat:innen aus demselben sozialen Milieu einbringen und strukturelle Zugangshürden für Außenstehende erhöhen. Rivera (2016) beschreibt, wie informelle „Back-Channel"-Referenzen in Elite-Netzwerken gezielt genutzt werden und die Diversität weiter einschränken.$$
WHERE title = 'Die Empfehlung' AND type = 'action';

UPDATE cards SET
  explanation = $$Carlson & McHenry (2006) belegen, dass ein fremdsprachiger Akzent die Rückrufrate bei Bewerbungen reduziert – selbst wenn die sprachliche Verständlichkeit objektiv einwandfrei ist. Purkiss et al. (2006) zeigen zudem: Ein Akzent löst über den Halo-Effekt eine Verzerrung aus, bei der auch fachliche Kompetenzen schlechter bewertet werden – obwohl sie vom Akzent völlig unabhängig sind.$$
WHERE title = 'Der Akzent' AND type = 'action';

UPDATE cards SET
  explanation = $$Bohnet (2016, „What Works: Gender Equality by Design") zeigt, dass isolierte Quoten ohne begleitende strukturelle Maßnahmen häufig Backlash-Effekte auslösen und die Wahrnehmung begünstigen, Eingestellte seien nur wegen der Quote berücksichtigt worden. Wirksamere Alternativen: strukturierte, kriterienbasierte Bewertungsverfahren und die Entfernung von Namen und Fotos in der Erstauswahl (blinde Bewerbungsverfahren).$$
WHERE title = 'Die Quote' AND type = 'action';
