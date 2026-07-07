-- ============================================================
-- Migration: Objektiv richtige Kandidat:innen pro Runde markieren
-- (appeals_to_bias_id = NULL = kein Bias-Köder, fachlich beste Wahl)
--
-- Runde 1: Vernon Hartmann statt Halo-Effekt
-- Runde 2: Ahmed Aslan statt Halo-Effekt
-- Runde 3: Emily Fischer war bereits NULL (unverändert)
-- ============================================================

UPDATE candidates SET appeals_to_bias_id = NULL
WHERE round_number = 1 AND name = 'Vernon Hartmann';

UPDATE candidates SET appeals_to_bias_id = NULL
WHERE round_number = 2 AND name = 'Ahmed Aslan';
