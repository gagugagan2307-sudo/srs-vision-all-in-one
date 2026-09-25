-- SRS Vision realtime database setup for the no-login website.
-- Run this entire file in the Supabase SQL Editor for the project used by supabase-config.js.
-- This version is designed for Supabase Anonymous Sign-Ins.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default 'SRS Vision Team',
  role text not null default 'admin' check (role = 'admin'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.profiles(id,email,full_name,role,is_active)
  values(
    new.id,
    coalesce(new.email,''),
    coalesce(new.raw_user_meta_data->>'full_name','SRS Vision Team'),
    'admin',
    true
  )
  on conflict(id) do update set
    email=excluded.email,
    full_name=excluded.full_name,
    updated_at=now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create table if not exists public.threefs_state (
  id bigint primary key check (id=1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.threefs_state(id,data)
values (1,'{}'::jsonb)
on conflict (id) do nothing;

alter table public.threefs_state enable row level security;
alter table public.threefs_state replica identity full;

-- Supabase anonymous users use the authenticated Postgres role and carry
-- the is_anonymous JWT claim. These policies allow only anonymous sessions.
drop policy if exists "srs anonymous read" on public.threefs_state;
drop policy if exists "srs anonymous insert" on public.threefs_state;
drop policy if exists "srs anonymous update" on public.threefs_state;

grant select, insert, update on public.threefs_state to authenticated;

create policy "srs anonymous read"
on public.threefs_state
for select to authenticated
using (id=1 and coalesce((auth.jwt()->>'is_anonymous')::boolean,false));

create policy "srs anonymous insert"
on public.threefs_state
for insert to authenticated
with check (id=1 and coalesce((auth.jwt()->>'is_anonymous')::boolean,false));

create policy "srs anonymous update"
on public.threefs_state
for update to authenticated
using (id=1 and coalesce((auth.jwt()->>'is_anonymous')::boolean,false))
with check (id=1 and coalesce((auth.jwt()->>'is_anonymous')::boolean,false));

-- Atomic merge RPC used by the website so one device cannot accidentally
-- replace another device's unrelated top-level data.
create or replace function public.threefs_merge_state(p_patch jsonb)
returns public.threefs_state
language plpgsql
security definer
set search_path=public
as $$
declare
  v_row public.threefs_state;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not coalesce((auth.jwt()->>'is_anonymous')::boolean,false) then
    raise exception 'Anonymous session required';
  end if;

  insert into public.threefs_state(id,data,updated_at,updated_by)
  values (1,coalesce(p_patch,'{}'::jsonb),now(),auth.uid())
  on conflict (id) do update
    set data=public.threefs_state.data || excluded.data,
        updated_at=now(),
        updated_by=auth.uid()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.threefs_merge_state(jsonb) from public;
grant execute on function public.threefs_merge_state(jsonb) to authenticated;

-- Realtime / Postgres Changes publication.
do $$
begin
  alter publication supabase_realtime add table public.threefs_state;
exception
  when duplicate_object then null;
  when undefined_object then
    raise exception 'Supabase realtime publication is unavailable. Enable Realtime for the project, then run this SQL again.';
end $$;

-- Helpful indexes.
create index if not exists idx_threefs_state_updated_by
  on public.threefs_state(updated_by);

-- Keep helper functions private.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
