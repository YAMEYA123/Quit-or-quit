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

  // 本月汇总
  const monthValues = Object.values(monthData)
  const monthQuit = monthValues.reduce((s, r) => s + (r.quit_count || 0), 0)
  const monthFish = monthValues.reduce((s, r) => s + (r.fish_minutes || 0), 0)
  const monthAch = monthValues.reduce((s, r) => s + (r.achievement_count || 0), 0)
  const monthMax = monthValues.reduce((m, r) => Math.max(m, r.quit_count || 0), 0)

  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1

  return (
    <div className="flex flex-col gap-5 py-5 px-4 pb-6">

      {/* 7天折线图 */}
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#888' }}>近7天趋势</h2>
        {chartData.length > 0 ? (
          <div style={{ background: '#fff', borderRadius: 12, padding: '12px 4px 4px', border: '1px solid #ECEAE6' }}>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ left: -20, right: 8 }}>
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#AAA' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#AAA' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ border: '1px solid #EEE', borderRadius: 8, fontSize: 12 }}
                  cursor={{ stroke: '#EEE' }}
                />
                <Line type="monotone" dataKey="崩溃" stroke="#C94B1A" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="成就" stroke="#4A7C59" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="摸鱼" stroke="#5B8DB8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 pb-2">
              {[['崩溃', '#C94B1A'], ['成就', '#4A7C59'], ['摸鱼分钟', '#5B8DB8']].map(([label, color]) => (
                <div key={label} className="flex items-center gap-1">
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                  <span style={{ fontSize: 10, color: '#AAA' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyCard text="去敲木鱼，数据会出现在这里" />
        )}
      </section>

      {/* 日历热力图 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: '#888' }}>月历</h2>
          <div className="flex items-center gap-2">
            <button onClick={prevMonth} style={{ color: '#555', fontSize: 16, lineHeight: 1, padding: '2px 6px' }}>‹</button>
            <span style={{ fontSize: 13, color: '#333', fontWeight: 600, minWidth: 72, textAlign: 'center' }}>
              {viewYear}年{viewMonth}月
            </span>
            <button
              onClick={nextMonth}
              style={{ color: isCurrentMonth ? '#CCC' : '#555', fontSize: 16, lineHeight: 1, padding: '2px 6px' }}
              disabled={isCurrentMonth}
            >›</button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, padding: 12, border: '1px solid #ECEAE6' }}>
          <CalendarHeatmap
            year={viewYear}
            month={viewMonth}
            data={monthData}
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
          />
        </div>

        {/* 图例 */}
        <div className="flex items-center gap-2 mt-2 justify-end">
          <span style={{ fontSize: 10, color: '#BBB' }}>少</span>
          {['#F0EDE8', '#F5C5A3', '#E8874A', '#C94B1A'].map(c => (
            <div key={c} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />
          ))}
          <span style={{ fontSize: 10, color: '#BBB' }}>多</span>
        </div>
      </section>

      {/* 选中日期详情 */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            key={selectedDate}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{ background: '#1A1A1A', borderRadius: 12, padding: '14px 16px', color: '#fff' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontSize: 13, fontWeight: 600 }}>{selectedDate.slice(5).replace('-', '月')}日</span>
              <button onClick={() => setSelectedDate(null)} style={{ color: '#666', fontSize: 16 }}>×</button>
            </div>
            {selectedRec ? (
              <div className="flex gap-4">
                <Chip label="不想干了" value={`${selectedRec.quit_count || 0} 次`} color="#E8874A" />
                <Chip label="小成就" value={`${selectedRec.achievement_count || 0} 个`} color="#4A7C59" />
                <Chip label="摸鱼" value={`${selectedRec.fish_minutes || 0} 分`} color="#5B8DB8" />
              </div>
            ) : (
              <p style={{ fontSize: 12, color: '#666' }}>这天没有记录</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 本月汇总 */}
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: '#888' }}>
          {viewYear}年{viewMonth}月汇总
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <SummaryCard label="累计崩溃" value={monthQuit} unit="次" accent="#C94B1A" />
          <SummaryCard label="最崩溃单日" value={monthMax} unit="次" accent="#E8874A" />
          <SummaryCard label="摸鱼总计" value={monthFish} unit="分钟" accent="#5B8DB8" />
          <SummaryCard label="小成就" value={monthAch} unit="个" accent="#4A7C59" />
        </div>
      </section>

    </div>
  )
}

function Chip({ label, value, color }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span style={{ fontSize: 10, color: '#666' }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
    </div>
  )
}

function SummaryCard({ label, value, unit, accent }) {
  return (
    <div style={{ background: '#fff', borderRadius: 10, padding: '12px 14px', border: '1px solid #ECEAE6' }}>
      <div style={{ fontSize: 11, color: '#AAA', marginBottom: 4 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: accent }}>{value}</span>
        <span style={{ fontSize: 11, color: '#AAA' }}>{unit}</span>
      </div>
    </div>
  )
}

function EmptyCard({ text }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '24px 16px', textAlign: 'center', border: '1px solid #ECEAE6' }}>
      <p style={{ fontSize: 13, color: '#BBB' }}>{text}</p>
    </div>
  )
}
