-- 反馈查看（仅在 Supabase SQL Editor / Table Editor 中使用）
-- App 端没有读取反馈的入口，避免用户看到他人的意见。

-- 查看最新意见
select
  created_at,
  category,
  content,
  contact,
  user_id
from quit_feedback
order by created_at desc;

-- 按类别统计
select category, count(*) as feedback_count
from quit_feedback
group by category
order by feedback_count desc;

-- 查看最近 7 天意见
select created_at, category, content, contact
from quit_feedback
where created_at >= now() - interval '7 days'
order by created_at desc;

