import { getSupabase, isSupabaseConfigured } from '../supabase'
import { maxPlausibleScore } from './engine'

const DEVICE_ID_KEY = 'space-defender-device-id'
const LAST_SUBMIT_KEY = 'space-defender-last-submit'
const LAST_NAME_KEY = 'space-defender-last-name'
const RATE_LIMIT_MS = 60_000

export interface LeaderboardEntry {
  id: string
  player_name: string
  score: number
  wave: number
  created_at: string
  rank?: number
}

export interface SubmitResult {
  ok: boolean
  error?: string
  entry?: LeaderboardEntry
  rank?: number
}

function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, id)
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export function getLastPlayerName(): string {
  try {
    return localStorage.getItem(LAST_NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveLastPlayerName(name: string): void {
  try {
    localStorage.setItem(LAST_NAME_KEY, name)
  } catch {
    // ignore
  }
}

function canSubmitNow(): boolean {
  try {
    const last = localStorage.getItem(LAST_SUBMIT_KEY)
    if (!last) return true
    return Date.now() - Number(last) >= RATE_LIMIT_MS
  } catch {
    return true
  }
}

function markSubmitted(): void {
  try {
    localStorage.setItem(LAST_SUBMIT_KEY, String(Date.now()))
  } catch {
    // ignore
  }
}

function validateName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 12) {
    return 'Name must be 1–12 characters'
  }
  if (!/^[a-zA-Z0-9 _.-]+$/.test(trimmed)) {
    return 'Name contains invalid characters'
  }
  return null
}

export function isLeaderboardAvailable(): boolean {
  return isSupabaseConfigured()
}

export async function fetchTopScores(limit = 10): Promise<{
  scores: LeaderboardEntry[]
  error?: string
}> {
  const supabase = getSupabase()
  if (!supabase) {
    return { scores: [], error: 'Leaderboard unavailable' }
  }

  const { data, error } = await supabase
    .from('space_defender_scores')
    .select('id, player_name, score, wave, created_at')
    .order('score', { ascending: false })
    .order('wave', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    return { scores: [], error: error.message }
  }

  const scores = (data ?? []).map((row, i) => ({
    ...row,
    rank: i + 1,
  })) as LeaderboardEntry[]

  return { scores }
}

export async function submitScore(params: {
  name: string
  score: number
  wave: number
}): Promise<SubmitResult> {
  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, error: 'Leaderboard unavailable' }
  }

  const nameError = validateName(params.name)
  if (nameError) return { ok: false, error: nameError }

  if (params.score <= 0 || params.wave < 1) {
    return { ok: false, error: 'Invalid score' }
  }

  if (params.score > maxPlausibleScore(params.wave)) {
    return { ok: false, error: 'Score exceeds plausible maximum' }
  }

  if (!canSubmitNow()) {
    return { ok: false, error: 'Please wait before submitting again' }
  }

  const playerName = params.name.trim()
  const deviceId = getDeviceId()

  const { data, error } = await supabase
    .from('space_defender_scores')
    .insert({
      player_name: playerName,
      score: params.score,
      wave: params.wave,
      device_id: deviceId,
    })
    .select('id, player_name, score, wave, created_at')
    .single()

  if (error) {
    return { ok: false, error: error.message }
  }

  markSubmitted()
  saveLastPlayerName(playerName)

  const { scores } = await fetchTopScores(10)
  const rank = scores.findIndex((s) => s.id === data.id) + 1

  return {
    ok: true,
    entry: { ...data, rank: rank > 0 ? rank : undefined } as LeaderboardEntry,
    rank: rank > 0 ? rank : undefined,
  }
}

export function findPlayerRank(
  scores: LeaderboardEntry[],
  playerName: string,
  score: number,
): number | null {
  const idx = scores.findIndex(
    (s) => s.player_name === playerName && s.score === score,
  )
  return idx >= 0 ? idx + 1 : null
}
