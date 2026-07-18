import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getQuitCopy, getLateNightCopy } from '../utils/copy'
import { playWoodfish, playMilestone, playAlarm } from '../utils/audio'
import FloatingText, { useFloatingText } from './FloatingText'
import Particles, { useParticles } from './Particles'
import MilestoneModal from './MilestoneModal'

export default function WoodFish({ count, onQuit }) {
  const fishRef = useRef(null)
  const lastClickRef = useRef(0)
  const clickTimesRef = useRef([])
  const [shaking, setShaking] = useState(false)
  const [crying, setCrying] = useState(false)
  const [cryKey, setCryKey] = useState(0)
  const [milestone, setMilestone] = useState(0)
  const cryTimerRef = useRef(null)
  const { texts, addText } = useFloatingText()
  const { particles, burst } = useParticles()

  const hour = new Date().getHours()
  const isLateNight = hour >= 23 || hour < 5

  const handleClick = useCallback(async (e) => {
    const now = Date.now()
    const rapid = now - lastClickRef.current < 500
    lastClickRef.current = now

    // 计算连击 intensity（1.5秒内点击次数，6次=满）
    clickTimesRef.current.push(now)
    clickTimesRef.current = clickTimesRef.current.filter(t => now - t < 1500)
    const intensity = Math.min(1, clickTimesRef.current.length / 6)

    // 计算点击位置 zone（0=顶部高音 ~ 1=底部低音）
    let zone = 0.5
    const rect = fishRef.current?.getBoundingClientRect()
    if (rect) {
      const clientY = e.touches?.[0]?.clientY ?? e.clientY
      zone = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    }

    if (rapid) {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
    }

    setCrying(true)
    setCryKey(k => k + 1)
    clearTimeout(cryTimerRef.current)
    cryTimerRef.current = setTimeout(() => setCrying(false), 700)

    await onQuit()
    const newCount = count + 1

    playWoodfish(zone, intensity)

    if (rect) {
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 4
      addText(getQuitCopy(newCount), cx, cy)
      burst(cx, cy + rect.height / 2)
    }

    const SPECIAL = new Set([66, 88, 99, 188, 233, 250, 520, 666, 888, 999, 1000, 1314])
    if (newCount % 10 === 0 || SPECIAL.has(newCount)) {
      if (newCount >= 200) playAlarm()
      else playMilestone()
      setMilestone(newCount)
    }
  }, [count, onQuit, addText, burst])

  return (
    <>
      <FloatingText texts={texts} />
      <Particles particles={particles} />
      <MilestoneModal count={milestone} onClose={() => setMilestone(0)} />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-6">
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
          className="text-3xl font-bold"
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
          className="cursor-pointer select-none drop-shadow-lg"
          style={{ WebkitTapHighlightColor: 'transparent' }}
        >
          <motion.div
            whileTap={{ scale: [1, 0.85, 1.1, 1] }}
            transition={{ duration: 0.3 }}
          >
            <WoodFishSVG crying={crying} cryKey={cryKey} />
          </motion.div>
        </motion.div>

        <p className="text-base" style={{ color: '#a0856a' }}>点一下，让情绪有个出口 💢</p>
      </div>
    </>
  )
}

function WoodFishSVG({ crying, cryKey }) {
  return (
    <svg width="220" height="220" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* 木质径向渐变 */}
        <radialGradient id="bodyGrad" cx="42%" cy="38%" r="58%">
          <stop offset="0%" stopColor="#E8A06A" />
          <stop offset="40%" stopColor="#C47A3A" />
          <stop offset="100%" stopColor="#7A4520" />
        </radialGradient>
        {/* 顶部高光 */}
        <radialGradient id="highlightGrad" cx="40%" cy="30%" r="50%">
          <stop offset="0%" stopColor="#F5C990" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#F5C990" stopOpacity="0" />
        </radialGradient>
        {/* 底部阴影 */}
        <radialGradient id="shadowGrad" cx="50%" cy="80%" r="50%">
          <stop offset="0%" stopColor="#3A1A00" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#3A1A00" stopOpacity="0" />
        </radialGradient>
        <filter id="dropShadow">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#5A2D00" floodOpacity="0.35" />
        </filter>
        <clipPath id="bodyClip">
          <ellipse cx="108" cy="112" rx="72" ry="66" />
        </clipPath>
      </defs>

      {/* 槌子 */}
      <g transform="rotate(-38, 170, 60)">
        {/* 槌头 */}
        <ellipse cx="170" cy="52" rx="11" ry="11" fill="#A0522D" />
        <ellipse cx="170" cy="52" rx="9" ry="9" fill="#C4763A" />
        <ellipse cx="168" cy="49" rx="4" ry="3" fill="#E8A870" opacity="0.5" />
        {/* 槌柄 */}
        <rect x="168" y="62" width="5" height="52" rx="2.5" fill="#8B4513" />
        <rect x="169" y="62" width="2" height="52" rx="1" fill="#C4763A" opacity="0.4" />
      </g>

      {/* 木鱼主体 — 投影 */}
      <ellipse cx="110" cy="125" rx="68" ry="18" fill="#3A1A00" opacity="0.18" />

      {/* 木鱼主体 */}
      <g filter="url(#dropShadow)">
        <ellipse cx="108" cy="112" rx="72" ry="66" fill="url(#bodyGrad)" />
      </g>

      {/* 木纹线条 */}
      <g clipPath="url(#bodyClip)" opacity="0.13">
        <ellipse cx="108" cy="112" rx="60" ry="54" fill="none" stroke="#7A4520" strokeWidth="1.5" />
        <ellipse cx="108" cy="112" rx="48" ry="42" fill="none" stroke="#7A4520" strokeWidth="1.2" />
        <ellipse cx="108" cy="112" rx="36" ry="30" fill="none" stroke="#7A4520" strokeWidth="1" />
        <ellipse cx="108" cy="112" rx="24" ry="19" fill="none" stroke="#7A4520" strokeWidth="0.8" />
      </g>

      {/* 鱼鳞纹（弧线组） */}
      <g clipPath="url(#bodyClip)" opacity="0.22" stroke="#7A3510" strokeWidth="1.2" fill="none">
        {/* 第一排 */}
        <path d="M72 95 Q80 85 88 95" /><path d="M88 95 Q96 85 104 95" />
        <path d="M104 95 Q112 85 120 95" /><path d="M120 95 Q128 85 136 95" />
        {/* 第二排（错位） */}
        <path d="M80 108 Q88 98 96 108" /><path d="M96 108 Q104 98 112 108" />
        <path d="M112 108 Q120 98 128 108" />
        {/* 第三排 */}
        <path d="M72 121 Q80 111 88 121" /><path d="M88 121 Q96 111 104 121" />
        <path d="M104 121 Q112 111 120 121" /><path d="M120 121 Q128 111 136 121" />
      </g>

      {/* 高光 */}
      <ellipse cx="108" cy="112" rx="72" ry="66" fill="url(#highlightGrad)" />
      <ellipse cx="108" cy="112" rx="72" ry="66" fill="url(#shadowGrad)" />

      {/* 中间开口缝 */}
      <path
        d="M60 112 Q80 104 108 107 Q136 104 156 112"
        stroke="#4A2000"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M60 112 Q80 120 108 117 Q136 120 156 112"
        stroke="#4A2000"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      {/* 缝内阴影 */}
      <path
        d="M62 112 Q80 106 108 109 Q136 106 154 112 Q136 118 108 115 Q80 118 62 112 Z"
        fill="#2A1000"
        opacity="0.6"
      />

      {/* 鱼头圆弧装饰（右侧） */}
      <path d="M155 100 Q168 112 155 124" stroke="#9A5020" strokeWidth="2.5" fill="none" opacity="0.5" />
      {/* 鱼尾装饰（左侧） */}
      <path d="M50 98 Q38 105 42 112 Q38 119 50 126" stroke="#9A5020" strokeWidth="2" fill="none" opacity="0.4" />

      {/* 顶部小圆钮 */}
      <ellipse cx="108" cy="48" rx="10" ry="7" fill="#8B4513" />
      <ellipse cx="108" cy="46" rx="8" ry="5" fill="#C4763A" />
      <ellipse cx="106" cy="44" rx="3" ry="2" fill="#E8A870" opacity="0.5" />

      {/* 红色漆面点缀 */}
      <circle cx="145" cy="95" r="4" fill="#CC3300" opacity="0.7" />
      <circle cx="145" cy="95" r="2.5" fill="#FF6644" opacity="0.6" />
      <circle cx="71" cy="95" r="4" fill="#CC3300" opacity="0.7" />
      <circle cx="71" cy="95" r="2.5" fill="#FF6644" opacity="0.6" />

      {/* 眼睛 — 正常：圆点；哭泣：大叉眼 + 泪柱 + 红晕 */}
      {!crying ? (
        <g>
          <ellipse cx="122" cy="96" rx="5" ry="4.5" fill="#3A1500" />
          <ellipse cx="121" cy="94.5" rx="2" ry="1.5" fill="#fff" opacity="0.5" />
          <ellipse cx="94" cy="96" rx="5" ry="4.5" fill="#3A1500" />
          <ellipse cx="93" cy="94.5" rx="2" ry="1.5" fill="#fff" opacity="0.5" />
        </g>
      ) : (
        <g key={cryKey}>
          {/* 红晕腮红 */}
          <ellipse cx="136" cy="108" rx="10" ry="6" fill="#FF8FAB" opacity="0.45" />
          <ellipse cx="80" cy="108" rx="10" ry="6" fill="#FF8FAB" opacity="0.45" />
          {/* 大叉眼 × × */}
          <line x1="116" y1="90" x2="128" y2="102" stroke="#3A1500" strokeWidth="4" strokeLinecap="round" />
          <line x1="128" y1="90" x2="116" y2="102" stroke="#3A1500" strokeWidth="4" strokeLinecap="round" />
          <line x1="88" y1="90" x2="100" y2="102" stroke="#3A1500" strokeWidth="4" strokeLinecap="round" />
          <line x1="100" y1="90" x2="88" y2="102" stroke="#3A1500" strokeWidth="4" strokeLinecap="round" />
          {/* 泪柱：用 framer-motion 驱动，key 保证每次重播 */}
          <motion.rect key={`t1-${cryKey}`} x="120" y="102" width="5" height="18" rx="2.5" fill="#5BB8F0"
            initial={{ scaleY: 0, opacity: 1, originY: 0 }}
            animate={{ scaleY: 1, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeIn' }}
            style={{ transformOrigin: '122px 102px' }}
          />
          <motion.rect key={`t2-${cryKey}`} x="92" y="102" width="5" height="18" rx="2.5" fill="#5BB8F0"
            initial={{ scaleY: 0, opacity: 1 }}
            animate={{ scaleY: 1, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeIn' }}
            style={{ transformOrigin: '94px 102px' }}
          />
          {/* 泪滴圆头 */}
          <motion.circle key={`d1-${cryKey}`} cx="122.5" cy="121" r="4" fill="#5BB8F0"
            initial={{ cy: 104, opacity: 1, r: 3 }}
            animate={{ cy: 126, opacity: 0, r: 5 }}
            transition={{ duration: 0.5, ease: 'easeIn' }}
          />
          <motion.circle key={`d2-${cryKey}`} cx="94.5" cy="121" r="4" fill="#5BB8F0"
            initial={{ cy: 104, opacity: 1, r: 3 }}
            animate={{ cy: 126, opacity: 0, r: 5 }}
            transition={{ duration: 0.5, ease: 'easeIn' }}
          />
        </g>
      )}
    </svg>
  )
}
