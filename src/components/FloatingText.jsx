import { useState, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

let idCounter = 0

export function useFloatingText() {
  const [texts, setTexts] = useState([])

  const addText = useCallback((text, x, y) => {
    const id = ++idCounter
    setTexts((prev) => [...prev.slice(-4), { id, text, x, y }])
    setTimeout(() => {
      setTexts((prev) => prev.filter((t) => t.id !== id))
    }, 1600)
  }, [])

  return { texts, addText }
}

export default function FloatingText({ texts }) {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 50 }}>
      <AnimatePresence>
        {texts.map(({ id, text, x, y }) => (
          <motion.div
            key={id}
            initial={{ opacity: 1, y: 0, x: 0 }}
            animate={{ opacity: 0, y: -80 }}
            exit={{}}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{ position: 'absolute', left: x, top: y, translateX: '-50%' }}
            className="text-sm font-bold whitespace-nowrap"
            css={{ color: '#FF8FAB' }}
          >
            <span style={{ color: '#FF8FAB', textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>{text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
