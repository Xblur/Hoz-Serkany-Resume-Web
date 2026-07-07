-- AI-generated daily story facts (public read, service-role writes via CI)
create table if not exists public.story_facts (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  label text not null,
  body text not null,
  source_title text,
  source_url text,
  provider text,
  model text,
  generated_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists story_facts_entry_date_idx
  on public.story_facts (entry_date desc);

create unique index if not exists story_facts_dedupe_idx
  on public.story_facts (entry_date, coalesce(source_url, left(body, 80)));

alter table public.story_facts enable row level security;

drop policy if exists "Public read story facts" on public.story_facts;
create policy "Public read story facts"
  on public.story_facts for select
  to anon, authenticated using (true);
