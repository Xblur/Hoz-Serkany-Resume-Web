#!/usr/bin/env node
/**
 * One-time import: flatten public/story-history.json into story_facts rows.
 * Run after applying supabase/migrations/20260707130000_story_facts.sql
 */

import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createSupabaseAdmin } from './supabase-admin.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_ARCHIVE = join(__dirname, '..', 'public', 'story-history.json')

function factsFromEntry(entry) {
  if (entry.facts?.length) return entry.facts
  if (entry.fact) return [entry.fact]
  return []
}

function factToRow(entryDate, fact, entryGeneratedAt) {
  return {
    entry_date: entryDate,
    label: fact.label ?? 'Tech fact of the day',
    body: fact.body,
    source_title: fact.sourceTitle ?? null,
    source_url: fact.sourceUrl ?? null,
    provider: fact.provider ?? null,
    model: fact.model ?? null,
    generated_at: fact.generatedAt ?? entryGeneratedAt ?? new Date().toISOString(),
  }
}

function isDuplicateError(error) {
  return error?.code === '23505'
}

async function insertRows(supabase, rows) {
  let inserted = 0
  let skipped = 0

  for (const row of rows) {
    const { error } = await supabase.from('story_facts').insert(row)
    if (error) {
      if (isDuplicateError(error)) {
        skipped++
        continue
      }
      throw error
    }
    inserted++
  }

  return { inserted, skipped }
}

async function main() {
  const archivePath = process.env.STORY_ARCHIVE_PATH ?? DEFAULT_ARCHIVE
  const raw = await readFile(archivePath, 'utf8')
  const history = JSON.parse(raw)
  const entries = history.entries ?? []

  const rows = []
  for (const entry of entries) {
    for (const fact of factsFromEntry(entry)) {
      if (!fact.body) continue
      rows.push(factToRow(entry.date, fact, entry.generatedAt))
    }
  }

  if (rows.length === 0) {
    console.log('No facts found in archive — nothing to import')
    return
  }

  const supabase = createSupabaseAdmin()
  const { inserted, skipped } = await insertRows(supabase, rows)

  console.log(
    `Import complete: ${inserted} inserted, ${skipped} skipped (duplicate), ${rows.length} total in archive`,
  )
}

main().catch((err) => {
  console.error('import-story-archive failed:', err.message)
  process.exit(1)
})
