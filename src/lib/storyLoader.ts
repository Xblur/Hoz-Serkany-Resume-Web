import { pickTidbitForDate } from '../data/storyTidbits'
import { storyDaysAgo, storyToday } from './storyDate'

export interface StoryFact {
  label: string
  body: string
  sourceTitle?: string
  sourceUrl?: string
}

export interface StoryFactRecord extends StoryFact {
  provider?: string
  model?: string
  generatedAt?: string
}

export interface StoryEntry {
  date: string
  generatedAt: string
  provider?: string
  model?: string
  /** @deprecated use facts */
  fact?: StoryFact
  facts?: StoryFactRecord[]
}

export interface StoryMeta {
  version: string
  date: string
  generatedAt: string
  isFallback: boolean
}

export interface StoryHistory {
  updatedAt: string
  maxEntries: number
  entries: StoryEntry[]
}

export type StorySlideKind = 'fact' | 'tidbit' | 'cta'

export interface StorySlide {
  kind: StorySlideKind
  label: string
  body: string
  sourceTitle?: string
  sourceUrl?: string
  ctaHref?: string
  ctaLabel?: string
}

export interface ResolvedStory {
  slides: StorySlide[]
  isFallback: boolean
  sourceDate?: string
}

const EMERGENCY_FACTS: StoryFact[] = [
  {
    label: 'Tech fact of the day',
    body: 'Edge CDNs now cache HTML selectively via stale-while-revalidate, letting static portfolio sites serve fresh JSON story files without rebuilding the entire page on every deploy.',
    sourceTitle: 'HTTP caching overview',
    sourceUrl: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching',
  },
  {
    label: 'Tech fact of the day',
    body: 'TypeScript 5.x structural typing catches API contract drift at compile time—especially valuable when a BFF normalizes sensor payloads before they reach a Redux store.',
    sourceTitle: 'TypeScript handbook',
    sourceUrl: 'https://www.typescriptlang.org/docs/handbook/intro.html',
  },
  {
    label: 'Tech fact of the day',
    body: 'WebGPU is shipping in all major browsers, giving web apps direct GPU compute without WebGL graphics-only limits—useful for in-browser vision pipelines on integrated GPUs.',
    sourceTitle: 'WebGPU on Chrome',
    sourceUrl: 'https://developer.chrome.com/docs/web-platform/webgpu/',
  },
]

/** Max fact slides shown per story session (plus tidbit + CTA). */
const MAX_FACT_SLIDES = 10
const POOL_LOOKBACK_DAYS = 45

function shuffle<T>(items: T[]): T[] {
  const arr = [...items]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]!
    arr[i] = arr[j]!
    arr[j] = tmp
  }
  return arr
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1))
}

function daysAgoIso(days: number): string {
  return storyDaysAgo(days)
}

function normalizeFact(record: StoryFactRecord): StoryFact {
  return {
    label: record.label ?? 'Tech fact of the day',
    body: record.body,
    sourceTitle: record.sourceTitle,
    sourceUrl: record.sourceUrl,
  }
}

/** Facts from one archive entry (supports legacy single-fact shape). */
export function factsFromEntry(entry: StoryEntry): StoryFactRecord[] {
  if (entry.facts?.length) {
    return entry.facts.map((f) => ({
      ...normalizeFact(f),
      provider: f.provider,
      model: f.model,
      generatedAt: f.generatedAt ?? entry.generatedAt,
    }))
  }
  if (entry.fact) {
    return [
      {
        ...normalizeFact(entry.fact),
        provider: entry.provider,
        model: entry.model,
        generatedAt: entry.generatedAt,
      },
    ]
  }
  return []
}

function collectFactPool(history: StoryHistory | null, today: string): StoryFactRecord[] {
  const entries = history?.entries ?? []
  const cutoff = daysAgoIso(POOL_LOOKBACK_DAYS)
  const pool: StoryFactRecord[] = []
  const seenUrls = new Set<string>()

  for (const entry of entries) {
    if (entry.date < cutoff) continue
    for (const fact of factsFromEntry(entry)) {
      const key = fact.sourceUrl ?? `${entry.date}:${fact.body.slice(0, 40)}`
      if (seenUrls.has(key)) continue
      seenUrls.add(key)
      pool.push(fact)
    }
  }

  if (pool.length > 0) return pool

  return EMERGENCY_FACTS.map((f) => ({ ...f, generatedAt: `emergency:${today}` }))
}

function pickRandomFacts(pool: StoryFactRecord[]): StoryFact[] {
  if (pool.length === 0) return [emergencyFact()]

  const maxFacts = Math.min(pool.length, MAX_FACT_SLIDES)
  const count = randomInt(1, maxFacts)
  return shuffle(pool).slice(0, count).map(normalizeFact)
}

function emergencyFact(): StoryFact {
  const today = storyToday()
  const index = today.charCodeAt(today.length - 1) % EMERGENCY_FACTS.length
  return EMERGENCY_FACTS[index]!
}

function factToSlide(fact: StoryFact): StorySlide {
  return {
    kind: 'fact',
    label: fact.label,
    body: fact.body,
    sourceTitle: fact.sourceTitle,
    sourceUrl: fact.sourceUrl,
  }
}

function tidbitSlide(date: string): StorySlide {
  const tidbit = pickTidbitForDate(date)
  return {
    kind: 'tidbit',
    label: tidbit.label,
    body: tidbit.body,
  }
}

function ctaSlide(): StorySlide {
  const base = import.meta.env.BASE_URL
  return {
    kind: 'cta',
    label: 'Try it yourself',
    body: 'Explore a live facial gesture recognition demo—hold a gesture, blink to confirm, and build phrases synthesized to speech.',
    ctaHref: `${base}#/demos/gesture-recognition`,
    ctaLabel: 'Open gesture demo',
  }
}

function hasTodayEntry(history: StoryHistory | null, today: string): boolean {
  return (history?.entries ?? []).some((e) => e.date === today)
}

function latestGeneratedAt(history: StoryHistory | null): string {
  let latest = ''
  for (const entry of history?.entries ?? []) {
    if (entry.generatedAt > latest) latest = entry.generatedAt
    for (const fact of entry.facts ?? []) {
      const at = fact.generatedAt ?? entry.generatedAt
      if (at > latest) latest = at
    }
  }
  return latest
}

function totalFactCount(history: StoryHistory | null): number {
  return (history?.entries ?? []).reduce((sum, e) => sum + factsFromEntry(e).length, 0)
}

/** Stable id for the archive — changes when content is regenerated. */
export function storyVersionFor(historyUpdatedAt: string, factCount: number, latestAt: string): string {
  return `${historyUpdatedAt}:${factCount}:${latestAt}`
}

export async function fetchStoryMeta(): Promise<StoryMeta> {
  const today = storyToday()
  const history = await fetchHistory()
  const hasToday = hasTodayEntry(history, today)

  return {
    version: storyVersionFor(
      history?.updatedAt ?? 'none',
      totalFactCount(history),
      latestGeneratedAt(history) || today,
    ),
    date: today,
    generatedAt: latestGeneratedAt(history) || today,
    isFallback: !hasToday,
  }
}

export async function loadDailyStory(): Promise<ResolvedStory> {
  const today = storyToday()
  const history = await fetchHistory()
  const pool = collectFactPool(history, today)
  const pickedFacts = pickRandomFacts(pool)
  const hasToday = hasTodayEntry(history, today)

  return {
    slides: [...pickedFacts.map(factToSlide), tidbitSlide(today), ctaSlide()],
    isFallback: !hasToday,
    sourceDate: hasToday ? undefined : history?.entries[0]?.date,
  }
}

async function fetchHistory(): Promise<StoryHistory | null> {
  try {
    const url = `${import.meta.env.BASE_URL}story-history.json`
    const res = await fetch(url, { cache: 'no-store' })
    if (res.ok) {
      return (await res.json()) as StoryHistory
    }
  } catch {
    // fall through
  }
  return null
}

export function formatFallbackDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
