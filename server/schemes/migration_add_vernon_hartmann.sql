-- ============================================================
-- Migration: Kandidat "Vernon Hartmann" (Halo-Effekt, Runde 1)
-- Für laufende Railway-Instanz (init.sql wird nicht re-executed)
-- Idempotent: fügt video_url-Spalte hinzu und ersetzt den Kandidaten in
-- Runde 1 / Position 1 per UPDATE (statt DELETE+INSERT), damit bestehende
-- Fremdschlüssel-Referenzen (z.B. candidate_prevotes aus alten Sessions)
-- erhalten bleiben.
-- ============================================================

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS video_url TEXT;

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
