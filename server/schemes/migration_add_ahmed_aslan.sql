-- ============================================================
-- Migration: Kandidat "Ahmed Aslan" (Halo-Effekt, Runde 1)
-- Für laufende Railway-Instanz (init.sql wird nicht re-executed)
-- Idempotent: ersetzt den Kandidaten in Runde 1 / Position 3 per UPDATE
-- (statt DELETE+INSERT), damit bestehende Fremdschlüssel-Referenzen
-- (z.B. candidate_prevotes aus alten Sessions) erhalten bleiben.
-- ============================================================

UPDATE candidates SET
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
