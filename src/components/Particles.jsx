import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

const EMOJIS = ['⭐', '✨', '💢', '🌟', '💫', '❗', '🔥', '💥']
let pid = 0

export function useParticles() {
  const [particles, setParticles] = useState([])

  const burst = useCallback((x, y) => {
    const count = 8 + Math.floor(Math.random() * 5)
    const newP = Array.from({ length: count }, () => ({
      id: ++pid,
      x,
      y,
      emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
      dx: (Math.random() - 0.5) * 120,
      dy: (Math.random() - 0.5) * 120 - 40,
    }))
    setParticles((prev) => [...prev.slice(-14 + count), ...newP])
    setTimeout(() => {
      const ids = new Set(newP.map((p) => p.id))
      setParticles((prev) => prev.filter((p) => !ids.has(p.id)))
    }, 900)
  }, [])

  return { particles, burst }
}

export default function Particles({ particles }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 49 }}>
      <AnimatePresence>
        {particles.map(({ id, x, y, emoji, dx, dy }) => (
          <motion.div
            key={id}
            initial={{ opacity: 1, x: 0, y: 0 }}
            animate={{ opacity: 0, x: dx, y: dy }}
            exit={{}}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ position: 'absolute', left: x, top: y, fontSize: 18, translateX: '-50%', translateY: '-50%' }}
          >
            {emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
