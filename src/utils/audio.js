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

export async function playWoodfish() {
  try {
    const ac = await getCtx()
    const now = ac.currentTime

    // 瞬态噪声：模拟槌头敲击的「咔」
    const bufLen = ac.sampleRate * 0.03
    const noiseBuf = ac.createBuffer(1, bufLen, ac.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1)
    const noise = ac.createBufferSource()
    noise.buffer = noiseBuf
    const noiseFilter = ac.createBiquadFilter()
    noiseFilter.type = 'bandpass'
    noiseFilter.frequency.value = 1800
    noiseFilter.Q.value = 1.2
    const noiseGain = ac.createGain()
    noiseGain.gain.setValueAtTime(0.5, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
    noise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ac.destination)
    noise.start(now)

    // 主体空鸣：木鱼中空的「嗵」
    const body = ac.createOscillator()
    const bodyGain = ac.createGain()
    body.connect(bodyGain)
    bodyGain.connect(ac.destination)
    body.type = 'sine'
    body.frequency.setValueAtTime(680, now)
    body.frequency.exponentialRampToValueAtTime(520, now + 0.12)
    bodyGain.gain.setValueAtTime(0.6, now)
    bodyGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    body.start(now)
    body.stop(now + 0.22)

    // 二次谐波：增加木质厚度
    const harm = ac.createOscillator()
    const harmGain = ac.createGain()
    harm.connect(harmGain)
    harmGain.connect(ac.destination)
    harm.type = 'sine'
    harm.frequency.setValueAtTime(1360, now)
    harm.frequency.exponentialRampToValueAtTime(1040, now + 0.08)
    harmGain.gain.setValueAtTime(0.15, now)
    harmGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
    harm.start(now)
    harm.stop(now + 0.08)
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
