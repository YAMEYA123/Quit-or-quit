export default function BottomNav({ tab, setTab }) {
  const tabs = [
    { id: 'main', label: '不干了', emoji: '😤' },
    { id: 'achievement', label: '成就', emoji: '🏆' },
    { id: 'fish', label: '摸鱼', emoji: '🐟' },
    { id: 'stats', label: '统计', emoji: '📊' },
  ]

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] flex bg-white border-t"
      style={{ borderColor: '#ffe0e8', zIndex: 40 }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => setTab(t.id)}
          className="flex-1 flex flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors"
          style={{ color: tab === t.id ? '#FF8FAB' : '#a0856a' }}
        >
          <span className="text-xl">{t.emoji}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
