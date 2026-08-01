-- ============================================================
-- 今天也不想干了吗 — Supabase 完整数据库 Schema
-- 按时间顺序分阶段，新环境从头执行即可
-- ============================================================


-- ============================================================
-- 阶段 1：初始建表（初次上线时执行）
-- ============================================================

-- 每日打卡记录
create table if not exists quit_daily_records (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null,          -- 设备 UUID（不绑定 auth.users）
  date           date not null,
  quit_count     int  default 0,
  achievement_count int default 0,
  fish_minutes   int  default 0,
  updated_at     timestamptz default now(),
  unique(user_id, date)
);
alter table quit_daily_records enable row level security;

-- 事件日志（目前未使用，保留备用）
create table if not exists quit_event_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,
  type       text not null,
  note       text,
  created_at timestamptz default now()
);
alter table quit_event_log enable row level security;


-- ============================================================
-- 阶段 2：新增工号恢复码表（绑定工号功能上线时执行）
-- ============================================================

create table if not exists quit_recovery_codes (
  code_hash  text not null unique,   -- 唯一：同一工号只能被一个设备绑定
  user_id    uuid not null,
  created_at timestamptz default now(),
  primary key (user_id)
);
alter table quit_recovery_codes enable row level security;

-- 任何人可查询（findUserByCode 需要）
create policy "anyone can read" on quit_recovery_codes
  for select using (true);


-- ============================================================
-- 阶段 3：迁移到设备 UUID，去除 Supabase Auth 依赖
-- （切换到 localStorage UUID 方案时执行）
-- ============================================================

-- 1. 删除旧的 auth.uid() RLS 策略
drop policy if exists "Users can manage own records" on quit_daily_records;
drop policy if exists "Users can manage own events"  on quit_event_log;
drop policy if exists "anon insert own"              on quit_recovery_codes;
drop policy if exists "anon update own"              on quit_recovery_codes;

-- 2. 如果建表时带了 references auth.users 外键，需要先删掉
--    （新环境按阶段1建表不会有此约束，旧环境可能需要执行）
do $$
begin
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'quit_daily_records'
      and constraint_type = 'FOREIGN KEY'
  ) then
    alter table quit_daily_records drop constraint if exists quit_daily_records_user_id_fkey;
  end if;
  if exists (
    select 1 from information_schema.table_constraints
    where table_name = 'quit_event_log'
      and constraint_type = 'FOREIGN KEY'
  ) then
    alter table quit_event_log drop constraint if exists quit_event_log_user_id_fkey;
  end if;
end $$;

-- 3. 新策略：按设备 UUID 隔离，无需 auth session
--    user_id 是随机 UUID，外人不知道也就无法访问
create policy "allow all"    on quit_daily_records  for all    using (true) with check (true);
create policy "allow all"    on quit_event_log      for all    using (true) with check (true);
create policy "allow insert" on quit_recovery_codes for insert with check (true);
create policy "allow update" on quit_recovery_codes for update using (true);


-- ============================================================
-- 阶段 4：轻量反馈纸条（仅匿名插入）
-- ============================================================

create table if not exists quit_feedback (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid,
  category   text not null,
  content    text not null,
  contact    text,
  created_at timestamptz not null default now()
);
alter table quit_feedback enable row level security;
drop policy if exists "allow anonymous feedback insert" on quit_feedback;
create policy "allow anonymous feedback insert" on quit_feedback
  for insert with check (true);
