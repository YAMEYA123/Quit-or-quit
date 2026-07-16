import { useState, useEffect, useCallback, useRef } from 'react'
import supabase from '../lib/supabase'

const todayStr = () => new Date().toISOString().slice(0, 10)

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

export default function useStats() {
  const [userId, setUserId] = useState(null)
  const [today, setToday] = useState({ quit_count: 0, achievement_count: 0, fish_minutes: 0 })
  const [history, setHistory] = useState([])
  const userIdRef = useRef(null)

  useEffect(() => {
    // 监听 auth 状态变化，session 恢复或新登录都会触发
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const uid = session?.user?.id
      if (!uid) return
      userIdRef.current = uid
      setUserId(uid)
      const record = await fetchToday(uid)
      if (record) setToday(record)
    })

    // 触发初始检查：有 session 则复用，无则匿名登录
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) console.error('getSession error:', error)
      if (!session) {
        const { error: signInError } = await supabase.auth.signInAnonymously()
        if (signInError) console.error('signInAnonymously error:', signInError)
        // onAuthStateChange 会处理后续逻辑
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 用 RPC 原子自增，避免并发点击时覆盖问题
  const increment = useCallback(async (field) => {
    const uid = userIdRef.current
    if (!uid) return
    const { error } = await supabase.rpc('quit_increment_field', {
      p_user_id: uid,
      p_date: todayStr(),
      p_field: field,
    })
    if (error) {
      console.error('increment error:', error)
      // RPC 不存在时降级为 upsert
      await supabase.from('quit_daily_records').upsert(
        { user_id: uid, date: todayStr(), updated_at: new Date().toISOString() },
        { onConflict: 'user_id,date' }
      )
    }
  }, [])

  const addQuit = useCallback(() => {
    setToday(prev => ({ ...prev, quit_count: prev.quit_count + 1 }))
    increment('quit_count')
  }, [increment])

  const addAchievement = useCallback(() => {
    setToday(prev => ({ ...prev, achievement_count: prev.achievement_count + 1 }))
    increment('achievement_count')
  }, [increment])

  const stopFish = useCallback((minutes) => {
    setToday(prev => ({ ...prev, fish_minutes: prev.fish_minutes + minutes }))
    const uid = userIdRef.current
    if (!uid) return
    // 摸鱼分钟数累加，直接 upsert 当前值
    supabase.from('quit_daily_records').upsert(
      { user_id: uid, date: todayStr(), fish_minutes: minutes, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,date' }
    ).then(({ error }) => { if (error) console.error('stopFish error:', error) })
  }, [])

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
