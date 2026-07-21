const rand = (arr) => arr[Math.floor(Math.random() * arr.length)]

const QUIT_TIERS = [
  {
    max: 5,
    lines: [
      '工资会自动打卡的～',
      '摸摸头，下班还有好几小时',
      '深呼吸，你最棒的！',
      '今天辛苦了，晚上吃好的犒劳自己',
      '加油！你是最亮的星⭐',
      '微笑面对，甲方都怕你',
      '悄悄告诉你：周五快到了',
      '你比想象中更能扛！',
    ],
  },
  {
    max: 15,
    lines: [
      '深呼吸，你的房贷也在深呼吸',
      '坚持！绩效在看着你',
      '同事都在偷偷看你',
      '你的奶茶钱还需要这份工资',
      '忍一忍，年终奖还没发',
      '领导今天好像没看你',
      '摸摸鱼，假装在思考',
      '心情不好？喝水，喝水！',
      '今天的你格外有气场',
    ],
  },
  {
    max: 29,
    lines: [
      '你真的……还好吗？',
      '要不要喝杯水冷静一下',
      '今天的你格外有个性',
      '深呼吸三次，先',
      '我不评价，我只记录',
      '这个数字让我有点担心你',
      '建议先吃点东西',
      '你已经很厉害了，真的',
    ],
  },
  {
    max: 49,
    lines: [
      '你有没有想过……其实可以不干？',
      '简历上次更新是什么时候来着',
      '外面的世界也许更适合你',
      '你的才华值得更好的平台',
      '要不要悄悄投个简历试试',
      '离职不是失败，是新的开始',
      '你的极限在哪里？',
      '也许是时候认真想想了',
    ],
  },
  {
    max: 99,
    lines: [
      '朋友，走吧，外面世界很大',
      '辞职信模板已为你准备好',
      '你值得更好的工作环境',
      '人生苦短，不必将就',
      '你的才华被严重低估了',
      '走出这扇门，天空更蓝',
      '我帮你想好了：就说家里有事',
      '五险一金可以换地方交的',
    ],
  },
  {
    max: Infinity,
    lines: [
      '你为什么还在这里？！',
      '🚨 警报：人类已到极限',
      '这个数字已经超越了99%的打工人',
      '全公司都应该给你颁奖',
      '你是职场钢铁侠，无人能敌',
      '历史将铭记这一天',
      '请立即联系你的心理咨询师',
      '我们都为你骄傲……或者担心',
    ],
  },
]

export function getQuitCopy(count) {
  const tier = QUIT_TIERS.find((t) => count <= t.max)
  return rand(tier.lines)
}

const ACHIEVEMENT_AWARDS = [
  { id: 'meeting-survivor', title: '会议幸存者', description: '成功开完一场没什么必要的会议', emoji: '🎖️', accent: '#B98024' },
  { id: 'requirement-finisher', title: '需求终结者', description: '又处理完一条看起来永远改不完的需求', emoji: '⚔️', accent: '#B85F45' },
  { id: 'emotion-artist', title: '情绪稳定艺术家', description: '内心波涛汹涌，表面依然风平浪静', emoji: '🧘', accent: '#497D72' },
  { id: 'delivery-wizard', title: '准点交付魔法师', description: '在截止时间发现你之前完成了任务', emoji: '🪄', accent: '#765C9E' },
  { id: 'no-eye-roll', title: '没有翻白眼奖', description: '面对离谱发言，成功守住了职业素养', emoji: '😇', accent: '#A67527' },
  { id: 'urgent-request', title: '临时需求承受者', description: '接住了那句“这个应该很简单吧”', emoji: '🛡️', accent: '#4B7198' },
  { id: 'water-champion', title: '带薪喝水冠军', description: '认真补水，也是工作续航的重要部分', emoji: '🥤', accent: '#397C91' },
  { id: 'still-employed', title: '今日没有辞职奖', description: '又平稳度过了一个职业生涯观察日', emoji: '🏅', accent: '#B26A39' },
  { id: 'instant-reply', title: '消息秒回表演奖', description: '用专业手速营造了工作饱和的气氛', emoji: '⚡', accent: '#A36A22' },
  { id: 'desk-vibe', title: '工位气氛担当', description: '人坐在这里，团队就显得完整了一点', emoji: '🌤️', accent: '#44796D' },
  { id: 'sheet-master', title: '表格美化大师', description: '内容先不说，边框和配色已经很专业', emoji: '📊', accent: '#586D99' },
  { id: 'lunch-decider', title: '午饭决策终结者', description: '在有限午休里完成了最艰难的选择', emoji: '🍱', accent: '#A75F43' },
  { id: 'offwork-guardian', title: '下班时间守护者', description: '工作可以继续，今天必须先结束', emoji: '🕕', accent: '#5D6594' },
  { id: 'read-restraint', title: '已读不回克制奖', description: '深思熟虑后，决定稍后再深思熟虑', emoji: '🤐', accent: '#667665' },
]

export function getAchievementAward(previousId) {
  const candidates = ACHIEVEMENT_AWARDS.filter((award) => award.id !== previousId)
  return rand(candidates.length ? candidates : ACHIEVEMENT_AWARDS)
}

export function getAchievementAwardById(id) {
  return ACHIEVEMENT_AWARDS.find((award) => award.id === id) || null
}

export function getFishCopy(minutes) {
  if (minutes < 5) return '摸了个寂寞，但也是摸鱼！🐟'
  if (minutes < 15) return `摸了${minutes}分钟，刚好够喝杯茶☕`
  if (minutes < 30) return `${minutes}分钟！技术型摸鱼选手！`
  if (minutes < 60) return `${minutes}分钟！老板不知道的秘密！🤫`
  return `${minutes}分钟！！你是摸鱼界的天花板！🏆`
}

export function getLateNightCopy() {
  const lines = [
    '深夜还在上班……你还好吗？',
    '现在是摸鱼时间，也是回家时间',
    '月亮都出来了，去休息吧',
    '凌晨的不想干了，格外真诚',
  ]
  return rand(lines)
}
