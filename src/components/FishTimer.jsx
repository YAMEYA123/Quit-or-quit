import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getFishCopy } from '../utils/copy'
import { playFishBubble } from '../utils/audio'

function fmt(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, '0')
  const s = (sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

export default function FishTimer({ fishMinutes, onStop }) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [summary, setSummary] = useState('')
  const timerRef = useRef(null)
  const startRef = useRef(0)

  const start = () => {
    playFishBubble()
    setRunning(true)
    setSummary('')
    startRef.current = Date.now() - elapsed * 1000
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
  }

  const stop = async () => {
    clearInterval(timerRef.current)
    setRunning(false)
    const minutes = Math.max(1, Math.round(elapsed / 60))
    setSummary(getFishCopy(minutes))
    await onStop(minutes)
    setElapsed(0)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-4xl">🐟</div>
      <h2 className="text-xl font-bold" style={{ color: '#7EC8E3' }}>摸鱼计时器</h2>
      <p className="text-sm" style={{ color: '#a0856a' }}>今日累计摸鱼 {fishMinutes} 分钟</p>

      <AnimatePresence mode="wait">
        {running ? (
          <motion.div
            key="running"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 w-full"
          >
            <div className="relative w-full h-14 overflow-hidden rounded-2xl bg-blue-50">
              <motion.div
                animate={{ x: ['calc(-100% - 60px)', 'calc(100vw + 60px)'] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                className="absolute top-1/2 -translate-y-1/2 text-3xl"
              >
                🐟
              </motion.div>
            </div>
            <div className="text-3xl font-mono font-bold" style={{ color: '#7EC8E3' }}>
              {fmt(elapsed)}
            </div>
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={stop}
              className="px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg"
              style={{ background: '#7EC8E3' }}
            >
              摸完了 ✋
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4"
          >
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={start}
              className="px-8 py-4 rounded-full text-white font-bold text-lg shadow-lg"
              style={{ background: 'linear-gradient(135deg, #7EC8E3, #5ba8c8)' }}
            >
              开始摸鱼 🐟
            </motion.button>
            <AnimatePresence>
              {summary && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-6 py-3 rounded-2xl bg-white shadow-md text-center"
                  style={{ color: '#7EC8E3' }}
                >
                  {summary}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
