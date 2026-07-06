/**
 * Story calendar dates in a fixed timezone (generator + viewer must match).
 * Override with STORY_TIMEZONE, e.g. America/Toronto.
 */

export const STORY_TIMEZONE = process.env.STORY_TIMEZONE ?? 'America/Toronto'

function formatDateInTimezone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const y = parts.find((p) => p.type === 'year')?.value
  const m = parts.find((p) => p.type === 'month')?.value
  const d = parts.find((p) => p.type === 'day')?.value
  if (!y || !m || !d) throw new Error(`Failed to format date for timezone ${timeZone}`)
  return `${y}-${m}-${d}`
}

/** Today's story date (YYYY-MM-DD) in the story timezone. */
export function storyToday(now = new Date()) {
  return formatDateInTimezone(now, STORY_TIMEZONE)
}

/** Story date N calendar days ago in the story timezone. */
export function storyDaysAgo(days, now = new Date()) {
  const d = new Date(now)
  d.setDate(d.getDate() - days)
  return formatDateInTimezone(d, STORY_TIMEZONE)
}
