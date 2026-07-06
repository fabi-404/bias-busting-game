-- ============================================================
-- Migration: Kandidat "Kevin Schneider" (Attributionsfehler, Runde 1)
-- Für laufende Railway-Instanz (init.sql wird nicht re-executed)
-- Idempotent: ersetzt den Kandidaten in Runde 1 / Position 2 per UPDATE
-- (statt DELETE+INSERT), damit bestehende Fremdschlüssel-Referenzen
-- (z.B. candidate_prevotes aus alten Sessions) erhalten bleiben.
-- ============================================================

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
