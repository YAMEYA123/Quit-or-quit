import { motion, AnimatePresence } from 'framer-motion'

export default function MilestoneModal({ count, onClose }) {
  const isAlarm = count >= 200
  const SPECIAL_EMOJI = { 3: '🌱', 7: '🍀', 13: '🔮', 21: '🌙', 34: '🎸', 42: '🌌', 55: '🖐️', 66: '🎰', 78: '🎱', 88: '🧧', 99: '🌹', 111: '🪄', 131: '🛫', 155: '🎧', 188: '💰', 200: '🚨', 233: '🤣', 250: '🦄', 300: '☢️', 333: '🔱', 404: '🕳️', 520: '💌', 666: '😈', 777: '🎰', 888: '🀄', 999: '🌙', 1000: '🎆', 1314: '💍' }
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
  3: '🌱 第三次！你已经开始认真不想干了',
  7: '🍀 第七次！今天的运气都用来忍耐了',
  13: '🔮 第十三次！预感今天还会继续崩',
  21: '🌙 第二十一次！月亮建议你早点下班',
  34: '🎸 第三十四次！职场摇滚，不如直接下班',
  42: '🌌 第四十二次！宇宙的答案是：先摸鱼',
  55: '🖐️ 第五十五次！五指山也压不住辞职心',
  66: '🎰 六六大顺！顺的是辞职的心',
  78: '🎱 第七十八次！这颗黑八球，打进辞职洞',
  88: '🧧 八八发发！发现自己真的不想干了',
  99: '🌹 九九归一：只剩辞职这一条路',
  111: '🪄 第一百一十一次！魔法也救不了这个班',
  131: '🛫 第一百三十一次！登机口已经为你开放',
  155: '🎧 第一百五十五次！戴上耳机，假装世界安静',
  188: '💰 一八八！大吉大利，今晚辞职',
  200: '🚨 第二百次！警报升级：建议打开招聘软件',
  233: '🤣 二三三！笑死，你还没走？',
  300: '☢️ 第三百次！核能打工人，辐射到全公司',
  333: '🔱 三百三十三次！三叉戟指向离职出口',
  404: '🕳️ 第四百零四次！工作意义 Not Found',
  520: '💌 五二零！我爱你，但不爱这工作',
  666: '😈 六六六！职场恶魔已降临',
  777: '🎰 七七七！大奖是：明天不用加班',
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
