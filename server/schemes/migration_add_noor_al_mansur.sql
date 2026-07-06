-- ============================================================
-- Migration: Kandidatin "Noor Al Mansur" (Halo-Effekt, Runde 3)
-- Für laufende Railway-Instanz (init.sql wird nicht re-executed)
-- Idempotent: ersetzt die Kandidatin in Runde 3 / Position 1 per UPDATE
-- (statt DELETE+INSERT), damit bestehende Fremdschlüssel-Referenzen
-- (z.B. candidate_prevotes aus alten Sessions) erhalten bleiben.
-- ============================================================

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
