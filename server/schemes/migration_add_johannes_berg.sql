-- ============================================================
-- Migration: Kandidat "Johannes Berg" (Confirmation Bias, Runde 3)
-- Für laufende Railway-Instanz (init.sql wird nicht re-executed)
-- Idempotent: ersetzt den Kandidaten in Runde 3 / Position 2 per UPDATE
-- (statt DELETE+INSERT), damit bestehende Fremdschlüssel-Referenzen
-- (z.B. candidate_prevotes aus alten Sessions) erhalten bleiben.
-- ============================================================

UPDATE candidates SET
  name = 'Johannes Berg',
  age = 53,
  pronouns = 'er/ihm',
  video_url = 'https://www.youtube.com/watch?v=GdN8_dS16sY',
  headline = 'Abteilungsleiter Steuerungstechnik, „bewährtes Profil"',
  description = 'Verheiratet, Familienvater, 30 Jahre Erfahrung in der Steuerungstechnik. Hat als Abteilungsleiter umfangreiche Führungsqualitäten erworben und kombiniert technisches Wissen mit Sinn für Struktur und Organisation, um auch komplexe Projekte erfolgreich zu leiten. Als Träger eines Hörgeräts begegnet er Herausforderungen pragmatisch und findet Lösungen, die allen Teammitgliedern zugutekommen. In seiner Freizeit ist er Hobbyfotograf und leidenschaftlicher Koch – Kreativität und Präzision sind ihm auch außerhalb der Arbeit wichtig.',
  qualifications = '• 30 Jahre Erfahrung Steuerungstechnik' || chr(10) || '• Abteilungsleiter mit umfangreicher Führungserfahrung' || chr(10) || '• Strukturierte, organisierte Arbeitsweise' || chr(10) || '• Hobbyfotograf, leidenschaftlicher Koch',
  appeals_to_bias_id = (SELECT id FROM biases WHERE slug = 'confirmation'),
  image_url = NULL
WHERE round_number = 3 AND position = 2;
