import { useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function Stats({ history, loadHistory }) {
  useEffect(() => {
    loadHistory(7)
  }, [loadHistory])

  const maxQuit = history.reduce((m, r) => Math.max(m, r.quit_count || 0), 0)
  const totalFish = history.reduce((s, r) => s + (r.fish_minutes || 0), 0)
  const worstDay = history.find((r) => r.quit_count === maxQuit)

  const data = history.map((r) => ({
    date: r.date.slice(5),
    不想干了: r.quit_count || 0,
    小成就: r.achievement_count || 0,
    摸鱼分钟: r.fish_minutes || 0,
  }))

  return (
    <div className="flex flex-col gap-6 py-6 px-4 pb-4">
      <h2 className="text-xl font-bold text-center" style={{ color: '#FF8FAB' }}>近7天统计</h2>

      {data.length > 0 ? (
        <div className="bg-white rounded-3xl p-4 shadow-sm">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="不想干了" stroke="#FF8FAB" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="小成就" stroke="#FFD166" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="摸鱼分钟" stroke="#7EC8E3" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 text-center shadow-sm" style={{ color: '#a0856a' }}>
          暂无数据，去敲木鱼吧～
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          emoji="💀"
          label="最崩溃的一天"
          value={worstDay ? `${worstDay.date.slice(5)} (${maxQuit}次)` : '还没有'}
          color="#FF8FAB"
        />
        <StatCard
          emoji="🐟"
          label="本周摸鱼总计"
          value={`${totalFish} 分钟`}
          color="#7EC8E3"
        />
        <StatCard
          emoji="🏆"
          label="本周成就数"
          value={`${history.reduce((s, r) => s + (r.achievement_count || 0), 0)} 个`}
          color="#FFD166"
        />
        <StatCard
          emoji="📊"
          label="平均每天"
          value={history.length ? `${Math.round(history.reduce((s,r)=>s+(r.quit_count||0),0)/history.length)} 次` : '-'}
          color="#C8956C"
        />
      </div>
    </div>
  )
}

function StatCard({ emoji, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col gap-1">
      <div className="text-2xl">{emoji}</div>
      <div className="text-xs" style={{ color: '#a0856a' }}>{label}</div>
      <div className="text-sm font-bold" style={{ color }}>{value}</div>
    </div>
  )
}
