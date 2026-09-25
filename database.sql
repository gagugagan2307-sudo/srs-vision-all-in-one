-- SRS Vision shared database for the no-login/anonymous website.
-- Run this file in the Supabase SQL Editor.

create table if not exists public.srs_vision_state (
  id bigint primary key check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.srs_vision_state enable row level security;

revoke all on public.srs_vision_state from anon;
revoke all on public.srs_vision_state from authenticated;
grant select, insert, update on public.srs_vision_state to authenticated;

drop policy if exists "SRS Vision anonymous read" on public.srs_vision_state;
drop policy if exists "SRS Vision anonymous insert" on public.srs_vision_state;
drop policy if exists "SRS Vision anonymous update" on public.srs_vision_state;

create policy "SRS Vision anonymous read"
on public.srs_vision_state
as permissive
for select
to authenticated
using ((select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) and id = 1);

create policy "SRS Vision anonymous insert"
on public.srs_vision_state
as permissive
for insert
to authenticated
with check ((select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) and id = 1);

create policy "SRS Vision anonymous update"
on public.srs_vision_state
as permissive
for update
to authenticated
using ((select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) and id = 1)
with check ((select coalesce((auth.jwt()->>'is_anonymous')::boolean, false)) and id = 1);

create or replace function public.srs_vision_merge_state(p_patch jsonb)
returns public.srs_vision_state
language plpgsql
security definer
set search_path = public
as $$
declare v_row public.srs_vision_state;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;
  if not coalesce((auth.jwt()->>'is_anonymous')::boolean, false) then
    raise exception 'This public no-login workspace expects an anonymous Supabase session';
  end if;

  insert into public.srs_vision_state(id, data, updated_at, updated_by)
  values (1, coalesce(p_patch, '{}'::jsonb), now(), auth.uid())
  on conflict (id) do update
    set data = public.srs_vision_state.data || excluded.data,
        updated_at = now(),
        updated_by = auth.uid()
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.srs_vision_merge_state(jsonb) from public;
grant execute on function public.srs_vision_merge_state(jsonb) to authenticated;

alter table public.srs_vision_state replica identity full;
do $$
begin
  alter publication supabase_realtime add table public.srs_vision_state;
exception when duplicate_object then null;
end;
$$;

insert into public.srs_vision_state(id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;
