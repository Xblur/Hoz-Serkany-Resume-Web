#!/usr/bin/env node
/**
 * Daily story generator: search for recent tech headlines, let AI pick the best,
 * write facts per run (STORY_FACT_COUNT), append to public/story-history.json, prune to 120 days.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { createHash, randomUUID } from 'node:crypto'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { getActiveProviders, callProviderModel, getModelsToTry } from './ai-providers.mjs'
import { discoverTechHeadlines, normalizeUrl } from './discover-headlines.mjs'
import { storyToday, storyDaysAgo } from './story-date.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const HISTORY_PATH = join(__dirname, '..', 'public', 'story-history.json')
const MAX_ENTRIES = 120
const DEFAULT_FACT_COUNT = 5

function isStrictGenerate() {
  const raw = process.env.STORY_GENERATE_STRICT ?? ''
  return raw === '1' || raw.toLowerCase() === 'true'
}

function exitGenerate(code, message) {
  if (message) {
    if (code === 0) console.warn(message)
    else console.error(message)
  }
  process.exit(code)
}

function pruneCutoffDate() {
  return storyDaysAgo(MAX_ENTRIES)
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function resolveFactCount(headlineCount) {
  const raw = process.env.STORY_FACT_COUNT
  const parsed = raw ? Number.parseInt(raw, 10) : DEFAULT_FACT_COUNT
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Invalid STORY_FACT_COUNT: ${raw ?? '(unset)'}`)
  }
  return Math.min(parsed, headlineCount)
}

function hashSeed(str) {
  const hash = createHash('sha256').update(str).digest()
  return hash.readUInt32BE(0)
}

function buildPrompt(headlines, factCount) {
  const list = headlines
    .map((h, i) => {
      const pub = h.publisher ? ` (${h.publisher})` : ''
      return `${i + 1}.${pub} ${h.title}\n   ${h.url}`
    })
    .join('\n')

  return `You are writing tech facts for a computer engineering portfolio site's daily story.

Below are recent tech headlines discovered via open web search (pick the most interesting by number):

${list}

Pick exactly ${factCount} different headline(s) with the strongest engineering angles (systems, embedded, cloud, AI/ML, web, security).
Choose whichever source you think is most relevant and educational — you decide what is best.
For each pick, write a 2–3 sentence fact that teaches something concrete.

IMPORTANT: Return headlineIndex (the number from the list above, 1–${headlines.length}). Do NOT invent or copy URLs — we attach the correct link from the list.

Return ONLY valid JSON:
{"facts":[{"body":"...","headlineIndex":1}]}`
}

function templateFact(headline, salt) {
  const angles = [
    'A recent story worth noting for engineers working on systems, tooling, and production software.',
    'This headline reflects something timely in how teams design, build, and ship technology.',
    'Worth a read if you work across hardware, cloud, security, or full-stack platforms.',
  ]
  const angle = angles[hashSeed(salt) % angles.length]
  const via = headline.publisher ? ` (${headline.publisher})` : ''

  return {
    body: `${angle}${via}: "${headline.title}" — follow the source for the full write-up.`,
    sourceTitle: headline.title,
    sourceUrl: headline.url,
    provider: 'template',
    model: null,
  }
}

function templateFacts(headlines, count, salt) {
  return shuffle(headlines)
    .slice(0, count)
    .map((h, i) => templateFact(h, `${salt}:${i}`))
}

/** Match AI output to a headline from the fetched pool (never trust model URLs blindly). */
function matchHeadline(fact, headlines) {
  if (fact.headlineIndex != null) {
    const idx = fact.headlineIndex - 1
    if (idx >= 0 && idx < headlines.length) return headlines[idx]
    return null
  }

  if (fact.sourceUrl) {
    const target = normalizeUrl(fact.sourceUrl)
    if (target) {
      const byUrl = headlines.find((h) => normalizeUrl(h.url) === target)
      if (byUrl) return byUrl
    }
  }

  if (fact.sourceTitle) {
    const title = fact.sourceTitle.toLowerCase()
    const byTitle = headlines.find((h) => h.title.toLowerCase() === title)
    if (byTitle) return byTitle
  }

  return null
}

/** Resolve facts to canonical title/URL from the headline pool; drop unmatched entries. */
function resolveFactsToHeadlines(facts, headlines) {
  const usedIndices = new Set()
  const resolved = []

  for (const fact of facts) {
    const headline = matchHeadline(fact, headlines)
    if (!headline) {
      console.warn('  ⚠ dropped fact — headline not in pool:', fact.headlineIndex ?? fact.sourceTitle)
      continue
    }

    const idx = headlines.indexOf(headline)
    if (usedIndices.has(idx)) continue
    usedIndices.add(idx)

    resolved.push({
      body: fact.body,
      sourceTitle: headline.title,
      sourceUrl: headline.url,
    })
  }

  return resolved
}

async function tryProvider(provider, apiKey, prompt, factCount) {
  const { models, discoveryError } = await getModelsToTry(provider, apiKey)

  if (discoveryError) {
    console.warn(`${provider.name}: model discovery failed — ${discoveryError}`)
  }

  for (const model of models) {
    try {
      const facts = await callProviderModel(provider, apiKey, model, prompt, {
        multiFact: true,
      })
      console.log(`  ✓ ${facts.length} fact(s) via ${provider.name} (${model})`)
      return { facts, provider: provider.name, model }
    } catch (err) {
      console.warn(`${provider.name}/${model} failed:`, err.message)
    }
  }

  return null
}

async function generateFacts(headlines, factCount, salt) {
  const prompt = buildPrompt(headlines, factCount)

  for (const provider of getActiveProviders()) {
    const apiKey = process.env[provider.env]
    if (!apiKey) continue

    const result = await tryProvider(provider, apiKey, prompt, factCount)
    if (result) {
      const resolved = resolveFactsToHeadlines(result.facts, headlines)
      if (resolved.length === 0) {
        console.warn(`  ✗ ${provider.name}: no facts matched headline pool`)
        continue
      }
      return resolved
        .slice(0, factCount)
        .map((f) => ({ ...f, provider: result.provider, model: result.model }))
    }
  }

  console.log(`  ○ template fallback for ${factCount} fact(s)`)
  return templateFacts(headlines, factCount, salt)
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

  return merged
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
    console.log('Searching for recent tech headlines…')
    headlines = await discoverTechHeadlines()
    if (headlines.length === 0) throw new Error('No headlines discovered')
  } catch (err) {
    const message = `Headline discovery failed — history unchanged: ${err.message}`
    exitGenerate(isStrictGenerate() ? 1 : 0, message)
  }

  const factCount = resolveFactCount(headlines.length)
  const today = storyToday()
  const salt = `${today}:${randomUUID()}`

  console.log(
    `Generating ${factCount} fact(s) for ${today} from ${headlines.length} search results (AI picks best)…`,
  )

  const generated = await generateFacts(headlines, factCount, salt)

  if (
    isStrictGenerate() &&
    generated.length > 0 &&
    generated.every((fact) => fact.provider === 'template')
  ) {
    exitGenerate(
      1,
      'All AI providers failed — template fallback is not allowed in strict mode',
    )
  }

  const newFacts = generated.map((fact) => ({
    ...fact,
    generatedAt: new Date().toISOString(),
  }))

  const history = await readHistory()
  const updated = upsertTodayFacts(history, today, newFacts)
  await writeFile(HISTORY_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf8')

  const todayFacts = updated.entries.find((e) => e.date === today)?.facts?.length ?? 0
  console.log(
    `Story updated for ${today}: +${newFacts.length} fact(s), ${todayFacts} total today, ${updated.entries.length} days in archive`,
  )
}

main().catch((err) => {
  const message = `Unexpected error — history unchanged: ${err.message}`
  exitGenerate(isStrictGenerate() ? 1 : 0, message)
})
