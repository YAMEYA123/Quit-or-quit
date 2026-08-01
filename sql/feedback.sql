-- 轻量反馈纸条：仅允许匿名提交，前端不提供读取入口
create table if not exists quit_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  category text not null,
  content text not null,
  contact text,
  created_at timestamptz not null default now()
);

alter table quit_feedback enable row level security;

drop policy if exists "allow anonymous feedback insert" on quit_feedback;
create policy "allow anonymous feedback insert"
  on quit_feedback for insert
  with check (true);

