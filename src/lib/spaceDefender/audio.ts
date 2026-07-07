import { Howl, Howler } from 'howler'
import { resume } from '../../data/resume'

const MUTE_KEY = 'space-defender-muted'

function createWavDataUri(
  duration: number,
  sampleRate: number,
  generator: (t: number, i: number) => number,
): string {
  const numSamples = Math.floor(duration * sampleRate)
  const buffer = new ArrayBuffer(44 + numSamples * 2)
  const view = new DataView(buffer)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + numSamples * 2, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  writeStr(36, 'data')
  view.setUint32(40, numSamples * 2, true)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    const sample = Math.max(-1, Math.min(1, generator(t, i)))
    view.setInt16(44 + i * 2, sample * 0x7fff, true)
  }

  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!)
  return `data:audio/wav;base64,${btoa(binary)}`
}

function makeSound(
  duration: number,
  generator: (t: number, i: number) => number,
  volume = 0.5,
): Howl {
  const src = createWavDataUri(duration, 22050, generator)
  return new Howl({ src: [src], volume, preload: true })
}

const sounds = {
  warpHum: makeSound(1.2, (t) => {
    const env = Math.min(1, t * 2) * Math.max(0, 1 - (t - 0.8) / 0.4)
    return Math.sin(t * 80 * Math.PI * 2) * env * 0.3 + Math.sin(t * 120) * env * 0.15
  }, 0.35),
  shipApproach: makeSound(0.9, (t) => {
    const env = Math.min(1, t * 3) * Math.max(0, 1 - t / 0.9)
    const freq = 200 + t * 400
    return Math.sin(t * freq * Math.PI * 2) * env * 0.4
  }, 0.4),
  laser: makeSound(0.12, (t) => {
    const env = Math.max(0, 1 - t / 0.12)
    return Math.sin(t * 1200 * Math.PI * 2) * env * 0.5
  }, 0.35),
  explosion: makeSound(0.35, (t) => {
    const env = Math.max(0, 1 - t / 0.35)
    return (Math.random() * 2 - 1) * env * 0.6
  }, 0.45),
  planetHit: makeSound(0.5, (t) => {
    const env = Math.max(0, 1 - t / 0.5)
    return Math.sin(t * 60 * Math.PI * 2) * env * 0.5 + (Math.random() * 2 - 1) * env * 0.2
  }, 0.5),
  gameOver: makeSound(1.5, (t) => {
    const env = Math.max(0, 1 - t / 1.5)
    const freq = 440 - t * 200
    return Math.sin(t * freq * Math.PI * 2) * env * 0.4
  }, 0.45),
}

export type SfxName = keyof typeof sounds

let muted = false

export function initAudio(): void {
  try {
    muted = sessionStorage.getItem(MUTE_KEY) === 'true'
  } catch {
    muted = false
  }
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean): void {
  muted = value
  try {
    sessionStorage.setItem(MUTE_KEY, String(value))
  } catch {
    // ignore
  }
  Howler.mute(value)
}

export function toggleMute(): boolean {
  setMuted(!muted)
  return muted
}

export function playSfx(name: SfxName): void {
  if (muted) return
  sounds[name].play()
}

export function stopAllSfx(): void {
  Howler.stop()
}

// Re-export contact for hire CTAs
export const contactLinks = resume.contact
