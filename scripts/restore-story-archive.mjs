#!/usr/bin/env node
/**
 * Pick the newest story-history.json among repo, cache, and live copies.
 */

import { access, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_PATH = process.env.STORY_ARCHIVE_OUT ?? join(__dirname, '..', 'public', 'story-history.json')

const SOURCES = [
  { label: 'repo', path: process.env.STORY_ARCHIVE_REPO },
  { label: 'cache', path: process.env.STORY_ARCHIVE_CACHE },
  { label: 'live', path: process.env.STORY_ARCHIVE_LIVE },
]

async function loadArchive(path) {
  if (!path) return null
  try {
    await access(path)
    const raw = await readFile(path, 'utf8')
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.entries)) return null
    return data
  } catch {
    return null
  }
}

function archiveTimestamp(history) {
  const ts = Date.parse(history?.updatedAt ?? '')
  return Number.isFinite(ts) ? ts : 0
}

async function main() {
  const candidates = []

  for (const source of SOURCES) {
    const data = await loadArchive(source.path)
    if (!data) continue
    candidates.push({
      label: source.label,
      data,
      ts: archiveTimestamp(data),
    })
  }

  if (candidates.length === 0) {
    console.warn('No valid story archives found — leaving output unchanged')
    process.exit(0)
  }

  candidates.sort((a, b) => b.ts - a.ts)
  const winner = candidates[0]

  console.log(
    `Using ${winner.label} archive (updatedAt: ${winner.data.updatedAt ?? 'unknown'})` +
      (candidates.length > 1
        ? ` — beat ${candidates.slice(1).map((c) => `${c.label}@${c.data.updatedAt}`).join(', ')}`
        : ''),
  )

  await writeFile(OUT_PATH, JSON.stringify(winner.data, null, 2) + '\n', 'utf8')
}

main().catch((err) => {
  console.error('restore-story-archive failed:', err.message)
  process.exit(1)
})
