-- ============================================================
-- Migration: Entfernt die letzten verbliebenen Original-Kandidaten
-- (Jonas Weber, Tim Hoffmann – Runde 2, Position 1 & 3) ohne Ersatz.
-- Für laufende Railway-Instanz (init.sql wird nicht re-executed)
-- Keine bestehenden Fremdschlüssel-Referenzen (candidate_votes,
-- candidate_prevotes) für diese Kandidaten vorhanden – DELETE ist sicher.
-- Runde 2 besteht danach nur noch aus Leila Yildrim.
-- ============================================================

DELETE FROM candidates WHERE round_number = 2 AND position IN (1, 3);
