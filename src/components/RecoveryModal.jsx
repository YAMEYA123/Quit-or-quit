import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'

// mode: 'set' | 'restore'
export default function RecoveryModal({ mode, onSet, onRestore, onClose }) {
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
        await onSet(trimmed)
        setStatus('success')
      } else {
        await onRestore(trimmed)
        // onRestore handles close on success
      }
    } catch (e) {
      if (e.message === 'NOT_AUTHED') {
        setErrMsg('登录状态异常，请刷新页面后重试')
      } else if (e.message === 'CODE_TAKEN') {
        setErrMsg('此工号已被占用，换一个试试')
      } else if (e.message === 'NOT_FOUND') {
        setErrMsg('没有找到对应的记录，请检查恢复码')
      } else {
        setErrMsg(`操作失败：${e.message}`)
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
            <div style={{ fontSize: 40 }}>✅</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#1A1A1A' }}>恢复码已保存</p>
            <p style={{ fontSize: 13, color: '#AAA' }}>凭工号即可在任意设备找回数据</p>
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
                {isSet ? '绑定工号' : '输入工号找回数据'}
              </h3>
              {onClose && (
                <button onClick={onClose} style={{ color: '#AAA', fontSize: 20, lineHeight: 1 }}>×</button>
              )}
            </div>

            <p style={{ fontSize: 13, color: '#888', marginBottom: 16, lineHeight: 1.6 }}>
              {isSet
                ? '输入你的工号作为数据标识。换设备或清除缓存后，凭工号即可找回所有记录。'
                : '输入你绑定的工号，找回历史数据。'}
            </p>

            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={isSet ? '输入工号，例如：EMP001' : '输入工号'}
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
                工号就是你的数据钥匙，请确保记得它
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
              {status === 'loading' ? '处理中…' : isSet ? '绑定工号' : '找回数据'}
            </button>
          </>
        )}
      </motion.div>
    </div>,
    document.body
  )
}
