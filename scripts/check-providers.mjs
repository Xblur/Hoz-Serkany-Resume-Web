#!/usr/bin/env node
/**
 * List available models per configured AI provider and show which model
 * generate-story will try first.
 *
 * Usage: npm run check-providers
 */

import { getActiveProviders, getSkippedProviders, probeAllProviders } from './ai-providers.mjs'

function formatList(items, max = 12) {
  if (!items.length) return '(none)'
  const shown = items.slice(0, max)
  const extra = items.length > max ? `, … +${items.length - max} more` : ''
  return shown.join(', ') + extra
}

async function main() {
  console.log('AI provider model check\n')
  const skipped = getSkippedProviders()
  if (skipped.size > 0) {
    console.log(`Skipped (STORY_SKIP_PROVIDERS): ${[...skipped].join(', ')}\n`)
  }

  console.log(`Provider order: ${getActiveProviders().map((p) => p.name).join(' → ')} → template\n`)

  const results = await probeAllProviders()

  for (const r of results) {
    console.log(`── ${r.name} (${r.env}) ──`)

    if (r.skipped) {
      console.log('  Status:   skipped (STORY_SKIP_PROVIDERS)')
      console.log('  Will use: skipped\n')
      continue
    }

    if (!r.configured) {
      console.log('  Status:   not configured (env var unset)')
      console.log('  Will use: skipped\n')
      continue
    }

    console.log('  Status:   configured')

    if (r.discoveryError) {
      console.log(`  Discovery: failed — ${r.discoveryError}`)
      console.log(`  Will try: ${formatList(r.willUse)} (preferred fallback)\n`)
      continue
    }

    console.log(`  Available (${r.available.length}): ${formatList(r.available)}`)
    console.log(`  Will try:  ${formatList(r.willUse)}`)
    console.log(`  Primary:   ${r.willUse[0] ?? '(none)'} (if this provider runs)\n`)
  }

  const byName = new Map(results.map((r) => [r.name, r]))
  const firstReady = getActiveProviders()
    .map((p) => byName.get(p.name))
    .find((r) => r && !r.skipped && r.configured && r.willUse.length > 0)
  if (firstReady) {
    console.log(
      `generate-story will use: ${firstReady.name} / ${firstReady.willUse[0]}`,
    )
  } else {
    console.log('generate-story will use: template fallback (no AI keys configured)')
  }
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
