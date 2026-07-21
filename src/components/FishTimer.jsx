import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { playFishBubble } from '../utils/audio'

const ROUND_SECONDS = 30
const BEST_SCORE_KEY = 'quit_fish_game_best'
const FISH = ['🐟', '🐠', '🐡']
const LEVELS = [
  { level: 1, minTime: 21, label: '偷偷摸鱼', notice: '老板暂时不在', spawnDelay: 850, bossRate: 0.15 },
  { level: 2, minTime: 11, label: '熟练摸鱼', notice: '走廊传来脚步声……', spawnDelay: 650, bossRate: 0.25 },
  { level: 3, minTime: 0, label: '极限摸鱼', notice: '老板就在门口！', spawnDelay: 450, bossRate: 0.35 },
]

function levelForTime(timeLeft) {
  return LEVELS.find((item) => timeLeft >= item.minTime) || LEVELS[2]
}

function makeTarget(id, level) {
  const isBoss = Math.random() < level.bossRate
  return {
    id,
    type: isBoss ? 'boss' : 'fish',
    emoji: isBoss ? '👔' : FISH[Math.floor(Math.random() * FISH.length)],
    x: 8 + Math.random() * 76,
    y: 18 + Math.random() * 58,
    rotate: -12 + Math.random() * 24,
  }
}

function rankForScore(score) {
  if (score >= 35) return '老板视野盲区'
  if (score >= 25) return '办公室海王'
  if (score >= 16) return '摸鱼熟练工'
  if (score >= 8) return '带薪潜水员'
  return '工位新鱼'
}

function readBestScore() {
  try {
    return Number(localStorage.getItem(BEST_SCORE_KEY)) || 0
  } catch {
    return 0
  }
}

export default function FishTimer({ fishMinutes, onStop }) {
  const reduceMotion = useReducedMotion()
  const [phase, setPhase] = useState('idle')
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [level, setLevel] = useState(LEVELS[0])
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [avoidedBosses, setAvoidedBosses] = useState(0)
  const [bossHits, setBossHits] = useState(0)
  const [bestScore, setBestScore] = useState(readBestScore)
  const [isNewRecord, setIsNewRecord] = useState(false)
  const [target, setTarget] = useState(() => makeTarget(0, LEVELS[0]))
  const [feedback, setFeedback] = useState('')
  const [stageNotice, setStageNotice] = useState('')

  const targetIdRef = useRef(1)
  const targetRef = useRef(target)
  const targetHandledRef = useRef(false)
  const levelRef = useRef(LEVELS[0])
  const scoreRef = useRef(0)
  const bestStreakRef = useRef(0)
  const avoidedBossesRef = useRef(0)
  const bossHitsRef = useRef(0)
  const spawnTimerRef = useRef(null)
  const roundTimerRef = useRef(null)
  const noticeTimerRef = useRef(null)
  const finishedRef = useRef(false)

  const clearTimers = () => {
    clearInterval(roundTimerRef.current)
    clearTimeout(spawnTimerRef.current)
    clearTimeout(noticeTimerRef.current)
  }

  const spawnTarget = (countExpiredBoss = true) => {
    clearTimeout(spawnTimerRef.current)
    if (countExpiredBoss && !targetHandledRef.current && targetRef.current?.type === 'boss') {
      const next = avoidedBossesRef.current + 1
      avoidedBossesRef.current = next
      setAvoidedBosses(next)
    }

    const nextTarget = makeTarget(targetIdRef.current++, levelRef.current)
    targetRef.current = nextTarget
    targetHandledRef.current = false
    setTarget(nextTarget)
    spawnTimerRef.current = setTimeout(() => spawnTarget(true), levelRef.current.spawnDelay)
  }

  const finishRound = async () => {
    if (finishedRef.current) return
    finishedRef.current = true
    clearTimers()

    const finalScore = scoreRef.current
    const recordBroken = finalScore > bestScore
    setIsNewRecord(recordBroken)
    if (recordBroken) {
      setBestScore(finalScore)
      try { localStorage.setItem(BEST_SCORE_KEY, String(finalScore)) } catch {}
    }
    setPhase('result')
    await onStop(1)
  }

  const showStageNotice = (nextLevel) => {
    clearTimeout(noticeTimerRef.current)
    setStageNotice(nextLevel.notice)
    noticeTimerRef.current = setTimeout(() => setStageNotice(''), 900)
  }

  const startRound = () => {
    clearTimers()
    playFishBubble()
    finishedRef.current = false
    scoreRef.current = 0
    bestStreakRef.current = 0
    avoidedBossesRef.current = 0
    bossHitsRef.current = 0
    levelRef.current = LEVELS[0]
    setScore(0)
    setStreak(0)
    setBestStreak(0)
    setAvoidedBosses(0)
    setBossHits(0)
    setIsNewRecord(false)
    setFeedback('')
    setStageNotice('')
    setTimeLeft(ROUND_SECONDS)
    setLevel(LEVELS[0])
    setPhase('playing')
    spawnTarget(false)

    const startedAt = Date.now()
    roundTimerRef.current = setInterval(() => {
      const nextTime = Math.max(0, ROUND_SECONDS - Math.floor((Date.now() - startedAt) / 1000))
      setTimeLeft(nextTime)

      const nextLevel = levelForTime(nextTime)
      if (nextLevel.level !== levelRef.current.level) {
        levelRef.current = nextLevel
        setLevel(nextLevel)
        showStageNotice(nextLevel)
        spawnTarget(false)
      }
      if (nextTime === 0) finishRound()
    }, 250)
  }

  const hitTarget = () => {
    if (phase !== 'playing' || targetHandledRef.current) return
    targetHandledRef.current = true

    if (target.type === 'boss') {
      const nextScore = Math.max(0, scoreRef.current - 2)
      const nextHits = bossHitsRef.current + 1
      scoreRef.current = nextScore
      bossHitsRef.current = nextHits
      setScore(nextScore)
      setBossHits(nextHits)
      setStreak(0)
      setFeedback('老板来了！-2')
    } else {
      const nextScore = scoreRef.current + 1
      scoreRef.current = nextScore
      setScore(nextScore)
      setStreak((current) => {
        const next = current + 1
        bestStreakRef.current = Math.max(bestStreakRef.current, next)
        setBestStreak(bestStreakRef.current)
        return next
      })
      setFeedback(Math.random() > 0.5 ? '摸到了！+1' : '神不知鬼不觉 +1')
      playFishBubble()
    }
    spawnTarget(false)
  }

  useEffect(() => () => clearTimers(), [])

  const arenaTone = level.level === 3
    ? 'border-orange-200 bg-[#FDEBE2]'
    : level.level === 2
      ? 'border-sky-200 bg-[#DCEFF4]'
      : 'border-cyan-100 bg-[#DFF6F5]'

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

      <div className={`relative flex-1 min-h-[390px] overflow-hidden rounded-[28px] border shadow-[0_18px_50px_rgba(29,108,116,0.12)] transition-colors duration-500 ${arenaTone}`}>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/70 to-transparent" />
        <div className="pointer-events-none absolute -bottom-10 -left-8 h-36 w-36 rounded-full bg-cyan-300/30 blur-2xl" />
        <div className="pointer-events-none absolute -right-10 top-24 h-40 w-40 rounded-full bg-blue-300/25 blur-2xl" />

        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div key="idle" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 pb-2 pt-10 text-center">
              <motion.div animate={reduceMotion ? undefined : { y: [0, -8, 0], rotate: [-3, 3, -3] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} className="text-7xl">🐟</motion.div>
              <p className="mt-5 text-lg font-black text-slate-800">30 秒，能摸几条鱼？</p>
              <p className="mt-2 max-w-[280px] text-sm leading-6 text-slate-500">三段难度自动升级，点鱼得分，看到 👔 请收手。</p>
              <div className="mt-3 rounded-full bg-white/65 px-4 py-2 text-xs font-bold text-slate-500">本机最高纪录：{bestScore} 条</div>
              <motion.button whileTap={{ scale: 0.94 }} onClick={startRound} className="mt-6 rounded-2xl bg-slate-900 px-8 py-4 text-base font-bold text-white shadow-lg shadow-slate-500/20">开始偷偷摸鱼</motion.button>
            </motion.div>
          )}

          {phase === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
              <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
                <div>
                  <div className="rounded-full bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm backdrop-blur">摸到 <span className="text-lg text-cyan-700">{score}</span> 条</div>
                  <div className="mt-2 ml-1 text-[11px] font-bold tracking-wide text-slate-500">第 {level.level} 阶段 · {level.label}</div>
                </div>
                <motion.div animate={!reduceMotion && timeLeft <= 5 ? { scale: [1, 1.1, 1] } : undefined} transition={{ repeat: Infinity, duration: 0.6 }} className={`grid h-12 w-12 place-items-center rounded-full text-lg font-black shadow-sm ${timeLeft <= 5 ? 'bg-red-500 text-white' : 'bg-white/80 text-slate-700'}`}>{timeLeft}</motion.div>
              </div>

              <AnimatePresence>
                <motion.button key={target.id} type="button" aria-label={target.type === 'boss' ? '老板巡查，不要点击' : '摸鱼'} onClick={hitTarget} initial={{ scale: 0, opacity: 0 }} animate={{ scale: [0, 1.12, 1], opacity: 1, rotate: target.rotate }} exit={{ scale: 0.4, opacity: 0 }} transition={{ duration: 0.16 }} className={`absolute grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-4xl shadow-lg active:scale-90 ${target.type === 'boss' ? 'border-2 border-red-300 bg-red-50 ring-4 ring-red-300/25' : 'border-2 border-white/80 bg-white/75'}`} style={{ left: `${target.x}%`, top: `${target.y}%` }}>{target.emoji}</motion.button>
              </AnimatePresence>

              <AnimatePresence>
                {stageNotice && (
                  <motion.div key={stageNotice} initial={{ opacity: 0, scale: 0.82 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.08 }} className="pointer-events-none absolute inset-0 z-30 grid place-items-center">
                    <p className="rounded-2xl bg-slate-900/90 px-6 py-4 text-base font-black text-white shadow-xl">{stageNotice}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {feedback && <motion.p key={`${feedback}-${target.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute inset-x-0 bottom-9 text-center text-sm font-bold text-slate-600">{feedback}{streak >= 3 && target.type !== 'boss' ? ` · ${streak} 连摸` : ''}</motion.p>}
              </AnimatePresence>
            </motion.div>
          )}

          {phase === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-10 flex flex-col items-center justify-center px-8 pb-2 pt-10 text-center">
              <div className="text-5xl">🏖️</div>
              <p className="mt-3 text-xs font-bold tracking-widest text-cyan-700">本局摸鱼报告</p>
              {isNewRecord && <p className="mt-2 rounded-full bg-amber-300 px-3 py-1 text-xs font-black text-amber-950">新纪录！</p>}
              <p className="mt-1 text-6xl font-black tabular-nums text-slate-900">{score}</p>
              <p className="text-base font-black text-slate-700">{rankForScore(score)}</p>
              <p className="mt-1 text-xs text-slate-500">最高 {bestStreak} 连摸 · 躲过老板 {avoidedBosses} 次 · 被抓 {bossHits} 次</p>
              <p className="mt-4 w-full max-w-[300px] rounded-2xl bg-white/70 px-5 py-3 text-sm leading-6 text-slate-600">本机最高纪录 {bestScore} 条，下一局还能更隐蔽。</p>
              <motion.button whileTap={{ scale: 0.94 }} onClick={startRound} className="mt-5 rounded-2xl bg-slate-900 px-8 py-4 font-bold text-white">再摸一局</motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-center text-xs leading-5 text-slate-400">每局自动记作 1 分钟摸鱼 · 最高分仅保存在本机</p>
    </div>
  )
}
