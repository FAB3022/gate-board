-- Run once in the Supabase SQL editor (Project > SQL Editor > New query > paste > Run).

create table if not exists public.launch_status (
  item_id    text primary key check (item_id ~ '^(CA|US)-(PRE|POST)-[0-9]{3}$'),
  market     text not null check (market in ('CA', 'US')),
  status     text not null check (status in ('not_started', 'in_progress', 'done', 'blocked', 'na')),
  note       text not null default '' check (char_length(note) <= 500),
  updated_at timestamptz not null default now()
);

alter table public.launch_status enable row level security;

-- Anyone with the dashboard link can read and update statuses. Deleting rows is not allowed.
drop policy if exists "read statuses" on public.launch_status;
create policy "read statuses" on public.launch_status
  for select to anon, authenticated using (true);

drop policy if exists "add statuses" on public.launch_status;
create policy "add statuses" on public.launch_status
  for insert to anon, authenticated with check (true);

drop policy if exists "change statuses" on public.launch_status;
create policy "change statuses" on public.launch_status
  for update to anon, authenticated using (true) with check (true);

-- Push changes to every open dashboard in real time.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'launch_status'
  ) then
    alter publication supabase_realtime add table public.launch_status;
  end if;
end $$;
