let ctx = null

async function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') await ctx.resume()
  return ctx
}

// iOS Safari 需要在用户手势内播放一个静音 buffer 才能真正解锁 AudioContext
export async function warmup() {
  try {
    const ac = await getCtx()
    const buf = ac.createBuffer(1, 1, 22050)
    const src = ac.createBufferSource()
    src.buffer = buf
    src.connect(ac.destination)
    src.start(0)
  } catch {}
}

// zone: 0=顶部(高音) ~ 1=底部(低音)；intensity: 0=慢敲 ~ 1=狂敲(变沉变干)
export async function playWoodfish(zone = 0.5, intensity = 0) {
  try {
    const ac = await getCtx()
    const now = ac.currentTime

    // 根据 zone 计算基础频率（顶820Hz → 底430Hz）
    const baseFreq = 820 - zone * 390
    // intensity 让音调再下沉最多 80Hz，衰减缩短最多 30%
    const freq = baseFreq - intensity * 80
    const decay = (0.22 - zone * 0.10) * (1 - intensity * 0.3)

    // 瞬态噪声：槌头敲击的「咔」，顶部更脆（高频），底部更钝
    const bufLen = Math.floor(ac.sampleRate * 0.025)
    const noiseBuf = ac.createBuffer(1, bufLen, ac.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1
    const noise = ac.createBufferSource()
    noise.buffer = noiseBuf
    const noiseFilter = ac.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 2400 - zone * 1000
    noiseFilter.Q.value = 1.5
    const noiseGain = ac.createGain()
    noiseGain.gain.setValueAtTime(0.45, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ac.destination)
    noise.start(now)

    // 主体空鸣
    const body = ac.createOscillator()
    const bodyGain = ac.createGain()
    body.connect(bodyGain)
    bodyGain.connect(ac.destination)
    body.type = 'sine'
    body.frequency.setValueAtTime(freq, now)
    body.frequency.exponentialRampToValueAtTime(freq * 0.75, now + decay)
    bodyGain.gain.setValueAtTime(0.6, now)
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + decay)
    body.start(now)
    body.stop(now + decay + 0.01)

    // 二次谐波
    const harm = ac.createOscillator()
    const harmGain = ac.createGain()
    harm.connect(harmGain)
    harmGain.connect(ac.destination)
    harm.type = 'sine'
    harm.frequency.setValueAtTime(freq * 2, now)
    harm.frequency.exponentialRampToValueAtTime(freq * 1.5, now + decay * 0.4)
    harmGain.gain.setValueAtTime(0.15, now)
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + decay * 0.4)
    harm.start(now)
    harm.stop(now + decay * 0.4 + 0.01)

    // 连击失真层：intensity > 0.5 时加入 sawtooth 磨损感
    if (intensity > 0.5) {
      const dist = ac.createOscillator()
      const distGain = ac.createGain()
      dist.connect(distGain)
      distGain.connect(ac.destination)
      dist.type = 'sawtooth'
      dist.frequency.value = freq * 0.5
      const distVol = (intensity - 0.5) * 0.18
      distGain.gain.setValueAtTime(distVol, now)
      distGain.gain.exponentialRampToValueAtTime(0.001, now + decay * 0.6)
      dist.start(now)
      dist.stop(now + decay * 0.6 + 0.01)
    }
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
