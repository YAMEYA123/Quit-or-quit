import supabase from '../lib/supabase'
import { getDeviceId } from './deviceId'

const LAST_SUBMIT_KEY = 'quit_feedback_last_submit'
const COOLDOWN_MS = 60 * 1000

export const FEEDBACK_CATEGORIES = [
  { value: 'suggestion', label: '功能建议' },
  { value: 'usability', label: '页面不好用' },
  { value: 'game', label: '摸鱼游戏反馈' },
  { value: 'copy', label: '文案吐槽' },
  { value: 'other', label: '其他' },
]

export async function submitFeedback({ category, content, contact = '' }) {
  const text = String(content || '').trim()
  const note = String(contact || '').trim()
  if (!FEEDBACK_CATEGORIES.some(item => item.value === category)) throw new Error('CATEGORY_INVALID')
  if (text.length < 2) throw new Error('CONTENT_SHORT')
  if (text.length > 500) throw new Error('CONTENT_LONG')
  if (note.length > 100) throw new Error('CONTACT_LONG')

  const last = Number(localStorage.getItem(LAST_SUBMIT_KEY) || 0)
  if (Date.now() - last < COOLDOWN_MS) throw new Error('RATE_LIMIT')

  const { error } = await supabase.from('quit_feedback').insert({
    user_id: getDeviceId(),
    category,
    content: text,
    contact: note || null,
  })
  if (error) throw error
  localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()))
}

