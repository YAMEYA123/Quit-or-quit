import { motion, AnimatePresence } from 'framer-motion'

export default function MilestoneModal({ count, onClose }) {
  const isAlarm = count >= 200
  const SPECIAL_EMOJI = { 66: '🎰', 88: '🧧', 99: '🌹', 188: '💰', 233: '🤣', 250: '🦄', 520: '💌', 666: '😈', 888: '🀄', 999: '🌙', 1000: '🎆', 1314: '💍' }
  const emoji = SPECIAL_EMOJI[count] || (count >= 500 ? '💫' : count >= 200 ? '👑' : count >= 100 ? '🚨' : count >= 50 ? '🏅' : '🎯')

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
              {isAlarm ? '👑 我已超越人类极限' : count >= 100 ? '⚠️ 我知道了，我真的知道了' : '知道了，继续受苦'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const MILESTONE_EXACT = {
  6: '🍀 六六大顺！开局不想干了',
  66: '🎰 六六大顺！顺的是辞职的心',
  88: '🧧 八八发发！发现自己真的不想干了',
  99: '🌹 九九归一：只剩辞职这一条路',
  188: '💰 一八八！大吉大利，今晚辞职',
  233: '🤣 二三三！笑死，你还没走？',
  520: '💌 五二零！我爱你，但不爱这工作',
  666: '😈 六六六！职场恶魔已降临',
  888: '🀄 八八八！发发发，发现辞职最香',
  999: '🌙 九九九！月满则亏，时候到了',
  1314: '💍 一三一四！一生一世不想上班！',
}

function getMilestoneText(count) {
  if (MILESTONE_EXACT[count]) return MILESTONE_EXACT[count]
  if (count >= 1000) return `🎆 第 ${count} 次！千次崩溃，永载史册！`
  if (count >= 500) return `💫 第 ${count} 次！打工人封神！立地成佛！`
  if (count >= 300) return `☢️ 第 ${count} 次！核能打工人！史无前例！`
  if (count >= 200) return `👑 第 ${count} 次！你已超越人类极限！`
  if (count >= 100) return `🚨 第 ${count} 次！人类已到极限！`
  if (count >= 50) return `🏅 第 ${count} 次！你是传奇打工人！`
  if (count >= 30) return `💀 第 ${count} 次！三十而立，立于崩溃边缘`
  if (count >= 20) return `🌋 第 ${count} 次！火山即将爆发`
  return `🎯 第 ${count} 次达成！开始认真怀疑人生`
}
