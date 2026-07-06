#!/usr/bin/env node
/**
 * Daily story generator: fetch HN + Dev.to headlines, format 1–3 facts per run,
 * append to today's entry in public/story-history.json, prune to 90 days.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  getActiveProviders,
  callProviderModel,
  getModelsToTry,
} from './ai-providers.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HISTORY_PATH = join(__dirname, '..', 'public', 'story-history.json')
const MAX_ENTRIES = 90
const MAX_FACTS_PER_DAY = 8
const FACTS_PER_RUN_MIN = 1
const FACTS_PER_RUN_MAX = 3

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function pruneCutoffDate() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - MAX_ENTRIES)
  return d.toISOString().slice(0, 10)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function hashSeed(str) {
  const hash = createHash('sha256').update(str).digest()
  return hash.readUInt32BE(0)
}

async function fetchHnTopStories(limit = 8) {
  const idsRes = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json')
  if (!idsRes.ok) throw new Error(`HN topstories failed: ${idsRes.status}`)
  const ids = (await idsRes.json()).slice(0, limit)

  const stories = await Promise.all(
    ids.map(async (id) => {
      const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
      if (!res.ok) return null
      const item = await res.json()
      if (!item?.title) return null
      return {
        title: item.title,
        url: item.url ?? `https://news.ycombinator.com/item?id=${id}`,
        source: 'Hacker News',
      }
    }),
  )
  return stories.filter(Boolean)
}

async function fetchDevToTopArticles(limit = 8) {
  const res = await fetch(`https://dev.to/api/articles?per_page=${limit}&top=7`)
  if (!res.ok) throw new Error(`Dev.to API failed: ${res.status}`)
  const articles = await res.json()
  return articles.slice(0, limit).map((a) => ({
    title: a.title,
    url: a.url,
    source: 'Dev.to',
  }))
}

function buildPromptForHeadline(headline, allHeadlines) {
  const context = allHeadlines
    .map((h, i) => `${i + 1}. [${h.source}] ${h.title}`)
    .join('\n')

  return `You are writing a "tech fact of the day" for a computer engineering portfolio site.

Today's tech headlines (for context):
${context}

Focus on THIS headline only:
[${headline.source}] ${headline.title}
${headline.url}

Write a 2–3 sentence fact with a concrete engineering angle (systems, embedded, cloud, AI/ML, web, security).
Attribute the source article in sourceTitle and sourceUrl.

Return ONLY valid JSON:
{"body":"...","sourceTitle":"...","sourceUrl":"..."}`
}

function templateFact(headline, salt) {
  const angles = [
    `Engineering teams are watching this ${headline.source} story: it signals how we build and ship software today.`,
    `From ${headline.source}: a headline that matters for systems design, developer tooling, or production engineering.`,
    `Worth a look from the ${headline.source} front page if you work across hardware, cloud, or full-stack platforms.`,
  ]
  const angle = angles[hashSeed(salt) % angles.length]

  return {
    body: `${angle} "${headline.title}" — follow the source for the full write-up.`,
    sourceTitle: headline.title,
    sourceUrl: headline.url,
    provider: 'template',
    model: null,
  }
}

async function tryProvider(provider, apiKey, prompt) {
  const { models, discoveryError } = await getModelsToTry(provider, apiKey)

  if (discoveryError) {
    console.warn(`${provider.name}: model discovery failed — ${discoveryError}`)
  }

  for (const model of models) {
    try {
      const result = await callProviderModel(provider, apiKey, model, prompt)
      return { ...result, provider: provider.name, model }
    } catch (err) {
      console.warn(`${provider.name}/${model} failed:`, err.message)
    }
  }

  return null
}

async function generateFactForHeadline(headline, allHeadlines, salt) {
  const prompt = buildPromptForHeadline(headline, allHeadlines)

  for (const provider of getActiveProviders()) {
    const apiKey = process.env[provider.env]
    if (!apiKey) continue

    const result = await tryProvider(provider, apiKey, prompt)
    if (result) {
      console.log(`  ✓ ${headline.title.slice(0, 50)}… via ${result.provider}`)
      return result
    }
  }

  console.log(`  ○ template fallback for "${headline.title.slice(0, 40)}…"`)
  return templateFact(headline, salt)
}

function pickHeadlinesForRun(headlines, count) {
  return shuffle(headlines).slice(0, count)
}

function factsFromEntry(entry) {
  if (entry.facts?.length) return entry.facts
  if (entry.fact) return [entry.fact]
  return []
}

function mergeFacts(existingFacts, newFacts) {
  const seen = new Set()
  const merged = []

  for (const fact of [...existingFacts, ...newFacts]) {
    const key = fact.sourceUrl ?? fact.body?.slice(0, 60)
    if (!key || seen.has(key)) continue
    seen.add(key)
    merged.push({
      label: 'Tech fact of the day',
      body: fact.body,
      sourceTitle: fact.sourceTitle,
      sourceUrl: fact.sourceUrl,
      provider: fact.provider,
      model: fact.model ?? undefined,
      generatedAt: fact.generatedAt ?? new Date().toISOString(),
    })
  }

  return merged.slice(-MAX_FACTS_PER_DAY)
}

async function readHistory() {
  try {
    const raw = await readFile(HISTORY_PATH, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { updatedAt: new Date().toISOString(), maxEntries: MAX_ENTRIES, entries: [] }
  }
}

function upsertTodayFacts(history, today, newFacts) {
  const entries = history.entries ?? []
  const existing = entries.find((e) => e.date === today)
  const mergedFacts = mergeFacts(factsFromEntry(existing ?? { facts: [] }), newFacts)

  const entry = {
    date: today,
    generatedAt: new Date().toISOString(),
    facts: mergedFacts,
  }

  const filtered = entries.filter((e) => e.date !== today)
  const merged = [entry, ...filtered].sort((a, b) => b.date.localeCompare(a.date))

  const cutoff = pruneCutoffDate()
  const pruned = merged.filter((e) => e.date >= cutoff).slice(0, MAX_ENTRIES)

  return {
    updatedAt: new Date().toISOString(),
    maxEntries: MAX_ENTRIES,
    entries: pruned,
  }
}

async function main() {
  let headlines
  try {
    const [hn, devto] = await Promise.all([fetchHnTopStories(8), fetchDevToTopArticles(8)])
    headlines = shuffle([...hn, ...devto])
    if (headlines.length === 0) throw new Error('No headlines fetched')
  } catch (err) {
    console.warn('Headline fetch failed — history unchanged:', err.message)
    process.exit(0)
  }

  const runCount = Math.min(
    headlines.length,
    FACTS_PER_RUN_MIN +
      Math.floor(Math.random() * (FACTS_PER_RUN_MAX - FACTS_PER_RUN_MIN + 1)),
  )
  const picks = pickHeadlinesForRun(headlines, runCount)
  const today = todayIso()

  console.log(`Generating ${picks.length} fact(s) for ${today}…`)

  const newFacts = []
  for (let i = 0; i < picks.length; i++) {
    const headline = picks[i]
    const salt = `${today}:${randomUUID()}:${i}`
    const fact = await generateFactForHeadline(headline, headlines, salt)
    newFacts.push({
      ...fact,
      generatedAt: new Date().toISOString(),
    })
  }

  const history = await readHistory()
  const updated = upsertTodayFacts(history, today, newFacts)
  await writeFile(HISTORY_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8')

  const todayFacts = updated.entries.find((e) => e.date === today)?.facts?.length ?? 0
  console.log(
    `Story updated for ${today}: +${newFacts.length} fact(s), ${todayFacts} total today, ${updated.entries.length} days in archive`,
  )
}

main().catch((err) => {
  console.warn('Unexpected error — history unchanged:', err.message)
  process.exit(0)
})
