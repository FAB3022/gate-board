-- Run once in the Supabase SQL editor (Project > SQL Editor > New query > paste > Run).
-- Safe to run again: it only adds what is missing.

-- Task statuses (one row per task that someone has touched).
create table if not exists public.launch_status (
  item_id    text primary key,
  market     text not null check (market in ('CA', 'US')),
  status     text not null check (status in ('not_started', 'in_progress', 'done', 'blocked', 'na')),
  note       text not null default '' check (char_length(note) <= 1000),
  updated_at timestamptz not null default now()
);
alter table public.launch_status drop constraint if exists launch_status_item_id_check;
alter table public.launch_status add constraint launch_status_item_id_check
  check (item_id ~ '^(CA|US)-(PRE|POST)-[0-9]{3}$' or item_id ~ '^(CA|US)-NEW-[a-z0-9]{6}$');
alter table public.launch_status drop constraint if exists launch_status_note_check;
alter table public.launch_status add constraint launch_status_note_check check (char_length(note) <= 1000);

-- Tasks added in the dashboard. Removing a task sets "removed" in its data; rows are never deleted.
create table if not exists public.launch_items (
  id         text primary key check (id ~ '^(CA|US)-NEW-[a-z0-9]{6}$'),
  market     text not null check (market in ('CA', 'US')),
  data       jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 8000),
  updated_at timestamptz not null default now()
);

alter table public.launch_status enable row level security;
alter table public.launch_items enable row level security;

-- Anyone with the dashboard link can read and change statuses and added tasks. Deleting rows is not allowed.
drop policy if exists "read statuses" on public.launch_status;
create policy "read statuses" on public.launch_status for select to anon, authenticated using (true);
drop policy if exists "add statuses" on public.launch_status;
create policy "add statuses" on public.launch_status for insert to anon, authenticated with check (true);
drop policy if exists "change statuses" on public.launch_status;
create policy "change statuses" on public.launch_status for update to anon, authenticated using (true) with check (true);

drop policy if exists "read items" on public.launch_items;
create policy "read items" on public.launch_items for select to anon, authenticated using (true);
drop policy if exists "add items" on public.launch_items;
create policy "add items" on public.launch_items for insert to anon, authenticated with check (true);
drop policy if exists "change items" on public.launch_items;
create policy "change items" on public.launch_items for update to anon, authenticated using (true) with check (true);

-- Push changes to every open dashboard in real time.
do $$
declare t text;
begin
  foreach t in array array['launch_status', 'launch_items'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
