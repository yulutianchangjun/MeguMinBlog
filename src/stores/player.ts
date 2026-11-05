import { defineStore } from 'pinia'
import { computed, ref, shallowRef } from 'vue'
import { ChimePlayer, tunes } from '@/lib/chime'
import { resolveAsset } from '@/lib/asset'
import { deleteAudio, getAudio, putAudio } from '@/lib/audioDb'
import { readJSON, uid, writeJSON } from '@/lib/storage'

export type TrackKind = 'synth' | 'file' | 'url'

export interface Track {
  id: string
  title: string
  artist: string
  cover: string
  kind: TrackKind
  src?: string
  tuneId?: string
  size?: number
}

interface PersistedPlayer {
  custom: Track[]
  index: number
  volume: number
}

const builtinTracks: Track[] = tunes.map((tune) => ({
  id: `synth-${tune.id}`,
  title: tune.title,
  artist: '惠惠的留声机',
  cover: '',
  kind: 'synth',
  tuneId: tune.id,
}))

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

export const usePlayerStore = defineStore('player', () => {
  const saved = readJSON<PersistedPlayer>('player', { custom: [], index: 0, volume: 0.42 })
  const custom = (saved.custom ?? []).filter((track) => track.kind !== 'synth')
  const playlist = ref<Track[]>([...builtinTracks, ...custom])
  const index = ref(clamp(saved.index ?? 0, 0, Math.max(0, playlist.value.length - 1)))
  const volume = ref(saved.volume ?? 0.42)

  const playing = ref(false)
  const progress = ref(0)
  const currentTime = ref(0)
  const duration = ref(0)
  const error = ref('')
  const hydrated = ref(false)

  const chime = new ChimePlayer()
  chime.setVolume(volume.value)

  const current = computed<Track | undefined>(() => playlist.value[index.value])
  const currentTune = computed(() => tunes.find((tune) => tune.id === current.value?.tuneId))
  const customCount = computed(() => playlist.value.filter((t) => t.kind !== 'synth').length)

  const audio = shallowRef<HTMLAudioElement | null>(null)
  const objectUrls = new Map<string, string>()
  const loadedId = ref('')

  chime.onProgress = (ratio) => {
    if (current.value?.kind === 'synth' && playing.value) progress.value = ratio
  }

  function persist() {
    writeJSON('player', {
      custom: playlist.value.filter((track) => track.kind !== 'synth'),
      index: index.value,
      volume: volume.value,
    } satisfies PersistedPlayer)
  }

  function ensureAudio(): HTMLAudioElement {
    if (audio.value) return audio.value
    const element = new Audio()
    element.preload = 'metadata'
    element.volume = volume.value
    element.addEventListener('timeupdate', () => {
      currentTime.value = element.currentTime
      duration.value = Number.isFinite(element.duration) ? element.duration : 0
      progress.value = duration.value ? element.currentTime / duration.value : 0
    })
    element.addEventListener('loadedmetadata', () => {
      duration.value = Number.isFinite(element.duration) ? element.duration : 0
    })
    element.addEventListener('ended', () => {
      void next()
    })
    element.addEventListener('error', () => {
      if (current.value?.kind !== 'synth') {
        error.value = '音频加载失败，请检查链接或重新上传'
        playing.value = false
      }
    })
    audio.value = element
    return element
  }

  function stopEngines() {
    chime.pause()
    audio.value?.pause()
  }

  function resolveSrc(track: Track): string {
    if (track.kind === 'file') return objectUrls.get(track.id) ?? ''
    const src = track.src ?? ''
    if (!src) return ''
    if (/^(https?:|data:|blob:)/i.test(src)) return src
    return resolveAsset(src)
  }

  /** 恢复本地音频对象 URL（刷新后从 IndexedDB 重新挂载） */
  async function hydrate() {
    if (hydrated.value) return
    hydrated.value = true
    const fileTracks = playlist.value.filter((track) => track.kind === 'file')
    await Promise.all(
      fileTracks.map(async (track) => {
        if (objectUrls.has(track.id)) return
        const blob = await getAudio(track.id)
        if (blob) objectUrls.set(track.id, URL.createObjectURL(blob))
      }),
    )
    if (current.value?.kind === 'file' && !objectUrls.has(current.value.id)) {
      error.value = '本地音频已失效，请重新添加'
    }
  }

  async function play(target?: number) {
    if (target !== undefined) index.value = clamp(target, 0, playlist.value.length - 1)
    await hydrate()
    const track = current.value
    if (!track) return
    stopEngines()
    error.value = ''
    progress.value = 0
    currentTime.value = 0
    duration.value = 0

    if (track.kind === 'synth') {
      const tune = tunes.find((item) => item.id === track.tuneId) ?? tunes[0]
      chime.load(tune, false)
      try {
        await chime.play()
        playing.value = true
        loadedId.value = track.id
      } catch {
        playing.value = false
        error.value = '浏览器拦截了音频播放，请再点一次播放'
      }
      persist()
      return
    }

    const src = resolveSrc(track)
    if (!src) {
      error.value = '音频源不可用，请重新添加'
      return
    }
    const element = ensureAudio()
    if (loadedId.value !== track.id || element.src !== src) {
      element.src = src
      loadedId.value = track.id
    }
    try {
      await element.play()
      playing.value = true
      persist()
    } catch {
      playing.value = false
      error.value = '浏览器拦截了音频播放，请再点一次播放'
    }
  }

  async function toggle() {
    if (playing.value) {
      pause()
      return
    }
    const track = current.value
    if (!track) return
    if (loadedId.value === track.id) {
      try {
        if (track.kind === 'synth') await chime.play()
        else await ensureAudio().play()
        playing.value = true
      } catch {
        error.value = '播放失败，请重新选择曲目'
        playing.value = false
      }
      return
    }
    await play(index.value)
  }

  function pause() {
    stopEngines()
    playing.value = false
  }

  async function next(auto = false) {
    if (!playlist.value.length) return
    const wasPlaying = playing.value || auto
    index.value = (index.value + 1) % playlist.value.length
    if (wasPlaying) await play(index.value)
    else {
      resetProgress()
      persist()
    }
  }

  async function prev() {
    if (!playlist.value.length) return
    const wasPlaying = playing.value
    index.value = (index.value - 1 + playlist.value.length) % playlist.value.length
    if (wasPlaying) await play(index.value)
    else {
      resetProgress()
      persist()
    }
  }

  function resetProgress() {
    progress.value = 0
    currentTime.value = 0
    duration.value = 0
    loadedId.value = ''
  }

  function seek(ratio: number) {
    const track = current.value
    if (!track || track.kind === 'synth') return
    const element = ensureAudio()
    if (!duration.value) return
    element.currentTime = clamp(ratio, 0, 1) * duration.value
    progress.value = clamp(ratio, 0, 1)
  }

  function setVolume(value: number) {
    volume.value = clamp(value, 0, 1)
    chime.setVolume(volume.value)
    if (audio.value) audio.value.volume = volume.value
    persist()
  }

  async function addFile(file: File, meta?: { title?: string; artist?: string; cover?: string }): Promise<Track | null> {
    if (!file.type.startsWith('audio/') && !/\.(mp3|flac|wav|ogg|m4a|aac)$/i.test(file.name)) {
      error.value = '请选择音频文件（MP3 / FLAC / WAV / M4A）'
      return null
    }
    const id = uid('trk-')
    const stored = await putAudio(id, file)
    const url = URL.createObjectURL(file)
    objectUrls.set(id, url)
    const track: Track = {
      id,
      title: (meta?.title ?? '').trim() || file.name.replace(/\.[^.]+$/, ''),
      artist: (meta?.artist ?? '').trim() || '本地文件',
      cover: (meta?.cover ?? '').trim(),
      kind: 'file',
      size: file.size,
    }
    if (!stored) {
      error.value = '浏览器拒绝写入本地缓存，本次仅临时可用'
    }
    playlist.value = [...playlist.value, track]
    if (!playing.value) {
      index.value = playlist.value.length - 1
      resetProgress()
    }
    persist()
    return track
  }

  function addUrl(input: { title: string; artist?: string; cover?: string; src: string }): Track | null {
    const title = input.title.trim()
    const src = input.src.trim()
    if (!title) {
      error.value = '请填写曲名'
      return null
    }
    if (!src || !/^(https?:\/\/|\/|\.?\/?assets\/)/i.test(src)) {
      error.value = '请填写有效的音频地址（http(s) 或 assets/ 路径）'
      return null
    }
    const track: Track = {
      id: uid('trk-'),
      title,
      artist: (input.artist ?? '').trim() || '网络音频',
      cover: (input.cover ?? '').trim(),
      kind: 'url',
      src,
    }
    playlist.value = [...playlist.value, track]
    if (!playing.value) {
      index.value = playlist.value.length - 1
      resetProgress()
    }
    persist()
    return track
  }

  async function removeTrack(id: string) {
    const position = playlist.value.findIndex((track) => track.id === id)
    if (position < 0) return
    const wasCurrent = current.value?.id === id
    const currentId = current.value?.id
    if (wasCurrent) {
      pause()
      resetProgress()
    }
    const url = objectUrls.get(id)
    if (url) {
      URL.revokeObjectURL(url)
      objectUrls.delete(id)
    }
    await deleteAudio(id)
    playlist.value = playlist.value.filter((track) => track.id !== id)

    if (wasCurrent) {
      index.value = clamp(position, 0, Math.max(0, playlist.value.length - 1))
      loadedId.value = ''
    } else if (currentId) {
      const nextIndex = playlist.value.findIndex((track) => track.id === currentId)
      if (nextIndex >= 0) index.value = nextIndex
    }
    persist()
  }

  function coverUrl(track?: Track): string {
    if (!track?.cover) return ''
    return resolveAsset(track.cover)
  }

  function dispose() {
    pause()
    objectUrls.forEach((url) => URL.revokeObjectURL(url))
    objectUrls.clear()
    chime.destroy()
    if (audio.value) {
      audio.value.src = ''
      audio.value = null
    }
  }

  return {
    playlist,
    index,
    volume,
    playing,
    progress,
    currentTime,
    duration,
    error,
    hydrated,
    current,
    currentTune,
    customCount,
    hydrate,
    play,
    toggle,
    pause,
    next,
    prev,
    seek,
    setVolume,
    addFile,
    addUrl,
    removeTrack,
    coverUrl,
    dispose,
  }
})
