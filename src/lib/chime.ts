export interface Tune {
  id: string
  title: string
  subtitle: string
  bpm: number
  /** MIDI 音高序列，0 表示休止 */
  melody: number[]
  bass: number[]
  wave: OscillatorType
}

export const tunes: Tune[] = [
  {
    id: 'explosion-theme',
    title: '爆裂魔法のテーマ',
    subtitle: 'Explosion Theme · 76 BPM',
    bpm: 76,
    wave: 'triangle',
    melody: [
      62, 0, 65, 69, 0, 67, 65, 0, 62, 0, 60, 62, 65, 0, 69, 0, 67, 0, 65, 62, 0, 60, 58, 0,
      60, 0, 62, 65, 0, 67, 69, 0,
    ],
    bass: [38, 38, 41, 41, 36, 36, 38, 38],
  },
  {
    id: 'red-demon-morning',
    title: '紅魔族の朝',
    subtitle: 'Red Demon Morning · 96 BPM',
    bpm: 96,
    wave: 'sine',
    melody: [
      67, 69, 71, 74, 0, 71, 69, 67, 64, 67, 69, 71, 0, 69, 67, 64, 62, 64, 67, 69, 71, 0, 74,
      0, 71, 69, 67, 64, 62, 0, 64, 0,
    ],
    bass: [40, 40, 43, 43, 45, 45, 40, 40],
  },
  {
    id: 'night-wilderness',
    title: '荒野の夜',
    subtitle: 'Night in the Wilderness · 60 BPM',
    bpm: 60,
    wave: 'triangle',
    melody: [57, 0, 0, 60, 0, 64, 0, 0, 62, 0, 60, 0, 57, 0, 0, 0, 55, 0, 57, 0, 60, 0, 0, 0, 57, 0, 0, 0, 0, 0, 0, 0],
    bass: [33, 33, 36, 36, 31, 31, 33, 33],
  },
]

const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

export class ChimePlayer {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private delay: DelayNode | null = null
  private timer: number | undefined
  private nextTime = 0
  private step = 0
  private playing = false

  tune: Tune = tunes[0]
  volume = 0.42
  onProgress: ((ratio: number) => void) | null = null

  private ensureContext() {
    if (this.ctx) return
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new Ctor()
    const master = ctx.createGain()
    master.gain.value = this.volume * 0.32

    const delay = ctx.createDelay(1)
    delay.delayTime.value = 0.28
    const feedback = ctx.createGain()
    feedback.gain.value = 0.24
    const wet = ctx.createGain()
    wet.gain.value = 0.3

    master.connect(ctx.destination)
    master.connect(delay)
    delay.connect(feedback)
    feedback.connect(delay)
    delay.connect(wet)
    wet.connect(ctx.destination)

    this.ctx = ctx
    this.master = master
    this.delay = delay
  }

  private voice(note: number, time: number, duration: number, gainValue: number, wave: OscillatorType) {
    if (!this.ctx || !this.master) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc.type = wave
    osc.frequency.value = midiToFreq(note)
    filter.type = 'lowpass'
    filter.frequency.value = 1800
    filter.Q.value = 0.6

    gain.gain.setValueAtTime(0.0001, time)
    gain.gain.exponentialRampToValueAtTime(gainValue, time + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.master)

    osc.start(time)
    osc.stop(time + duration + 0.05)
  }

  private scheduleStep(step: number, time: number) {
    const beat = 60 / this.tune.bpm / 2
    const note = this.tune.melody[step % this.tune.melody.length]
    if (note > 0) {
      this.voice(note, time, beat * 2.4, 0.22, this.tune.wave)
      this.voice(note + 12, time, beat * 1.2, 0.05, 'sine')
    }
    if (step % 4 === 0) {
      const bass = this.tune.bass[Math.floor(step / 4) % this.tune.bass.length]
      this.voice(bass, time, beat * 5, 0.16, 'sine')
    }
    if (step % 8 === 0) {
      const chordRoot = this.tune.bass[Math.floor(step / 8) % this.tune.bass.length]
      this.voice(chordRoot + 12, time, beat * 8, 0.05, 'triangle')
      this.voice(chordRoot + 19, time, beat * 8, 0.04, 'triangle')
    }
  }

  private loop = () => {
    if (!this.ctx || !this.playing) return
    const beat = 60 / this.tune.bpm / 2
    while (this.nextTime < this.ctx.currentTime + 0.25) {
      this.scheduleStep(this.step, this.nextTime)
      this.nextTime += beat
      this.step = (this.step + 1) % this.tune.melody.length
      const ratio = this.step / this.tune.melody.length
      this.onProgress?.(ratio)
    }
  }

  async play() {
    this.ensureContext()
    if (!this.ctx) return
    if (this.ctx.state === 'suspended') await this.ctx.resume()
    this.playing = true
    this.nextTime = this.ctx.currentTime + 0.08
    this.loop()
    window.clearInterval(this.timer)
    this.timer = window.setInterval(this.loop, 60)
  }

  pause() {
    this.playing = false
    window.clearInterval(this.timer)
  }

  setVolume(value: number) {
    this.volume = value
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(value * 0.32, this.ctx.currentTime, 0.05)
    }
  }

  load(tune: Tune, keepPlaying = true) {
    const wasPlaying = this.playing
    this.pause()
    this.tune = tune
    this.step = 0
    this.onProgress?.(0)
    if (wasPlaying && keepPlaying) void this.play()
  }

  destroy() {
    this.pause()
    this.ctx?.close()
    this.ctx = null
  }

  get isPlaying() {
    return this.playing
  }
}
