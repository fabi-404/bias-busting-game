-- ============================================================
-- Migration: Kandidatin "Emily Fischer" (neutral, Runde 3)
-- Für laufende Railway-Instanz (init.sql wird nicht re-executed)
-- Idempotent: ersetzt die Kandidatin in Runde 3 / Position 3 per UPDATE
-- (statt DELETE+INSERT), damit bestehende Fremdschlüssel-Referenzen
-- (z.B. candidate_prevotes aus alten Sessions) erhalten bleiben.
-- ============================================================

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
