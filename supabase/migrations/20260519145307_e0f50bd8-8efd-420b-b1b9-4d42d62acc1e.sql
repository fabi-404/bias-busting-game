create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  player_id uuid not null,
  player_name text not null,
  phase text not null,
  round_number integer not null default 0,
  message text not null,
  created_at timestamptz not null default now()
);

create index chat_messages_session_idx on public.chat_messages(session_id, created_at);

alter table public.chat_messages enable row level security;

create policy "open read" on public.chat_messages for select using (true);
create policy "open write" on public.chat_messages for all using (true) with check (true);

alter publication supabase_realtime add table public.chat_messages;