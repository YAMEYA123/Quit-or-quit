import { useEffect, useState, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import CalendarHeatmap from './CalendarHeatmap'

function loadLocalMonth(year, month) {
  const daysInMonth = new Date(year, month, 0).getDate()
  const map = {}
  for (let d = 1; d <= daysInMonth; d++) {
    const key = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    try {
      const raw = localStorage.getItem(`quit_stats_${key}`)
      if (raw) map[key] = JSON.parse(raw)
    } catch {}
  }
  return map
}

export default function Stats({ history, loadHistory, loadMonthHistory, onRestore, savedCode }) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const [monthData, setMonthData] = useState(() => loadLocalMonth(now.getFullYear(), now.getMonth() + 1))
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => { loadHistory(7) }, [loadHistory])

  const fetchMonth = useCallback(async (y, m) => {
    const data = await loadMonthHistory(y, m)
    setMonthData(data || {})
  }, [loadMonthHistory])

  useEffect(() => { fetchMonth(viewYear, viewMonth) }, [viewYear, viewMonth, fetchMonth])

  const prevMonth = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
    setSelectedDate(null)
  }
  const nextMonth = () => {
    const now = new Date()
    if (viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1) return
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
    setSelectedDate(null)
  }

  const chartData = history.map(r => ({
    date: r.date.slice(5),
    崩溃: r.quit_count || 0,
    成就: r.achievement_count || 0,
    摸鱼: r.fish_minutes || 0,
  }))

  const selectedRec = selectedDate ? monthData[selectedDate] : null

  const monthValues = Object.values(monthData)
  const monthQuit = monthValues.reduce((s, r) => s + (r.quit_count || 0), 0)
  const monthFish = monthValues.reduce((s, r) => s + (r.fish_minutes || 0), 0)
  const monthAch = monthValues.reduce((s, r) => s + (r.achievement_count || 0), 0)

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1

  return (
    <div className="flex flex-col gap-4 py-4 pb-6">

      {/* 月份汇总：导航 + 大数字，放在最顶部 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ECEAE6', padding: '14px 16px' }}>
        {/* 月份导航 */}
        <div className="flex items-center justify-between mb-3">
          <button onClick={prevMonth} style={{ color: '#888', fontSize: 20, lineHeight: 1, padding: '2px 4px', fontWeight: 300 }}>‹</button>
          <span style={{ fontSize: 14, color: '#333', fontWeight: 700 }}>
            {viewYear}年{viewMonth}月
          </span>
          <button
            onClick={nextMonth}
            style={{ color: isCurrentMonth ? '#DDD' : '#888', fontSize: 20, lineHeight: 1, padding: '2px 4px', fontWeight: 300 }}
            disabled={isCurrentMonth}
          >›</button>
        </div>
        {/* 三个大数字 */}
        <div className="grid grid-cols-3 divide-x" style={{ borderTop: '1px solid #F0EDE8', paddingTop: 12 }}>
          <BigStat color="#C94B1A" value={monthQuit} unit="次" label="不想干了" />
          <BigStat color="#4A7C59" value={monthAch} unit="个" label="小成就" />
          <BigStat color="#5B8DB8" value={monthFish} unit="分钟" label="摸鱼" />
        </div>
      </div>

      {/* 月历 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ECEAE6', overflow: 'hidden' }}>
        <div style={{ padding: '10px 12px 8px' }}>
          <CalendarHeatmap
            year={viewYear}
            month={viewMonth}
            data={monthData}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>
        <div className="flex items-center gap-1.5 pb-3 pr-4 justify-end">
          <span style={{ fontSize: 10, color: '#CCC' }}>少</span>
          {['#F0EDE8', '#F5C5A3', '#E8874A', '#C94B1A'].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: 2, background: c }} />
          ))}
          <span style={{ fontSize: 10, color: '#CCC' }}>多</span>
        </div>
      </div>

      {/* 选中日期详情 */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{ background: '#1A1A1A', borderRadius: 12, padding: '12px 16px', color: '#fff' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 13, fontWeight: 600 }}>
                {selectedDate.slice(5).replace('-', '月')}日
              </span>
              <button onClick={() => setSelectedDate(null)} style={{ color: '#555', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>
            {selectedRec ? (
              <div className="flex gap-5">
                <DetailChip label="不想干了" value={`${selectedRec.quit_count || 0} 次`} color="#E8874A" />
                <DetailChip label="小成就" value={`${selectedRec.achievement_count || 0} 个`} color="#4A7C59" />
                <DetailChip label="摸鱼" value={`${selectedRec.fish_minutes || 0} 分`} color="#5B8DB8" />
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#555' }}>这天没有记录</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 近7天折线图，放在底部作为补充 */}
      {chartData.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 12, padding: '10px 4px 4px 4px', border: '1px solid #ECEAE6' }}>
          <div className="flex items-center justify-between px-3 mb-1">
            <span style={{ fontSize: 11, color: '#AAA', fontWeight: 600, letterSpacing: '0.05em' }}>近 7 天趋势</span>
            <div className="flex gap-3">
              {[['崩溃', '#C94B1A'], ['成就', '#4A7C59'], ['摸鱼分', '#5B8DB8']].map(([label, color]) => (
                <div key={label} className="flex items-center gap-1">
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 10, color: '#BBB' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={110}>
            <LineChart data={chartData} margin={{ left: -24, right: 8, top: 4, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#CCC' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#CCC' }} axisLine={false} tickLine={false} allowDecimals={false} width={28} domain={[0, 'auto']} tickCount={4} />
              <Tooltip
                contentStyle={{ border: '1px solid #EEE', borderRadius: 8, fontSize: 11 }}
                cursor={{ stroke: '#F0EDE8' }}
              />
              <Line type="monotone" dataKey="崩溃" stroke="#C94B1A" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="成就" stroke="#4A7C59" strokeWidth={1.5} dot={false} />
              <Line type="monotone" dataKey="摸鱼" stroke="#5B8DB8" strokeWidth={1.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 摸鱼证卡片 */}
      <FishCard cardNo={savedCode} onRestore={onRestore} />

    </div>
  )
}

function BigStat({ color, value, unit, label }) {
  return (
    <div className="flex flex-col items-center gap-0.5 px-2">
      <div className="flex items-baseline gap-0.5">
        <span style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
        <span style={{ fontSize: 11, color: '#AAA' }}>{unit}</span>
      </div>
      <span style={{ fontSize: 11, color: '#BBB' }}>{label}</span>
    </div>
  )
}

function DetailChip({ label, value, color }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 10, color: '#666' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

function FishCard({ cardNo, onRestore }) {
  const isReady = !!cardNo

  return (
    <div style={{
      background: isReady ? '#F0F7F0' : '#FFF9F5',
      border: `1px solid ${isReady ? '#C8E0C8' : '#ECEAE6'}`,
      borderRadius: 12,
      overflow: 'hidden',
    }}>
      {/* 证件头部 */}
      <div style={{
        background: isReady ? '#4A7C59' : '#CCC',
        padding: '8px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
          🐟 全国打工人摸鱼证
        </span>
        <span style={{
          fontSize: 10,
          background: 'rgba(255,255,255,0.25)',
          color: '#fff',
          borderRadius: 4,
          padding: '1px 6px',
          letterSpacing: '0.05em',
        }}>
          {isReady ? '官方认证' : '办理中…'}
        </span>
      </div>

      {/* 证件内容 */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '56px 1fr', gap: '6px 8px', alignItems: 'baseline' }}>
          <span style={{ fontSize: 11, color: '#888' }}>持证人</span>
          <span style={{ fontSize: 12, color: '#555' }}>本人</span>

          <span style={{ fontSize: 11, color: '#888' }}>证件编号</span>
          <span style={{
            fontSize: 16,
            fontWeight: 700,
            color: isReady ? '#2D5A3D' : '#BBB',
            fontFamily: 'monospace',
            letterSpacing: '0.08em',
          }}>
            {isReady ? cardNo : '生成中…'}
          </span>

          <span style={{ fontSize: 11, color: '#888' }}>有效期</span>
          <span style={{ fontSize: 12, color: '#555' }}>永久（或提前离职）</span>

          <span style={{ fontSize: 11, color: '#888' }}>签发机构</span>
          <span style={{ fontSize: 12, color: '#555' }}>打工人互助总局</span>
        </div>
      </div>

      {/* 换设备找回入口 */}
      <button
        onClick={onRestore}
        style={{
          width: '100%',
          borderTop: `1px dashed ${isReady ? '#C8E0C8' : '#E8E8E8'}`,
          background: 'transparent',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          border: 'none',
          borderTop: `1px dashed ${isReady ? '#C8E0C8' : '#E8E8E8'}`,
        }}
      >
        <span style={{ fontSize: 11, color: '#888' }}>
          📱 换设备了？凭证号把数据搬过来
        </span>
        <span style={{ fontSize: 14, color: '#AAA' }}>›</span>
      </button>
    </div>
  )
}
