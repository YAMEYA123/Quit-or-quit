-- 运营数据查询
-- 在 Supabase SQL Editor 中执行

-- 同步用户总数（每台设备算一个用户）
SELECT COUNT(DISTINCT device_id) AS user_count
FROM quit_recovery_codes;

-- 近 7 天新增用户数
SELECT COUNT(DISTINCT device_id) AS new_users
FROM quit_recovery_codes
WHERE created_at >= NOW() - INTERVAL '7 days';

-- 近 7 天活跃用户数（有写入日记录的设备）
SELECT COUNT(DISTINCT device_id) AS active_users
FROM quit_daily_records
WHERE date >= (CURRENT_DATE - 6);

-- 全站累计「不想干了」次数
SELECT SUM(quit_count) AS total_quit_count
FROM quit_daily_records;

-- 全站累计摸鱼分钟数
SELECT SUM(fish_minutes) AS total_fish_minutes
FROM quit_daily_records;

-- 全站累计小成就数
SELECT SUM(achievement_count) AS total_achievement_count
FROM quit_daily_records;

-- 近 30 天每日活跃用户趋势
SELECT date, COUNT(DISTINCT device_id) AS dau
FROM quit_daily_records
WHERE date >= (CURRENT_DATE - 29)
GROUP BY date
ORDER BY date;
