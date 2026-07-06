-- ============================================================
-- Migration: Jede Runde hat nur noch 2 Kandidat:innen statt 3.
-- Für laufende Railway-Instanz (init.sql wird nicht re-executed)
-- ============================================================

-- Ahmed Aslan wandert von Runde 1 / Position 3 nach Runde 2 / Position 1
-- (UPDATE statt DELETE+INSERT, damit seine bestehenden Votes/Prevotes
-- aus laufenden Sessions erhalten bleiben).
UPDATE candidates SET round_number = 2, position = 1
WHERE name = 'Ahmed Aslan' AND round_number = 1 AND position = 3;

-- Johannes Berg raus aus Runde 3 (keine bestehenden Referenzen).
DELETE FROM candidates WHERE name = 'Johannes Berg' AND round_number = 3 AND position = 2;
