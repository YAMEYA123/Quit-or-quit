import { useState, useEffect, useCallback, useRef } from 'react'
import supabase from '../lib/supabase'

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

export default function useStats() {
  const date = todayStr()
  const [today, setToday] = useState(() => loadLocal(date) || { ...DEFAULT_TODAY })
  const [history, setHistory] = useState([])
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
        // no remote record yet — push local data up
        const local = loadLocal(date)
        if (local && (local.quit_count > 0 || local.achievement_count > 0 || local.fish_minutes > 0)) {
          upsertRecord(uid, date, local)
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
    const uid = userIdRef.current
    if (!uid) return
    const from = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('quit_daily_records')
      .select('date,quit_count,achievement_count,fish_minutes')
      .eq('user_id', uid)
      .gte('date', from)
      .order('date')
    if (error) console.error('loadHistory error:', error)
    setHistory(data || [])
  }, [])

  return { today, history, addQuit, addAchievement, stopFish, loadHistory }
}
