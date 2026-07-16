import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getAchievementCopy } from '../utils/copy'
import { playAchievement } from '../utils/audio'

const COLORS = ['#FF8FAB', '#FFD166', '#7EC8E3', '#C8956C', '#a78bfa', '#34d399']

function Confetti({ active }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) { setPieces([]); return }
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random(),
      size: 6 + Math.random() * 8,
    }))
    setPieces(p)
    const t = setTimeout(() => setPieces([]), 2500)
    return () => clearTimeout(t)
  }, [active])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 60 }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute confetti-piece rounded-full"
          style={{
            left: `${p.left}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function Achievement({ count, onAdd }) {
  const [msg, setMsg] = useState('')
  const [showConfetti, setShowConfetti] = useState(false)

  const handleClick = async () => {
    playAchievement()
    setShowConfetti(false)
    await onAdd()
    setMsg(getAchievementCopy())
    setShowConfetti(true)
    setTimeout(() => {
      setMsg('')
      setShowConfetti(false)
    }, 2500)
  }

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <Confetti active={showConfetti} />

      <div className="text-4xl">🏆</div>
      <h2 className="text-xl font-bold" style={{ color: '#FF8FAB' }}>今日小成就</h2>
      <p className="text-sm" style={{ color: '#a0856a' }}>今天已记录 {count} 个高光时刻</p>

      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={handleClick}
        className="px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg"
        style={{ background: 'linear-gradient(135deg, #FFD166, #FF8FAB)' }}
      >
        我今天好棒！🏆
      </motion.button>

      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-base font-semibold px-6 py-3 rounded-2xl bg-white shadow-md"
            style={{ color: '#FF8FAB' }}
          >
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
