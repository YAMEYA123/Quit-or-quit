import { useState, useEffect, useCallback, useRef } from 'react'
import supabase from '../lib/supabase'
import { setRecoveryCode, findUserByCode, hasRecoveryCode, markRecoveryCodeSet, getSavedCode, getOrCreateFishCardNo } from '../utils/recovery'
import { getDeviceId } from '../utils/deviceId'

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

async function autoIssueFishCard(uid) {
  for (let i = 0; i < 3; i++) {
    const no = getOrCreateFishCardNo()
    markRecoveryCodeSet(no) // 先本地标记，用户立刻能看到证件号
    try {
      await setRecoveryCode(uid, no)
      localStorage.removeItem('quit_recovery_pending')
      return
    } catch (e) {
      if (e.message === 'CODE_TAKEN') {
        // 碰撞（百万分之一概率），清除后重新生成
        localStorage.removeItem('quit_fish_card_no')
        continue
      }
      // Supabase 暂时不可用，存 pending 下次启动重试
      localStorage.setItem('quit_recovery_pending', no)
      return
    }
  }
}

export default function useStats() {
  const date = todayStr()
  const [today, setToday] = useState(() => loadLocal(date) || { ...DEFAULT_TODAY })
  const [history, setHistory] = useState(() => loadLocalHistory(7))
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)
  const todayRef = useRef(today)

  // keep ref in sync so callbacks always have latest value
  useEffect(() => {
    todayRef.current = today
    saveLocal(date, today)
  }, [today, date])

  useEffect(() => {
    const uid = getDeviceId()

    async function init() {
      // 一次性迁移：把旧 Supabase Auth session 下的数据迁到设备 UUID
      // v2：换版本号强制重跑，覆盖之前可能因 FK 约束静默失败的迁移
      const migrationKey = 'quit_auth_migrated_v2'
      if (!localStorage.getItem(migrationKey)) {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          const oldUid = session?.user?.id
          if (oldUid && oldUid !== uid) {
            const from = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10)
            const { data: oldData, error } = await supabase
              .from('quit_daily_records')
              .select('date,quit_count,achievement_count,fish_minutes')
              .eq('user_id', oldUid)
              .gte('date', from)
            if (!error && oldData && oldData.length > 0) {
              // 先写 localStorage，不管 Supabase 是否成功数据都能显示
              oldData.forEach(r => saveLocal(r.date, r))
              setHistory(loadLocalHistory(7))
              // 再尝试写到 Supabase 新 UUID 下（需要先在 Supabase 删除 FK 约束）
              await Promise.all(oldData.map(r => upsertRecord(uid, r.date, r)))
              localStorage.setItem(migrationKey, '1')
            }
          } else {
            localStorage.setItem(migrationKey, '1')
          }
        } catch (e) {
          console.error('migration error:', e)
        }
      }

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
        const local = loadLocal(date)
        const hasLocal = local && (local.quit_count > 0 || local.achievement_count > 0 || local.fish_minutes > 0)
        if (hasLocal) {
          upsertRecord(uid, date, local)
        } else if (!hasRecoveryCode()) {
          autoIssueFishCard(uid)
        }
      }

      // 启动时重试上次未能同步到 Supabase 的工号绑定
      const pendingCode = localStorage.getItem('quit_recovery_pending')
      if (pendingCode) {
        setRecoveryCode(getDeviceId(), pendingCode)
          .then(() => localStorage.removeItem('quit_recovery_pending'))
          .catch(() => {})
      }
    }

    init()
  }, [date])

  const updateField = useCallback((field, delta = 1) => {
    setToday(prev => {
      const next = { ...prev, [field]: prev[field] + delta }
      saveLocal(date, next)
      upsertRecord(getDeviceId(), date, next)
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
    setHistory(loadLocalHistory(days))

    const uid = getDeviceId()
    const from = new Date(Date.now() - (days - 1) * 86400000).toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('quit_daily_records')
      .select('date,quit_count,achievement_count,fish_minutes')
      .eq('user_id', uid)
      .gte('date', from)
      .order('date')
    if (error) { console.error('loadHistory error:', error); return }
    if (data && data.length > 0) {
      const localMap = {}
      loadLocalHistory(days).forEach(r => { localMap[r.date] = r })
      const merged = data.map(r => ({
        ...r,
        quit_count: Math.max(r.quit_count || 0, localMap[r.date]?.quit_count || 0),
        achievement_count: Math.max(r.achievement_count || 0, localMap[r.date]?.achievement_count || 0),
        fish_minutes: Math.max(r.fish_minutes || 0, localMap[r.date]?.fish_minutes || 0),
      }))
      Object.keys(localMap).forEach(d => {
        if (!merged.find(r => r.date === d)) merged.push({ date: d, ...localMap[d] })
      })
      merged.sort((a, b) => a.date.localeCompare(b.date))
      setHistory(merged)
    }
  }, [])

  const loadMonthHistory = useCallback(async (year, month) => {
    const daysInMonth = new Date(year, month, 0).getDate()
    const localMap = {}
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const rec = loadLocal(dateStr)
      if (rec) localMap[dateStr] = rec
    }

    const uid = getDeviceId()
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

  const restoreFromCode = useCallback(async (code) => {
    const originalUid = await findUserByCode(code)
    if (!originalUid) throw new Error('NOT_FOUND')

    const currentUid = getDeviceId()
    const from = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10)
    const { data, error } = await supabase
      .from('quit_daily_records')
      .select('date,quit_count,achievement_count,fish_minutes')
      .eq('user_id', originalUid)
      .gte('date', from)
    if (error) throw error
    if (data) {
      data.forEach(r => { saveLocal(r.date, r) })
      await Promise.all(data.map(r => upsertRecord(currentUid, r.date, r)))
    }
    const todayRemote = data?.find(r => r.date === todayStr())
    if (todayRemote) {
      setToday(todayRemote)
      saveLocal(todayStr(), todayRemote)
    }
    setHistory(loadLocalHistory(7))
    setShowRestorePrompt(false)
    localStorage.setItem('quit_recovery_set', '1')
  }, [])

  const setRecovery = useCallback(async (code) => {
    // 先本地标记，确保即使 Supabase 失败用户体验也不受影响
    markRecoveryCodeSet(code)
    // 再尝试写入 Supabase；失败时存 pending，下次启动重试
    try {
      await setRecoveryCode(getDeviceId(), code)
      localStorage.removeItem('quit_recovery_pending')
    } catch (e) {
      // Supabase 暂时不可用（休眠/网络），本地已记录，下次启动自动同步
      localStorage.setItem('quit_recovery_pending', code)
    }
  }, [])

  return {
    today, history, addQuit, addAchievement, stopFish, loadHistory, loadMonthHistory,
    showRestorePrompt, setShowRestorePrompt, restoreFromCode, setRecovery,
    savedCode: getSavedCode(),
  }
}
