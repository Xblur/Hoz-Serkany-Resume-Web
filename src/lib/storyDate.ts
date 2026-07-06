/** Must match scripts/story-date.mjs (America/Toronto default). */
export const STORY_TIMEZONE = 'America/Toronto'

function formatDateInTimezone(date: Date, timeZone: string): string {
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

/** Subtract calendar days from a YYYY-MM-DD civil date. */
function subtractCalendarDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y!, m! - 1, d))
  dt.setUTCDate(dt.getUTCDate() - days)
  const yy = dt.getUTCFullYear()
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(dt.getUTCDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

/** Today's story date (YYYY-MM-DD) in the story timezone. */
export function storyToday(now = new Date()): string {
  return formatDateInTimezone(now, STORY_TIMEZONE)
}

/** Story date N calendar days ago in the story timezone. */
export function storyDaysAgo(days: number, now = new Date()): string {
  if (days <= 0) return storyToday(now)
  return subtractCalendarDays(storyToday(now), days)
}
