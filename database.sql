-- SRS Vision internal shared state for Supabase
create table if not exists public.srs_state (
  id bigint primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.srs_state enable row level security;
drop policy if exists "srs authenticated read" on public.srs_state;
drop policy if exists "srs authenticated insert" on public.srs_state;
drop policy if exists "srs authenticated update" on public.srs_state;
create policy "srs authenticated read" on public.srs_state for select to authenticated using (id=1);
create policy "srs authenticated insert" on public.srs_state for insert to authenticated with check (id=1);
create policy "srs authenticated update" on public.srs_state for update to authenticated using (id=1) with check (id=1);

alter table public.srs_state replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.srs_state;
exception when duplicate_object then null;
end $$;
