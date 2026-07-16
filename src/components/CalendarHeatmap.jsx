const DAYS = ['日', '一', '二', '三', '四', '五', '六']

function heatColor(count) {
  if (!count || count === 0) return '#F0EDE8'
  if (count <= 3) return '#F5C5A3'
  if (count <= 9) return '#E8874A'
  return '#C94B1A'
}

export default function CalendarHeatmap({ year, month, data, selectedDate, onSelect }) {
  const today = new Date().toISOString().slice(0, 10)
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDow = new Date(year, month - 1, 1).getDay()

  const cells = []
  for (let i = 0; i < firstDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-xs py-1" style={{ color: '#999' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const rec = data[dateStr]
          const count = rec?.quit_count || 0
          const isFuture = dateStr > today
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate

          return (
            <button
              key={dateStr}
              onClick={() => !isFuture && onSelect(isSelected ? null : dateStr)}
              disabled={isFuture}
              style={{
                background: isFuture ? 'transparent' : heatColor(count),
                border: isSelected ? '2px solid #1A1A1A' : isToday ? '2px solid #999' : '2px solid transparent',
                borderRadius: 6,
                aspectRatio: '1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: isFuture ? '#CCC' : count > 3 ? '#FFF' : '#555',
                fontWeight: isToday ? 700 : 400,
                cursor: isFuture ? 'default' : 'pointer',
              }}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}
