import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { FEEDBACK_CATEGORIES, submitFeedback } from '../utils/feedback'

const errorCopy = {
  CATEGORY_INVALID: '先选一个纸条类别吧',
  CONTENT_SHORT: '至少写两句话里的两字也行',
  CONTENT_LONG: '纸条太长啦，控制在 500 字以内',
  CONTACT_LONG: '联系方式控制在 100 个字以内',
  RATE_LIMIT: '纸条刚刚已经投递过啦，稍等一分钟再来',
}

export default function FeedbackModal({ onClose }) {
  const [category, setCategory] = useState('suggestion')
  const [content, setContent] = useState('')
  const [contact, setContact] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    setStatus('loading')
    setError('')
    try {
      await submitFeedback({ category, content, contact })
      setStatus('success')
    } catch (err) {
      setError(errorCopy[err.message] || '纸条没有投递成功，请稍后再试')
      setStatus('error')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{ zIndex: 90, background: 'rgba(20, 18, 15, 0.42)' }}
      onClick={event => event.target === event.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        style={{ background: '#FFFCF8', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 480, padding: '22px 20px 34px' }}
      >
        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 py-5 text-center">
            <div style={{ fontSize: 42 }}>📮</div>
            <h3 id="feedback-title" style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>纸条已投递</h3>
            <p style={{ fontSize: 13, color: '#888' }}>产品组会认真读的，先去摸会儿鱼吧。</p>
            <button onClick={onClose} style={{ marginTop: 8, width: '100%', border: 0, borderRadius: 12, padding: 13, background: '#1A1A1A', color: '#fff', fontSize: 14, fontWeight: 600 }}>收好，继续摸</button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <h3 id="feedback-title" style={{ fontSize: 17, fontWeight: 700, color: '#1A1A1A' }}>给产品组递纸条</h3>
                <p style={{ marginTop: 4, fontSize: 12, color: '#999' }}>夸夸、吐槽、许愿，都可以写在这里。</p>
              </div>
              <button onClick={onClose} aria-label="关闭" style={{ border: 0, background: 'none', color: '#AAA', fontSize: 22, lineHeight: 1 }}>×</button>
            </div>

            <div className="flex flex-wrap gap-2" style={{ marginTop: 18 }}>
              {FEEDBACK_CATEGORIES.map(item => (
                <button
                  key={item.value}
                  onClick={() => setCategory(item.value)}
                  aria-pressed={category === item.value}
                  style={{ border: `1px solid ${category === item.value ? '#1A1A1A' : '#E9E3DC'}`, background: category === item.value ? '#1A1A1A' : '#fff', color: category === item.value ? '#fff' : '#666', borderRadius: 999, padding: '7px 11px', fontSize: 12 }}
                >{item.label}</button>
              ))}
            </div>

            <textarea
              value={content}
              onChange={event => setContent(event.target.value)}
              placeholder="比如：摸鱼游戏第三关太难了……"
              maxLength={500}
              rows={4}
              style={{ width: '100%', boxSizing: 'border-box', resize: 'none', marginTop: 14, border: '1px solid #E9E3DC', borderRadius: 12, padding: '12px 13px', background: '#fff', color: '#1A1A1A', fontSize: 14, outline: 'none' }}
            />
            <div className="flex items-center justify-between" style={{ marginTop: 5 }}>
              <span style={{ fontSize: 11, color: '#BBB' }}>别写密码、手机号等隐私信息</span>
              <span style={{ fontSize: 11, color: '#BBB' }}>{content.length}/500</span>
            </div>
            <input value={contact} onChange={event => setContact(event.target.value)} maxLength={100} placeholder="想收到回复？留下联系方式（可选）" style={{ width: '100%', boxSizing: 'border-box', marginTop: 12, border: '1px solid #E9E3DC', borderRadius: 10, padding: '11px 13px', background: '#fff', color: '#1A1A1A', fontSize: 13, outline: 'none' }} />

            <AnimatePresence>
              {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 9, color: '#B34A2A', fontSize: 12 }}>{error}</motion.p>}
            </AnimatePresence>
            <button onClick={handleSubmit} disabled={status === 'loading'} style={{ width: '100%', marginTop: 14, border: 0, borderRadius: 12, padding: 14, background: '#1A1A1A', color: '#fff', fontSize: 14, fontWeight: 600, opacity: status === 'loading' ? 0.6 : 1 }}>
              {status === 'loading' ? '投递中…' : '投递这张纸条'}
            </button>
          </>
        )}
      </motion.div>
    </div>,
    document.body,
  )
}

