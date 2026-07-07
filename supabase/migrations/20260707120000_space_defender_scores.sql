-- Space Defender global leaderboard
create table if not exists public.space_defender_scores (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 12),
  score integer not null check (score > 0),
  wave integer not null check (wave >= 1),
  device_id uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists space_defender_scores_rank_idx
  on public.space_defender_scores (score desc, wave desc, created_at asc);

alter table public.space_defender_scores enable row level security;

drop policy if exists "Public read scores" on public.space_defender_scores;
create policy "Public read scores"
  on public.space_defender_scores for select
  to anon, authenticated using (true);

drop policy if exists "Anon insert score" on public.space_defender_scores;
create policy "Anon insert score"
  on public.space_defender_scores for insert
  to anon with check (true);
