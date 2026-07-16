import { motion, AnimatePresence } from 'framer-motion'

export default function MilestoneModal({ count, onClose }) {
  const isAlarm = count >= 100
  const emoji = count >= 100 ? '🚨' : count >= 50 ? '🏅' : '🎯'

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 flex items-center justify-center p-6 ${isAlarm ? 'alarm-flash' : 'bg-black/40'}`}
          style={{ zIndex: 100 }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            onClick={(e) => e.stopPropagation()}
            className={`rounded-3xl p-8 text-center max-w-xs w-full shadow-2xl ${isAlarm ? 'bg-red-50 border-4 border-red-400' : 'bg-white'}`}
          >
            <div className="text-6xl mb-4">{emoji}</div>
            <p className="text-lg font-bold mb-6" style={{ color: isAlarm ? '#dc2626' : '#FF8FAB' }}>
              {getMilestoneText(count)}
            </p>
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-full text-white font-bold text-sm"
              style={{ background: isAlarm ? '#dc2626' : '#FF8FAB' }}
            >
              {isAlarm ? '⚠️ 我知道了，我真的知道了' : '知道了，继续受苦'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function getMilestoneText(count) {
  if (count >= 100) return `🚨 第 ${count} 次！人类已到极限！`
  if (count >= 50) return `🏅 第 ${count} 次！你是传奇打工人！`
  if (count >= 30) return `💀 第 ${count} 次！三十而立，立于崩溃边缘`
  if (count >= 20) return `🌋 第 ${count} 次！火山即将爆发`
  return `🎯 第 ${count} 次达成！开始认真怀疑人生`
}
