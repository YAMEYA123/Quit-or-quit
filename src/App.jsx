import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import useStats from './hooks/useStats'
import { warmup } from './utils/audio'
import WoodFish from './components/WoodFish'
import Achievement from './components/Achievement'
import FishTimer from './components/FishTimer'
import Stats from './components/Stats'
import BottomNav from './components/BottomNav'
import RecoveryModal from './components/RecoveryModal'

export default function App() {
  const [tab, setTab] = useState('main')
  const [showSetRecovery, setShowSetRecovery] = useState(false)
  const {
    today, history, addQuit, addAchievement, stopFish, loadHistory, loadMonthHistory,
    userId, showRestorePrompt, setShowRestorePrompt, restoreFromCode, setRecovery,
  } = useStats()

  useEffect(() => {
    const handler = () => { warmup(); document.removeEventListener('touchstart', handler); document.removeEventListener('click', handler) }
    document.addEventListener('touchstart', handler, { once: true })
    document.addEventListener('click', handler, { once: true })
  }, [])

  return (
    <div className="flex flex-col min-h-svh pb-20" style={{ background: '#FFF9F5' }}>
      <header className="px-5 pt-5 pb-3 text-center">
        <h1 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>今天也不想干了吗</h1>
        <p className="text-xs mt-0.5" style={{ color: '#BBB' }}>{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })}</p>
      </header>

      <main className="flex-1 overflow-y-auto px-4 flex flex-col">
        {tab === 'main' && <WoodFish count={today.quit_count} onQuit={addQuit} />}
        {tab === 'achievement' && <Achievement count={today.achievement_count} onAdd={addAchievement} />}
        {tab === 'fish' && <FishTimer fishMinutes={today.fish_minutes} onStop={stopFish} />}
        {tab === 'stats' && (
          <Stats
            history={history}
            loadHistory={loadHistory}
            loadMonthHistory={loadMonthHistory}
            onSetRecovery={() => setShowSetRecovery(true)}
          />
        )}
      </main>

      <BottomNav tab={tab} setTab={setTab} />

      {showRestorePrompt && (
        <RecoveryModal
          mode="restore"
          onRestore={restoreFromCode}
          onClose={() => setShowRestorePrompt(false)}
        />
      )}
      {showSetRecovery && (
        <RecoveryModal
          mode="set"
          onSet={setRecovery}
          onClose={() => setShowSetRecovery(false)}
        />
      )}
    </div>
  )
}
