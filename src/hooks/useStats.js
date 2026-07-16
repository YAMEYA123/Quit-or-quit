import { useState, useEffect, useCallback, useRef } from 'react'
import supabase from '../lib/supabase'
import { findUserByCode, hasRecoveryCode } from '../utils/recovery'

const todayStr = () => new Date().toISOString().slice(0, 10)

const LS_KEY = (date) => `quit_stats_${date}`

function loadLocal(date) {
  try {
    const raw = localStorage.getItem(LS_KEY(date))
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveLocal(date, data) {
  try {
    localStorage.setItem(LS_KEY(date), JSON.stringify(data))
  } catch {}
}

const DEFAULT_TODAY = { quit_count: 0, achievement_count: 0, fish_minutes: 0 }

async function fetchToday(uid) {
  const { data, error } = await supabase
    .from('quit_daily_records')
    .select('*')
    .eq('user_id', uid)
    .eq('date', todayStr())
    .maybeSingle()
  if (error) console.error('fetchToday error:', error)
  return data
}

async function upsertRecord(uid, date, record) {
  const { error } = await supabase.from('quit_daily_records').upsert(
    { user_id: uid, date, ...record, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  )
  if (error) console.error('upsertRecord error:', error)
}

// 从 localStorage 拼出近 N 天的历史
function loadLocalHistory(days) {
  const result = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    const record = loadLocal(d)
    if (record && (record.quit_count > 0 || record.achievement_count > 0 || record.fish_minutes > 0)) {
      result.push({ date: d, ...record })
    }
  }
  return result
}

export default function useStats() {
  const date = todayStr()
  const [today, setToday] = useState(() => loadLocal(date) || { ...DEFAULT_TODAY })
  const [history, setHistory] = useState(() => loadLocalHistory(7))
  const [userId, setUserId] = useState(null)
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)
  const userIdRef = useRef(null)
  const todayRef = useRef(today)

  // keep ref in sync so callbacks always have latest value
  useEffect(() => {
    todayRef.current = today
    saveLocal(date, today)
  }, [today, date])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id
      if (!uid) return
      userIdRef.current = uid
      setUserId(uid)

      // fetch from Supabase; if remote has higher counts, use remote
      const remote = await fetchToday(uid)
      if (remote) {
        setToday(prev => {
          const merged = {
            quit_count: Math.max(prev.quit_count, remote.quit_count || 0),
            achievement_count: Math.max(prev.achievement_count, remote.achievement_count || 0),
            fish_minutes: Math.max(prev.fish_minutes, remote.fish_minutes || 0),
          }
          saveLocal(date, merged)
          return merged
        })
      } else {
        // no remote record — check if this is a fresh user who had a recovery code before
        const local = loadLocal(date)
        const hasLocal = local && (local.quit_count > 0 || local.achievement_count > 0 || local.fish_minutes > 0)
        if (hasLocal) {
          upsertRecord(uid, date, local)
        } else if (!hasRecoveryCode()) {
          // truly new user with no local data and no recovery code set — offer restore prompt
          // only show if user previously had a code (they cleared cache)
          // we detect this via absence of quit_recovery_set in localStorage
          // but since localStorage is cleared too, we show it briefly
          setShowRestorePrompt(true)
        }
      }
    })

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        await supabase.auth.signInAnonymously()
      }
    })

    return () => subscription.unsubscribe()
  }, [date])

  const updateField = useCallback((field, delta = 1) => {
    setToday(prev => {
      const next = { ...prev, [field]: prev[field] + delta }
      saveLocal(date, next)
      // async sync to Supabase
      const uid = userIdRef.current
      if (uid) upsertRecord(uid, date, next)
      return next
    })
  }, [date])

  const addQuit = useCallback(() => updateField('quit_count'), [updateField])
  const addAchievement = useCallback(() => updateField('achievement_count'), [updateField])

  const stopFish = useCallback((minutes) => {
    if (!minutes) return
    updateField('fish_minutes', minutes)
  }, [updateField])

  const loadHistory = useCallback(async (days = 7) => {
    // 先用本地数据展示，不等网络
    setHistory(loadLocalHistory(days))

    const uid = userIdRef.current
    if (!uid) return
    const from = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('quit_daily_records')
      .select('date,quit_count,achievement_count,fish_minutes')
      .eq('user_id', uid)
      .gte('date', from)
      .order('date')
    if (error) { console.error('loadHistory error:', error); return }
    if (data && data.length > 0) {
      // 合并：本地和远端取最大值
      const localMap = {}
      loadLocalHistory(days).forEach(r => { localMap[r.date] = r })
      const merged = data.map(r => ({
        ...r,
        quit_count: Math.max(r.quit_count || 0, localMap[r.date]?.quit_count || 0),
        achievement_count: Math.max(r.achievement_count || 0, localMap[r.date]?.achievement_count || 0),
        fish_minutes: Math.max(r.fish_minutes || 0, localMap[r.date]?.fish_minutes || 0),
      }))
      // 加入只有本地没有远端的日期
      Object.keys(localMap).forEach(d => {
        if (!merged.find(r => r.date === d)) merged.push({ date: d, ...localMap[d] })
      })
      merged.sort((a, b) => a.date.localeCompare(b.date))
      setHistory(merged)
    }
  }, [])

  const loadMonthHistory = useCallback(async (year, month) => {
    // 拼出该月所有日期的本地数据
    const daysInMonth = new Date(year, month, 0).getDate()
    const localMap = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const rec = loadLocal(dateStr)
      if (rec) localMap[dateStr] = rec
    }

    const uid = userIdRef.current
    if (!uid) return localMap

    const from = `${year}-${String(month).padStart(2, '0')}-01`
    const to = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    const { data, error } = await supabase
      .from('quit_daily_records')
      .select('date,quit_count,achievement_count,fish_minutes')
      .eq('user_id', uid)
      .gte('date', from)
      .lte('date', to)
    if (error) { console.error('loadMonthHistory error:', error); return localMap }
    if (data) {
      data.forEach(r => {
        const local = localMap[r.date] || {}
        localMap[r.date] = {
          quit_count: Math.max(r.quit_count || 0, local.quit_count || 0),
          achievement_count: Math.max(r.achievement_count || 0, local.achievement_count || 0),
          fish_minutes: Math.max(r.fish_minutes || 0, local.fish_minutes || 0),
        }
      })
    }
    return localMap
  }, [])

  // 用恢复码找回历史数据：将原 user_id 的 Supabase 数据拉取并写入本地
  const restoreFromCode = useCallback(async (code) => {
    const originalUid = await findUserByCode(code)
    if (!originalUid) throw new Error('NOT_FOUND')

    const currentUid = userIdRef.current
    // 拉取原用户的近180天数据写入本地
    const from = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('quit_daily_records')
      .select('date,quit_count,achievement_count,fish_minutes')
      .eq('user_id', originalUid)
      .gte('date', from)
    if (error) throw error
    if (data) {
      data.forEach(r => { saveLocal(r.date, r) })
      // 将这些数据重新上传到当前匿名用户名下
      await Promise.all(data.map(r => upsertRecord(currentUid, r.date, r)))
    }
    // 刷新今日数据
    const todayRemote = data?.find(r => r.date === todayStr())
    if (todayRemote) {
      setToday(todayRemote)
      saveLocal(todayStr(), todayRemote)
    }
    setHistory(loadLocalHistory(7))
    setShowRestorePrompt(false)
    localStorage.setItem('quit_recovery_set', '1')
  }, [])

  return {
    today, history, addQuit, addAchievement, stopFish, loadHistory, loadMonthHistory,
    userId, showRestorePrompt, setShowRestorePrompt, restoreFromCode,
  }
}
