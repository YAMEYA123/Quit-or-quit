import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { playFishBubble } from '../utils/audio'

const ROUND_SECONDS = 30
const FISH = ['🐟', '🐠', '🐡']

function makeTarget(id) {
  const isBoss = Math.random() < 0.2
  return {
    id,
    type: isBoss ? 'boss' : 'fish',
    emoji: isBoss ? '👔' : FISH[Math.floor(Math.random() * FISH.length)],
    x: 8 + Math.random() * 76,
    y: 12 + Math.random() * 66,
    rotate: -12 + Math.random() * 24,
  }
}

function resultCopy(score) {
  if (score >= 25) return '摸鱼界的水产大亨，老板完全没发现。'
  if (score >= 16) return '专业级摸鱼，手速和心态都很稳。'
  if (score >= 8) return '成功补充了一点上班所需的松弛感。'
  return '鱼没摸到几条，但班也没多上一分钟。'
}

export default function FishTimer({ fishMinutes, onStop }) {
  const [phase, setPhase] = useState('idle')
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [target, setTarget] = useState(() => makeTarget(0))
  const [feedback, setFeedback] = useState('')
  const targetIdRef = useRef(1)
  const scoreRef = useRef(0)
  const spawnTimerRef = useRef(null)
  const roundTimerRef = useRef(null)
  const finishedRef = useRef(false)

  const spawnTarget = () => {
    clearTimeout(spawnTimerRef.current)
    setTarget(makeTarget(targetIdRef.current++))
    spawnTimerRef.current = setTimeout(spawnTarget, 760)
  }

  const finishRound = async () => {
    if (finishedRef.current) return
    finishedRef.current = true
    clearInterval(roundTimerRef.current)
    clearTimeout(spawnTimerRef.current)
    setPhase('result')
    await onStop(1)
  }

  const startRound = () => {
    playFishBubble()
    finishedRef.current = false
    scoreRef.current = 0
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setFeedback('')
    setTimeLeft(ROUND_SECONDS)
    setPhase('playing')
    spawnTarget()

    const startedAt = Date.now()
    roundTimerRef.current = setInterval(() => {
      const next = Math.max(0, ROUND_SECONDS - Math.floor((Date.now() - startedAt) / 1000))
      setTimeLeft(next)
      if (next === 0) finishRound()
    }, 250)
  }

  const hitTarget = () => {
    if (phase !== 'playing') return

    if (target.type === 'boss') {
      const nextScore = Math.max(0, scoreRef.current - 2)
      scoreRef.current = nextScore
      setScore(nextScore)
      setStreak(0)
      setFeedback('老板来了！-2')
    } else {
      const nextScore = scoreRef.current + 1
      scoreRef.current = nextScore
      setScore(nextScore)
      setStreak((current) => {
        const next = current + 1
        setBestStreak((best) => Math.max(best, next))
        return next
      })
      setFeedback(Math.random() > 0.5 ? '摸到了！+1' : '神不知鬼不觉 +1')
      playFishBubble()
    }
    spawnTarget()
  }

  useEffect(() => () => {
    clearInterval(roundTimerRef.current)
    clearTimeout(spawnTimerRef.current)
  }, [])

  return (
    <div className="flex-1 flex flex-col gap-4 py-3 pb-7">
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-slate-400">工位秘密项目</p>
          <h2 className="mt-1 text-2xl font-black text-slate-800">摸鱼大作战</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">今日已摸</p>
          <p className="text-lg font-black text-slate-700">{fishMinutes}<span className="ml-1 text-xs font-medium">分钟</span></p>
        </div>
      </div>

      <div className="relative flex-1 min-h-[390px] overflow-hidden rounded-[28px] border border-cyan-100 bg-[#DFF6F5] shadow-[0_18px_50px_rgba(29,108,116,0.12)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/70 to-transparent" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-cyan-300/30 blur-2xl" />
        <div className="pointer-events-none absolute -right-10 top-24 h-40 w-40 rounded-full bg-blue-300/25 blur-2xl" />

        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 pb-2 pt-10 text-center"
            >
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [-3, 3, -3] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-7xl"
              >
                🐟
              </motion.div>
              <p className="mt-5 text-lg font-black text-slate-800">30 秒，能摸几条鱼？</p>
              <p className="mt-2 max-w-[280px] text-sm leading-6 text-slate-500">点鱼得分，看到 👔 请收手。<br />老板抓到一次，扣 2 分。</p>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={startRound}
                className="mt-7 rounded-2xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-lg shadow-slate-500/20"
              >
                开始偷偷摸鱼
              </motion.button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
              <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
                <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur">
                  摸到 <span className="text-lg text-cyan-700">{score}</span> 条
                </div>
                <div className={`grid h-12 w-12 place-items-center rounded-full text-lg font-black shadow-sm ${timeLeft <= 5 ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-700'}`}>
                  {timeLeft}
                </div>
              </div>

              <AnimatePresence>
                <motion.button
                  key={target.id}
                  type="button"
                  aria-label={target.type === 'boss' ? '老板巡查，不要点击' : '摸鱼'}
                  onClick={hitTarget}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: [0, 1.12, 1], opacity: 1, rotate: target.rotate }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ duration: 0.16 }}
                  className={`absolute grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-4xl shadow-lg active:scale-90 ${target.type === 'boss' ? 'border-2 border-red-200 bg-red-50' : 'border-2 border-white/80 bg-white/75'}`}
                  style={{ left: `${target.x}%`, top: `${target.y}%` }}
                >
                  {target.emoji}
                </motion.button>
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {feedback && (
                  <motion.p
                    key={`${feedback}-${target.id}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute inset-x-0 bottom-9 text-center text-sm font-bold text-slate-600"
                  >
                    {feedback}{streak >= 3 && target.type !== 'boss' ? ` · ${streak} 连摸` : ''}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {phase === 'result' && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 pb-2 pt-10 text-center"
            >
              <div className="text-6xl">🏖️</div>
              <p className="mt-5 text-sm font-bold tracking-widest text-cyan-700">本局摸鱼报告</p>
              <p className="mt-1 text-6xl font-black tabular-nums text-slate-900">{score}</p>
              <p className="text-sm text-slate-500">条鱼 · 最高 {bestStreak} 连摸</p>
              <p className="mt-5 w-full max-w-[300px] rounded-2xl bg-white/70 px-5 py-3 text-sm leading-6 text-slate-600">{resultCopy(score)}</p>
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={startRound}
                className="mt-6 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white"
              >
                再摸一局
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-xs leading-5 text-slate-400">每局自动记作 1 分钟摸鱼 · 游戏数据仅用于让上班没那么难熬</p>
    </div>
  )
}
