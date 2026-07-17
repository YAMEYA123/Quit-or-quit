import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function RecoveryModal({ onRestore, onClose }) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errMsg, setErrMsg] = useState('')

  const handleSubmit = async () => {
    const trimmed = code.trim()
    if (!trimmed) return
    setStatus('loading')
    setErrMsg('')
    try {
      await onRestore(trimmed)
      setStatus('success')
    } catch (e) {
      if (e.message === 'NOT_FOUND') {
        setErrMsg('没找到这个证号，确认一下格式是否正确（MYZ-XXXXXX）')
      } else {
        setErrMsg(`找回失败：${e.message}`)
      }
      setStatus('error')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{ zIndex: 80, background: 'rgba(0,0,0,0.4)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose?.() }}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        style={{
          background: '#fff',
          borderRadius: '20px 20px 0 0',
          padding: '24px 20px 40px',
          width: '100%',
          maxWidth: 480,
        }}
      >
        {status === 'success' ? (
          <div className="text-center py-4 flex flex-col gap-3">
            <div style={{ fontSize: 40 }}>🐟</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>数据已找回！</p>
            <p style={{ fontSize: 13, color: '#AAA' }}>摸鱼记录已搬过来，继续摸 🐟</p>
            <button
              onClick={onClose}
              style={{ marginTop: 8, background: '#4A7C59', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              好嘞，继续摸
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>
                换设备找回摸鱼记录
              </h3>
              {onClose && (
                <button onClick={onClose} style={{ color: '#AAA', fontSize: 20, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
              )}
            </div>

            <p style={{ fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
              输入你的摸鱼证号（格式：MYZ-XXXXXX），把历史数据搬到这台设备。
            </p>

            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="MYZ-XXXXXX"
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%',
                border: '1px solid #ECEAE6',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 15,
                fontFamily: 'monospace',
                color: '#1A1A1A',
                outline: 'none',
                marginBottom: 8,
                boxSizing: 'border-box',
              }}
            />

            <AnimatePresence>
              {errMsg && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={{ fontSize: 12, color: '#C94B1A', marginBottom: 8 }}
                >
                  {errMsg}
                </motion.p>
              )}
            </AnimatePresence>

            <p style={{ fontSize: 11, color: '#CCC', marginBottom: 12 }}>
              在旧设备的统计页可以查到你的摸鱼证号
            </p>

            <button
              onClick={handleSubmit}
              disabled={status === 'loading' || !code.trim()}
              style={{
                width: '100%',
                background: code.trim() ? '#4A7C59' : '#E8E8E8',
                color: code.trim() ? '#fff' : '#AAA',
                border: 'none',
                borderRadius: 12,
                padding: '14px',
                fontSize: 15,
                fontWeight: 600,
                cursor: code.trim() ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
            >
              {status === 'loading' ? '找回中…' : '找回我的摸鱼记录'}
            </button>
          </>
        )}
      </motion.div>
    </div>,
    document.body
  )
}
