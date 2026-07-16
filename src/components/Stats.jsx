import { useEffect, useState, useCallback } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import CalendarHeatmap from './CalendarHeatmap'

export default function Stats({ history, loadHistory, loadMonthHistory }) {
  const now = new Date()
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const [monthData, setMonthData] = useState({})
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

      {/* 近7天迷你折线图 */}
      {chartData.length > 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: '10px 4px 4px 4px', border: '1px solid #ECEAE6' }}>
          <div className="flex items-center justify-between px-3 mb-1">
            <span style={{ fontSize: 11, color: '#AAA', fontWeight: 600, letterSpacing: '0.05em' }}>近 7 天</span>
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
              <YAxis tick={{ fontSize: 9, fill: '#CCC' }} axisLine={false} tickLine={false} allowDecimals={false} width={36} />
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
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px', textAlign: 'center', border: '1px solid #ECEAE6' }}>
          <p style={{ fontSize: 12, color: '#CCC' }}>去敲木鱼，数据会出现在这里</p>
        </div>
      )}

      {/* 月历区域 */}
      <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #ECEAE6', overflow: 'hidden' }}>

        {/* 月份导航 + 汇总数字 */}
        <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #F0EDE8' }}>
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} style={{ color: '#888', fontSize: 18, lineHeight: 1, padding: '2px 4px', fontWeight: 300 }}>‹</button>
            <span style={{ fontSize: 14, color: '#333', fontWeight: 700 }}>
              {viewYear}年{viewMonth}月
            </span>
            <button
              onClick={nextMonth}
              style={{ color: isCurrentMonth ? '#DDD' : '#888', fontSize: 18, lineHeight: 1, padding: '2px 4px', fontWeight: 300 }}
              disabled={isCurrentMonth}
            >›</button>
          </div>
          <div className="flex justify-center gap-5 mt-2">
            <MonthStat dot="#C94B1A" label="崩溃" value={monthQuit} unit="次" />
            <MonthStat dot="#4A7C59" label="成就" value={monthAch} unit="个" />
            <MonthStat dot="#5B8DB8" label="摸鱼" value={monthFish} unit="分" />
          </div>
        </div>

        {/* 日历格子 */}
        <div style={{ padding: '10px 12px 8px' }}>
          <CalendarHeatmap
            year={viewYear}
            month={viewMonth}
            data={monthData}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>

        {/* 图例 */}
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

    </div>
  )
}

function MonthStat({ dot, label, value, unit }) {
  return (
    <div className="flex items-baseline gap-1">
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dot, flexShrink: 0, marginBottom: 1 }} />
      <span style={{ fontSize: 11, color: '#AAA' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#333' }}>{value}</span>
      <span style={{ fontSize: 10, color: '#BBB' }}>{unit}</span>
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
