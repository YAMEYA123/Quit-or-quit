import supabase from '../lib/supabase'

async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function setRecoveryCode(userId, code) {
  if (!userId) throw new Error('NOT_AUTHED')
  const hash = await sha256(code.trim())
  const { error } = await supabase.from('quit_recovery_codes').upsert(
    { code_hash: hash, user_id: userId },
    { onConflict: 'user_id' }
  )
  if (error) {
    console.error('setRecoveryCode error:', error)
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

export function markRecoveryCodeSet() {
  localStorage.setItem('quit_recovery_set', '1')
}
