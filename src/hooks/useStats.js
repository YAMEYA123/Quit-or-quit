import { useState, useEffect, useCallback } from 'react'
import supabase from '../lib/supabase'

const todayStr = () => new Date().toISOString().slice(0, 10)

export default function useStats() {
  const [userId, setUserId] = useState(null)
  const [today, setToday] = useState({ quit_count: 0, achievement_count: 0, fish_minutes: 0 })
  const [history, setHistory] = useState([])

  useEffect(() => {
    async function init() {
      const { data: { session } } = await supabase.auth.getSession()
      let uid = session?.user?.id
      if (!uid) {
        const { data } = await supabase.auth.signInAnonymously()
        uid = data?.user?.id
      }
      if (!uid) return
      setUserId(uid)
      const { data } = await supabase
        .from('quit_daily_records')
        .select('*')
        .eq('user_id', uid)
        .eq('date', todayStr())
        .single()
      if (data) setToday(data)
    }
    init()
  }, [])

  const upsertRecord = useCallback(async (patch) => {
    if (!userId) return
    await supabase.from('quit_daily_records').upsert(
      { user_id: userId, date: todayStr(), ...patch, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date', ignoreDuplicates: false }
    )
  }, [userId])

  const addQuit = useCallback(async () => {
    const next = { ...today, quit_count: today.quit_count + 1 }
    setToday(next)
    try {
      await upsertRecord({ quit_count: next.quit_count })
    } catch {}
  }, [today, upsertRecord])

  const addAchievement = useCallback(async () => {
    const next = { ...today, achievement_count: today.achievement_count + 1 }
    setToday(next)
    try {
      await upsertRecord({ achievement_count: next.achievement_count })
    } catch {}
  }, [today, upsertRecord])

  const stopFish = useCallback(async (minutes) => {
    const next = { ...today, fish_minutes: today.fish_minutes + minutes }
    setToday(next)
    try {
      await upsertRecord({ fish_minutes: next.fish_minutes })
    } catch {}
  }, [today, upsertRecord])

  const loadHistory = useCallback(async (days = 7) => {
    if (!userId) return
    const from = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10)
    const { data } = await supabase
      .from('quit_daily_records')
      .select('date,quit_count,achievement_count,fish_minutes')
      .eq('user_id', userId)
      .gte('date', from)
      .order('date')
    setHistory(data || [])
  }, [userId])

  return { today, history, addQuit, addAchievement, stopFish, loadHistory }
}
