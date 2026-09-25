-- Run once in the Supabase SQL editor (Project > SQL Editor > New query > paste > Run).
-- Safe to run again: it only adds or updates what is needed and keeps existing data.

-- Task statuses. Per-product tasks are stored as "<task id>:<product id>"; once-per-launch tasks as "<task id>".
create table if not exists public.launch_status (
  item_id    text primary key,
  market     text not null check (market in ('CA', 'US')),
  status     text not null check (status in ('not_started', 'in_progress', 'done', 'blocked', 'na')),
  note       text not null default '',
  updated_at timestamptz not null default now()
);
alter table public.launch_status drop constraint if exists launch_status_item_id_check;
alter table public.launch_status add constraint launch_status_item_id_check
  check (item_id ~ '^(CA|US)-((PRE|POST)-[0-9]{3}|NEW-[a-z0-9]{6})(:[a-z0-9]{6})?$');
alter table public.launch_status drop constraint if exists launch_status_note_check;
alter table public.launch_status add constraint launch_status_note_check check (char_length(note) <= 1000);

-- Tasks added in the dashboard. Removing one sets "removed" in its data; rows are never deleted.
create table if not exists public.launch_items (
  id         text primary key check (id ~ '^(CA|US)-NEW-[a-z0-9]{6}$'),
  market     text not null check (market in ('CA', 'US')),
  data       jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 8000),
  updated_at timestamptz not null default now()
);

-- Products in the launch. Removing one sets "removed" in its data; rows are never deleted.
create table if not exists public.launch_products (
  id         text primary key check (id ~ '^[a-z0-9]{6}$'),
  market     text not null check (market in ('CA', 'US')),
  data       jsonb not null check (jsonb_typeof(data) = 'object' and pg_column_size(data) < 8000),
  updated_at timestamptz not null default now()
);

-- Anyone with the dashboard link can read and change these tables. Deleting rows is not allowed.
do $$
declare t text;
begin
  foreach t in array array['launch_status', 'launch_items', 'launch_products'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "read" on public.%I', t);
    execute format('create policy "read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('drop policy if exists "add" on public.%I', t);
    execute format('create policy "add" on public.%I for insert to anon, authenticated with check (true)', t);
    execute format('drop policy if exists "change" on public.%I', t);
    execute format('create policy "change" on public.%I for update to anon, authenticated using (true) with check (true)', t);
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
