import supabase from '../lib/supabase'

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function setRecoveryCode(deviceId, code) {
  const hash = await sha256(code.trim())
  const { error } = await supabase.from('quit_recovery_codes').upsert(
    { code_hash: hash, user_id: deviceId },
    { onConflict: 'user_id' }
  )
  if (error) {
    if (error.code === '23505') throw new Error('CODE_TAKEN')
    throw new Error(error.message || JSON.stringify(error))
  }
}

export async function findUserByCode(code) {
  const hash = await sha256(code.trim())
  const { data, error } = await supabase
    .from('quit_recovery_codes')
    .select('user_id')
    .eq('code_hash', hash)
    .maybeSingle()
  if (error) throw error
  return data?.user_id || null
}

export function hasRecoveryCode() {
  return !!localStorage.getItem('quit_recovery_set')
}

export function markRecoveryCodeSet(code) {
  localStorage.setItem('quit_recovery_set', '1')
  if (code) {
    localStorage.setItem('quit_fish_card_no', code)
    localStorage.setItem('quit_recovery_code', code) // 向后兼容
  }
}

export function getSavedCode() {
  return localStorage.getItem('quit_fish_card_no') || localStorage.getItem('quit_recovery_code') || null
}

function generateFishCardNo() {
  const n = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
  return `MYZ-${n}`
}

export function getOrCreateFishCardNo() {
  let no = localStorage.getItem('quit_fish_card_no')
  if (!no) {
    // 兼容老用户：旧代号迁移过来
    const legacy = localStorage.getItem('quit_recovery_code')
    no = legacy || generateFishCardNo()
    localStorage.setItem('quit_fish_card_no', no)
  }
  return no
}
