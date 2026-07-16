import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { setRecoveryCode, markRecoveryCodeSet } from '../utils/recovery'

// mode: 'set' | 'restore'
export default function RecoveryModal({ mode, userId, onRestore, onClose }) {
  const [code, setCode] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [errMsg, setErrMsg] = useState('')

  const isSet = mode === 'set'

  const handleSubmit = async () => {
    const trimmed = code.trim()
    if (!trimmed) return
    setStatus('loading')
    setErrMsg('')
    try {
      if (isSet) {
        await setRecoveryCode(trimmed, userId)
        markRecoveryCodeSet()
        setStatus('success')
      } else {
        await onRestore(trimmed)
        // onRestore handles close on success
      }
    } catch (e) {
      if (e.message === 'CODE_TAKEN') {
        setErrMsg('此恢复码已被占用，换一个试试')
      } else if (e.message === 'NOT_FOUND') {
        setErrMsg('没有找到对应的记录，请检查恢复码')
      } else {
        setErrMsg('操作失败，请稍后重试')
      }
      setStatus('error')
    }
  }

  return (
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
            <div style={{ fontSize: 40 }}>✅</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>恢复码已保存</p>
            <p style={{ fontSize: 13, color: '#AAA' }}>清除缓存后，输入此码即可找回数据</p>
            <button
              onClick={onClose}
              style={{ marginTop: 8, background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 12, padding: '12px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              好的
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A1A' }}>
                {isSet ? '设置恢复码' : '输入恢复码'}
              </h3>
              {onClose && (
                <button onClick={onClose} style={{ color: '#AAA', fontSize: 20, lineHeight: 1 }}>×</button>
              )}
            </div>

            <p style={{ fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
              {isSet
                ? '设置一个你容易记住的恢复码（数字、文字均可）。清除浏览器缓存后，用此码可以找回历史数据。'
                : '请输入之前设置的恢复码，找回你的历史数据。'}
            </p>

            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={isSet ? '例如：上班好累123' : '输入恢复码'}
              maxLength={20}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{
                width: '100%',
                border: '1px solid #ECEAE6',
                borderRadius: 10,
                padding: '12px 14px',
                fontSize: 15,
                color: '#1A1A1A',
                outline: 'none',
                marginBottom: 8,
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

            {isSet && (
              <p style={{ fontSize: 11, color: '#CCC', marginBottom: 12 }}>
                请牢记此恢复码，系统无法帮你找回它
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={status === 'loading' || !code.trim()}
              style={{
                width: '100%',
                background: code.trim() ? '#1A1A1A' : '#E8E8E8',
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
              {status === 'loading' ? '处理中…' : isSet ? '保存恢复码' : '找回数据'}
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
