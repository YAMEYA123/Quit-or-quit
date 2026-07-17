let ctx = null

async function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') await ctx.resume()
  return ctx
}

// 预热 AudioContext，在页面首次点击时调用
export function warmup() {
  try { getCtx() } catch {}
}

export async function playWoodfish() {
  try {
    const ac = await getCtx()
    const now = ac.currentTime

    // 主体共鸣：低频敲击感
    const osc1 = ac.createOscillator()
    const gain1 = ac.createGain()
    osc1.connect(gain1)
    gain1.connect(ac.destination)
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(180, now)
    osc1.frequency.exponentialRampToValueAtTime(120, now + 0.35)
    gain1.gain.setValueAtTime(0.55, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc1.start(now)
    osc1.stop(now + 0.35)

    // 敲击高频点击感
    const osc2 = ac.createOscillator()
    const gain2 = ac.createGain()
    osc2.connect(gain2)
    gain2.connect(ac.destination)
    osc2.type = 'triangle'
    osc2.frequency.setValueAtTime(900, now)
    osc2.frequency.exponentialRampToValueAtTime(400, now + 0.06)
    gain2.gain.setValueAtTime(0.3, now)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06)
    osc2.start(now)
    osc2.stop(now + 0.06)

    // 木质泛音
    const osc3 = ac.createOscillator()
    const gain3 = ac.createGain()
    osc3.connect(gain3)
    gain3.connect(ac.destination)
    osc3.type = 'sine'
    osc3.frequency.setValueAtTime(360, now)
    osc3.frequency.exponentialRampToValueAtTime(240, now + 0.25)
    gain3.gain.setValueAtTime(0.2, now)
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.25)
    osc3.start(now)
    osc3.stop(now + 0.25)
  } catch {}
}

export async function playAchievement() {
  try {
    const ac = await getCtx()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.1
      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15)
      osc.start(t)
      osc.stop(t + 0.15)
    })
  } catch {}
}

export async function playFishBubble() {
  try {
    const ac = await getCtx()
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.connect(gain)
    gain.connect(ac.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(800, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(1200, ac.currentTime + 0.1)
    gain.gain.setValueAtTime(0.2, ac.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.1)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + 0.1)
  } catch {}
}

export async function playMilestone() {
  try {
    const ac = await getCtx()
    const notes = [392, 494, 587, 784, 987]
    notes.forEach((freq, i) => {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'triangle'
      osc.frequency.value = freq
      const t = ac.currentTime + i * 0.12
      gain.gain.setValueAtTime(0.35, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      osc.start(t)
      osc.stop(t + 0.2)
    })
  } catch {}
}

export async function playAlarm() {
  try {
    const ac = await getCtx()
    for (let i = 0; i < 3; i++) {
      const osc = ac.createOscillator()
      const gain = ac.createGain()
      osc.connect(gain)
      gain.connect(ac.destination)
      osc.type = 'sawtooth'
      osc.frequency.value = 880
      const t = ac.currentTime + i * 0.25
      gain.gain.setValueAtTime(0.3, t)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
      osc.start(t)
      osc.stop(t + 0.2)
    }
  } catch {}
}
