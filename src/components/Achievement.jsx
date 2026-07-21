import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { getAchievementAward, getAchievementAwardById } from '../utils/copy'
import { playAchievement } from '../utils/audio'

const LAST_AWARD_KEY = 'quit_last_achievement_award'
const CONFETTI_COLORS = ['#D7A62A', '#B85F45', '#497D72', '#765C9E']

function loadSavedAward() {
  try {
    return getAchievementAwardById(localStorage.getItem(LAST_AWARD_KEY))
  } catch {
    return null
  }
}

function milestoneCopy(count) {
  if (count >= 20) return '怀疑你偷偷换了工作'
  if (count >= 10) return '建议主动要求表扬'
  if (count >= 5) return '今日职场高光选手'
  if (count >= 3) return '状态居然不错'
  if (count >= 1) return '今天没有完全白过'
  return '今天还没有正式表扬自己'
}

function ConfettiBurst({ burst, reducedMotion }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!burst || reducedMotion) return
    setPieces(Array.from({ length: 12 }, (_, index) => ({
      id: `${burst}-${index}`,
      x: -105 + Math.random() * 210,
      y: -70 - Math.random() * 90,
      rotate: -160 + Math.random() * 320,
      color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    })))
    const timer = setTimeout(() => setPieces([]), 900)
    return () => clearTimeout(timer)
  }, [burst, reducedMotion])

  return (
    <div className="pointer-events-none absolute inset-0 z-20 grid place-items-center overflow-hidden">
      {pieces.map((piece) => (
        <motion.span
          key={piece.id}
          initial={{ x: 0, y: 30, rotate: 0, opacity: 1, scale: 0.8 }}
          animate={{ x: piece.x, y: piece.y, rotate: piece.rotate, opacity: 0, scale: 1.1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute h-2.5 w-1.5 rounded-sm"
          style={{ background: piece.color }}
        />
      ))}
    </div>
  )
}

function AwardCard({ award, awarding, achievementCount, burst, reducedMotion }) {
  return (
    <div className="relative w-full max-w-[350px]">
      <ConfettiBurst burst={burst} reducedMotion={reducedMotion} />
      <AnimatePresence mode="wait">
        <motion.article
          key={award?.id || 'empty'}
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 18, rotateY: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.38, ease: 'easeOut' }}
          className="relative min-h-[285px] overflow-hidden rounded-[26px] border border-[#E8D7AA] bg-[#FFF9E9] px-7 py-6 text-center shadow-[0_18px_50px_rgba(112,80,25,0.13)]"
        >
          <div className="absolute inset-x-5 top-4 h-px bg-[#D9BE7B]/55" />
          <div className="absolute inset-x-5 bottom-4 h-px bg-[#D9BE7B]/55" />
          <div className="flex items-center justify-between text-[10px] font-bold tracking-[0.2em] text-[#8D7544]">
            <span>打工人内部表彰</span>
            <span>NO.{String(Math.max(achievementCount, 1)).padStart(3, '0')}</span>
          </div>

          {award ? (
            <>
              <motion.div
                initial={reducedMotion ? false : { scale: 0.4, rotate: -12 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.14, type: 'spring', stiffness: 260, damping: 16 }}
                className="mt-6 text-5xl"
              >
                {award.emoji}
              </motion.div>
              <p className="mt-4 text-[11px] font-bold tracking-[0.22em]" style={{ color: award.accent }}>今日获得称号</p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-[#2B2924]">{award.title}</h3>
              <p className="mx-auto mt-3 max-w-[255px] text-sm leading-6 text-[#716A5D]">{award.description}</p>
              <p className="mt-6 text-[10px] tracking-[0.16em] text-[#A19784]">打工人互助总局 · 颁发</p>
              <motion.div
                initial={reducedMotion ? false : { opacity: 0, scale: 1.8, rotate: -24 }}
                animate={{ opacity: 0.78, scale: 1, rotate: -12 }}
                transition={{ delay: 0.28, type: 'spring', stiffness: 300, damping: 18 }}
                className="absolute bottom-6 right-5 grid h-16 w-16 place-items-center rounded-full border-[3px] border-double border-[#B14C3F] text-[10px] font-black leading-4 text-[#B14C3F]"
              >
                今日<br />认证
              </motion.div>
            </>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center">
              <div className="text-5xl grayscale opacity-50">🏅</div>
              <h3 className="mt-5 text-xl font-black text-[#3D3931]">今日还没有颁奖</h3>
              <p className="mt-2 text-sm leading-6 text-[#8B8374]">做成一件小事，<br />也值得正式表扬。</p>
            </div>
          )}

          {awarding && <div className="absolute inset-0 bg-white/20" />}
        </motion.article>
      </AnimatePresence>
    </div>
  )
}

export default function Achievement({ count, onAdd }) {
  const reducedMotion = useReducedMotion()
  const [award, setAward] = useState(() => loadSavedAward() || (count > 0 ? getAchievementAward() : null))
  const [isAwarding, setIsAwarding] = useState(false)
  const [burst, setBurst] = useState(0)
  const unlockTimerRef = useRef(null)

  const handleClick = async () => {
    if (isAwarding) return
    setIsAwarding(true)
    playAchievement()
    const nextAward = getAchievementAward(award?.id)

    try {
      await onAdd()
      setAward(nextAward)
      setBurst((value) => value + 1)
      try { localStorage.setItem(LAST_AWARD_KEY, nextAward.id) } catch {}
    } finally {
      clearTimeout(unlockTimerRef.current)
      unlockTimerRef.current = setTimeout(() => setIsAwarding(false), reducedMotion ? 180 : 600)
    }
  }

  useEffect(() => () => clearTimeout(unlockTimerRef.current), [])

  const litBadges = Math.min(count, 5)

  return (
    <div className="flex-1 flex flex-col items-center gap-4 py-3 pb-7">
      <div className="flex w-full items-end justify-between px-1">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">打工人互助总局</p>
          <h2 className="mt-1 text-2xl font-black text-slate-800">职场夸夸机</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">今日高光</p>
          <p className="text-lg font-black text-slate-700">{count}<span className="ml-1 text-xs font-medium">次</span></p>
        </div>
      </div>

      <div className="flex flex-1 w-full flex-col items-center justify-center gap-4">
        <AwardCard award={award} awarding={isAwarding} achievementCount={count} burst={burst} reducedMotion={reducedMotion} />

        <motion.button
          whileTap={{ scale: 0.95 }}
          disabled={isAwarding}
          onClick={handleClick}
          className="w-full max-w-[350px] rounded-2xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-lg shadow-slate-500/20 disabled:cursor-wait disabled:opacity-70"
        >
          {isAwarding ? '正在走内部流程……' : '给自己颁个奖'}
        </motion.button>

        <div className="w-full max-w-[350px] rounded-2xl border border-slate-200/80 bg-white/75 px-5 py-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">今日奖章</span>
            <span className="text-xs text-slate-400">{count >= 5 ? `已获得 ${count} 枚` : `${count} / 5`}</span>
          </div>
          <div className="mt-3 flex gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <motion.span
                key={index}
                animate={{ scale: index < litBadges ? 1 : 0.82, opacity: index < litBadges ? 1 : 0.28 }}
                className="h-2.5 flex-1 rounded-full bg-[#D7A62A]"
              />
            ))}
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-700">{milestoneCopy(count)}</p>
        </div>
      </div>
    </div>
  )
}
