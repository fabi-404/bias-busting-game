-- Migration: Remove DB-generated tokens (now handled by JWTs)
ALTER TABLE game_sessions DROP COLUMN IF EXISTS host_token;
ALTER TABLE session_players DROP COLUMN IF EXISTS player_token;
