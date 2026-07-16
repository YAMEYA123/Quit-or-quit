import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getQuitCopy, getMilestoneCopy, getLateNightCopy } from '../utils/copy'
import { playWoodfish, playMilestone, playAlarm } from '../utils/audio'
import FloatingText, { useFloatingText } from './FloatingText'
import Particles, { useParticles } from './Particles'
import MilestoneModal from './MilestoneModal'

export default function WoodFish({ count, onQuit }) {
  const fishRef = useRef(null)
  const lastClickRef = useRef(0)
  const [shaking, setShaking] = useState(false)
  const [milestone, setMilestone] = useState(0)
  const { texts, addText } = useFloatingText()
  const { particles, burst } = useParticles()

  const hour = new Date().getHours()
  const isLateNight = hour >= 23 || hour < 5

  const handleClick = useCallback(async () => {
    const now = Date.now()
    const rapid = now - lastClickRef.current < 500
    lastClickRef.current = now

    if (rapid) {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    }

    await onQuit()
    const newCount = count + 1

    playWoodfish()

    const rect = fishRef.current?.getBoundingClientRect()
    if (rect) {
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 4
      addText(getQuitCopy(newCount), cx, cy)
      burst(cx, cy + rect.height / 2)
    }

    if (newCount % 10 === 0) {
      if (newCount >= 100) playAlarm()
      else playMilestone()
      setMilestone(newCount)
    }
  }, [count, onQuit, addText, burst])

  return (
    <>
      <FloatingText texts={texts} />
      <Particles particles={particles} />
      <MilestoneModal count={milestone} onClose={() => setMilestone(0)} />

      <div className="flex flex-col items-center gap-6 py-6">
        {isLateNight && (
          <div className="text-xs px-4 py-2 rounded-full text-white" style={{ background: '#7EC8E3' }}>
            🌙 {getLateNightCopy()}
          </div>
        )}

        <motion.div
          key={count}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 0.3 }}
          className="text-2xl font-bold"
          style={{ color: '#FF8FAB' }}
        >
          今天不想干了 × {count} 次
        </motion.div>

        <motion.div
          ref={fishRef}
          animate={shaking ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
          whileTap={{ scale: 0.85 }}
          onClick={handleClick}
          className="cursor-pointer select-none"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <motion.div
            whileTap={{ scale: [1, 0.85, 1.1, 1] }}
            transition={{ duration: 0.3 }}
          >
            <WoodFishSVG />
          </motion.div>
        </motion.div>

        <p className="text-sm" style={{ color: '#a0856a' }}>轻敲木鱼，释放压力</p>
      </div>
    </>
  )
}

function WoodFishSVG() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="80" cy="100" rx="55" ry="45" fill="#C8956C" />
      <ellipse cx="80" cy="98" rx="48" ry="38" fill="#D9A87C" />
      <ellipse cx="80" cy="95" rx="30" ry="20" fill="#C8956C" opacity="0.5" />
      <rect x="72" y="48" width="16" height="28" rx="8" fill="#A0714A" />
      <ellipse cx="80" cy="46" rx="12" ry="8" fill="#A0714A" />
      <ellipse cx="62" cy="90" rx="5" ry="7" fill="#8B5E3C" opacity="0.4" />
      <ellipse cx="98" cy="90" rx="5" ry="7" fill="#8B5E3C" opacity="0.4" />
      <circle cx="68" cy="88" r="4" fill="#5C3D1E" />
      <circle cx="92" cy="88" r="4" fill="#5C3D1E" />
      <circle cx="69.5" cy="86.5" r="1.5" fill="white" />
      <circle cx="93.5" cy="86.5" r="1.5" fill="white" />
      <path d="M73 102 Q80 108 87 102" stroke="#8B5E3C" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  )
}
