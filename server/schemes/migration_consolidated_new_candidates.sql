-- ============================================================
-- Konsolidierte Migration: Ersetzt alle Original-Kandidaten durch
-- die 6 neuen Bewerber:innen mit Video (2 pro Runde).
-- Für die Railway-Produktions-Instanz (init.sql wird dort nicht
-- re-executed). Idempotent und sicher mehrfach ausführbar.
--
-- Endzustand:
--   Runde 1: Vernon Hartmann, Kevin Schneider
--   Runde 2: Ahmed Aslan, Leila Yildrim
--   Runde 3: Noor Al Mansur, Emily Fischer
-- ============================================================

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Runde 1 / Position 1: Vernon Hartmann (Halo-Effekt)
UPDATE candidates SET
  name = 'Vernon Hartmann',
  age = 42,
  pronouns = 'er/ihm',
  video_url = 'https://www.youtube.com/watch?v=zvamSwIaOvY',
  headline = 'Master in Robotik, 18 Jahre Medizintechnik – Bewerbung als Team Lead',
  description = 'Geboren in Spanien, Master in Robotik von der Universität Barcelona. Bringt 18 Jahre Erfahrung in der Medizintechnik mit, speziell in Entwicklung und Implementierung chirurgischer Roboter. Nachhaltigkeit liegt ihm am Herzen: Er nutzt das Fahrrad als Hauptfortbewegungsmittel und integriert umweltbewusste Ansätze in seine Arbeit. Als passionierter Marathonläufer bringt er Ausdauer, Zielstrebigkeit und Teamgeist mit – Eigenschaften, die er gerne in die Rolle des Team Leads einbringen möchte.',
  qualifications = '• Master Robotik, Universität Barcelona' || chr(10) || '• 18 Jahre Medizintechnik – chirurgische Robotik' || chr(10) || '• Nachhaltiger Lebensstil (Fahrrad als Hauptverkehrsmittel)' || chr(10) || '• Marathonläufer',
  appeals_to_bias_id = (SELECT id FROM biases WHERE slug = 'halo'),
  image_url = NULL
WHERE round_number = 1 AND position = 1;

-- Runde 1 / Position 2: Kevin Schneider (Attributionsfehler)
UPDATE candidates SET
  name = 'Kevin Schneider',
  age = 32,
  pronouns = 'er/ihm',
  video_url = 'https://www.youtube.com/watch?v=8oouPOr1LI4',
  headline = 'Mechatroniker, 12 Jahre Wartung von Robotersystemen bei Bosch',
  description = 'Ausbildung zum Mechatroniker bei der IHK Berlin. Seit 12 Jahren arbeitet er in der Wartung und Instandhaltung von Robotersystemen bei Bosch. Seine Erfahrung hat ihm gezeigt, wie wichtig barrierefreie und innovative Technologien sind. Als Rollstuhlnutzer engagiert er sich aktiv für Barrierefreiheit in der Technikbranche und betreibt einen Technikblog, um seine Ideen und Lösungen mit der Welt zu teilen. Zusätzlich ist er leidenschaftlicher Gamer und Streamer, was seine Fähigkeit zur Problemlösung und Kreativität fördert.',
  qualifications = '• Ausbildung Mechatroniker, IHK Berlin' || chr(10) || '• 12 Jahre Wartung & Instandhaltung Robotersysteme bei Bosch' || chr(10) || '• Engagement für Barrierefreiheit, eigener Technikblog' || chr(10) || '• Gamer & Streamer',
  appeals_to_bias_id = (SELECT id FROM biases WHERE slug = 'attribution'),
  image_url = NULL
WHERE round_number = 1 AND position = 2;

-- Runde 2 / Position 1: entfernt (Jonas Weber, wird durch Ahmed Aslan ersetzt).
-- name-Filter macht dies idempotent, falls Ahmed Aslan durch einen
-- vorherigen Lauf bereits hier sitzt.
DELETE FROM candidates WHERE round_number = 2 AND position = 1 AND name <> 'Ahmed Aslan';

-- Runde 1 / Position 3 -> wandert zu Runde 2 / Position 1: Ahmed Aslan (Halo-Effekt)
UPDATE candidates SET
  round_number = 2,
  position = 1,
  name = 'Ahmed Aslan',
  age = 36,
  pronouns = 'er/ihm',
  video_url = 'https://www.youtube.com/watch?v=LXOm8Fk75pY',
  headline = 'Senior Consultant, Master Mechatronik RWTH Aachen',
  description = 'Master in Mechatronik von der RWTH Aachen. In den letzten 9 Jahren umfassende Erfahrung in der Entwicklung und Implementierung von Robotiksystemen gesammelt, zuletzt als Senior Consultant. Als Teamplayer mit internationalem Hintergrund spricht er fünf Sprachen fließend und bringt kulturelle Sensibilität sowie strategisches Denken in jedes Projekt ein. In seiner Freizeit schärft er seine Fähigkeiten durch Schach. Er ist überzeugt, dass seine langjährige Erfahrung und sein strategischer Ansatz eine wertvolle Basis für die Rolle des Team Leads in der Abteilung Robotik darstellen.',
  qualifications = '• Master Mechatronik, RWTH Aachen' || chr(10) || '• 9 Jahre Robotiksysteme – zuletzt Senior Consultant' || chr(10) || '• 5 Sprachen fließend' || chr(10) || '• Ambitionierter Schachspieler',
  appeals_to_bias_id = (SELECT id FROM biases WHERE slug = 'halo'),
  image_url = NULL
WHERE round_number = 1 AND position = 3;

-- Runde 2 / Position 2: Leila Yildrim (Ähnlichkeits-Bias)
UPDATE candidates SET
  name = 'Leila Yildrim',
  age = 40,
  pronouns = 'sie/ihr',
  video_url = 'https://www.youtube.com/watch?v=cPMQV2iI9AY',
  headline = 'Erfahrene Teamleiterin, Bachelor Maschinenbau Stuttgart',
  description = 'Bachelor in Maschinenbau von der Universität Stuttgart. 16 Jahre Erfahrung in Robotikdesign und Prototypenentwicklung, dabei erfolgreich Teams geleitet. Ihre Leidenschaft für Diversität und Inklusion hat sie inspiriert, Arbeitsumgebungen zu schaffen, in denen jede Stimme zählt – ihre beiden Kinder im Teenageralter unterstützen sie hierbei sehr. Als erfahrene Teamleiterin in der Technikbranche ist sie überzeugt, mit ihrer Expertise und ihrem Führungsstil die Abteilung Robotik erfolgreich weiterzuentwickeln.',
  qualifications = '• Bachelor Maschinenbau, Universität Stuttgart' || chr(10) || '• 16 Jahre Robotikdesign & Prototypenentwicklung' || chr(10) || '• Erfahrene Teamleiterin' || chr(10) || '• Engagement für Diversität & Inklusion',
  appeals_to_bias_id = (SELECT id FROM biases WHERE slug = 'similarity'),
  image_url = NULL
WHERE round_number = 2 AND position = 2;

-- Runde 2 / Position 3: entfernt (Tim Hoffmann, kein Ersatz)
DELETE FROM candidates WHERE round_number = 2 AND position = 3;

-- Runde 3 / Position 1: Noor Al Mansur (Halo-Effekt)
UPDATE candidates SET
  name = 'Noor Al Mansur',
  age = 31,
  pronouns = 'sie/ihr',
  video_url = 'https://www.youtube.com/watch?v=F-JMzSPf6BM',
  headline = 'Master Computer Engineering, führend in ML für Robotik bei KPMG',
  description = 'Master in Computer Engineering von der Universität München. Seit 6 Jahren Softwareentwicklerin für Systeme in der Robotik bei KPMG, mit besonderem Fokus auf Machine Learning. Trotz einer leichten Behinderung hat sie es geschafft, in ihrem Bereich führend zu werden. Ihre Stärke liegt in der Entwicklung innovativer Lösungen sowie in der effektiven Zusammenarbeit mit Teams. Sie sieht die Rolle des Team Leads als Möglichkeit, ihre technische Expertise und ihren Führungsansatz in der Robotik weiter auszubauen.',
  qualifications = '• Master Computer Engineering, Universität München' || chr(10) || '• 6 Jahre Softwareentwicklung Robotik bei KPMG' || chr(10) || '• Fokus Machine Learning' || chr(10) || '• Führend in ihrem Fachbereich',
  appeals_to_bias_id = (SELECT id FROM biases WHERE slug = 'halo'),
  image_url = NULL
WHERE round_number = 3 AND position = 1;

-- Runde 3 / Position 2: entfernt (Johannes Berg, kein Ersatz)
DELETE FROM candidates WHERE round_number = 3 AND position = 2;

-- Runde 3 / Position 3: Emily Fischer (neutral)
UPDATE candidates SET
  name = 'Emily Fischer',
  age = 28,
  pronouns = 'sie/ihr',
  video_url = 'https://www.youtube.com/watch?v=4t4_PiYWaJU',
  headline = 'Autodidaktische Programmiererin, Mutter eines kleinen Sohnes',
  description = 'Mutter eines kleinen Sohnes. Als autodidaktische Programmiererin hat sie sich tiefgehende Kenntnisse in KI und Programmierung angeeignet und in den letzten drei Jahren freiberuflich innovative Robotic-Apps entwickelt. Zusätzlich organisiert sie Workshops, um Frauen den Einstieg in die Technikbranche zu erleichtern – dadurch hat sie gelernt, wie man Teams motiviert und unterschiedliche Perspektiven integriert. Als Yogalehrerin hat sie ein starkes Bewusstsein für Balance und Struktur, was sie gerne in die Rolle des Team Leads einbringen würde, um ein kreatives und produktives Arbeitsumfeld zu schaffen.',
  qualifications = '• Autodidaktische Kenntnisse in KI & Programmierung' || chr(10) || '• 3 Jahre freiberufliche Entwicklung von Robotic-Apps' || chr(10) || '• Organisatorin von Tech-Workshops für Frauen' || chr(10) || '• Zertifizierte Yogalehrerin',
  appeals_to_bias_id = NULL,
  image_url = NULL
WHERE round_number = 3 AND position = 3;
