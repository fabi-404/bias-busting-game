-- ============================================================
-- Migration: Kandidatin "Leila Yildrim" (Ähnlichkeits-Bias, Runde 2)
-- Für laufende Railway-Instanz (init.sql wird nicht re-executed)
-- Idempotent: ersetzt die Kandidatin in Runde 2 / Position 2 per UPDATE
-- (statt DELETE+INSERT), damit bestehende Fremdschlüssel-Referenzen
-- (z.B. candidate_prevotes aus alten Sessions) erhalten bleiben.
-- ============================================================

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
