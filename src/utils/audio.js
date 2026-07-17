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

// zone: 0=顶部(高音脆) ~ 1=底部(低音厚)；intensity: 0=慢敲 ~ 1=狂敲(沉闷失真)
export async function playWoodfish(zone = 0.5, intensity = 0) {
  try {
    const ac = await getCtx()
    const now = ac.currentTime

    // zone 决定音调：顶部1000Hz清脆 → 底部280Hz低沉，衰减也拉开（顶短底长）
    const baseFreq = 1000 - zone * 720
    // intensity 让音调额外下沉最多 150Hz
    const freq = Math.max(120, baseFreq - intensity * 150)
    const decay = (0.15 + zone * 0.25) * (1 + intensity * 0.2)

    // lowpass 总线：intensity 越大截止频率越低，声音越闷
    const lp = ac.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.value = 4000 - intensity * 2800
    lp.Q.value = 0.8
    lp.connect(ac.destination)

    // 瞬态噪声：槌击「咔」声，顶部更脆（高频），底部更钝
    const bufLen = Math.floor(ac.sampleRate * 0.03)
    const noiseBuf = ac.createBuffer(1, bufLen, ac.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1
    const noise = ac.createBufferSource()
    noise.buffer = noiseBuf
    const noiseFilter = ac.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 3200 - zone * 2000
    noiseFilter.Q.value = 1.2 + zone
    const noiseGain = ac.createGain()
    noiseGain.gain.setValueAtTime(0.55, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(lp)
    noise.start(now)

    // 主体空鸣
    const body = ac.createOscillator()
    const bodyGain = ac.createGain()
    body.connect(bodyGain)
    bodyGain.connect(lp)
    body.type = 'sine'
    body.frequency.setValueAtTime(freq, now)
    body.frequency.exponentialRampToValueAtTime(freq * 0.7, now + decay)
    bodyGain.gain.setValueAtTime(0.65, now)
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + decay)
    body.start(now)
    body.stop(now + decay + 0.01)

    // 二次谐波（顶部更强，底部渐弱）
    const harm = ac.createOscillator()
    const harmGain = ac.createGain()
    harm.connect(harmGain)
    harmGain.connect(lp)
    harm.type = 'sine'
    harm.frequency.setValueAtTime(freq * 2.1, now)
    harm.frequency.exponentialRampToValueAtTime(freq * 1.6, now + decay * 0.35)
    const harmVol = 0.25 - zone * 0.18
    harmGain.gain.setValueAtTime(harmVol, now)
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + decay * 0.35)
    harm.start(now)
    harm.stop(now + decay * 0.35 + 0.01)

    // 连击失真层：intensity > 0.3 就开始介入，越快越响
    if (intensity > 0.3) {
      const dist = ac.createOscillator()
      const distGain = ac.createGain()
      dist.connect(distGain)
      distGain.connect(lp)
      dist.type = 'sawtooth'
      dist.frequency.value = freq * 0.48
      const distVol = (intensity - 0.3) * 0.38
      distGain.gain.setValueAtTime(distVol, now)
      distGain.gain.exponentialRampToValueAtTime(0.001, now + decay * 0.7)
      dist.start(now)
      dist.stop(now + decay * 0.7 + 0.01)
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
