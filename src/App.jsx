import { useState, useEffect } from 'react'
import useStats from './hooks/useStats'
import { warmup } from './utils/audio'
import WoodFish from './components/WoodFish'
import Achievement from './components/Achievement'
import FishTimer from './components/FishTimer'
import Stats from './components/Stats'
import BottomNav from './components/BottomNav'

export default function App() {
  const [tab, setTab] = useState('main')
  const { today, history, addQuit, addAchievement, stopFish, loadHistory, loadMonthHistory } = useStats()

  useEffect(() => {
    const handler = () => { warmup(); document.removeEventListener('touchstart', handler); document.removeEventListener('click', handler) }
    document.addEventListener('touchstart', handler, { once: true })
    document.addEventListener('click', handler, { once: true })
  }, [])

  return (
    <div className="flex flex-col min-h-svh pb-20" style={{ background: '#FFF9F5' }}>
      <header className="px-4 py-3 text-center">
        <h1 className="text-lg font-bold" style={{ color: '#FF8FAB' }}>今天也不想干了吗</h1>
      </header>

      <main className="flex-1 overflow-y-auto px-4 flex flex-col">
        {tab === 'main' && (
          <WoodFish count={today.quit_count} onQuit={addQuit} />
        )}
        {tab === 'achievement' && (
          <Achievement count={today.achievement_count} onAdd={addAchievement} />
        )}
        {tab === 'fish' && (
          <FishTimer fishMinutes={today.fish_minutes} onStop={stopFish} />
        )}
        {tab === 'stats' && (
          <Stats history={history} loadHistory={loadHistory} loadMonthHistory={loadMonthHistory} />
        )}
      </main>

      <BottomNav tab={tab} setTab={setTab} />
    </div>
  )
}
