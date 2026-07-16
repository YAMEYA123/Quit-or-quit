create table if not exists quit_daily_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  date date not null,
  quit_count int default 0,
  achievement_count int default 0,
  fish_minutes int default 0,
  updated_at timestamptz default now(),
  unique(user_id, date)
);
alter table quit_daily_records enable row level security;
create policy "Users can manage own records" on quit_daily_records
  for all using (auth.uid() = user_id);

create table if not exists quit_event_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  type text not null,
  note text,
  created_at timestamptz default now()
);
alter table quit_event_log enable row level security;
create policy "Users can manage own events" on quit_event_log
  for all using (auth.uid() = user_id);
