ALTER TABLE public.game_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.session_players REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_players;