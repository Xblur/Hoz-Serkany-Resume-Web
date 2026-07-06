/**
 * Discover recent tech headlines via open search APIs — no hardcoded news sites.
 * Returns a deduped pool; the AI model picks the best items by index.
 */

const USER_AGENT = 'HozSerkanyResumeWeb/1.0 (daily story generator)'

/** Rotating search queries — variety without naming specific publishers. */
const TECH_SEARCH_QUERIES = [
  'software engineering news',
  'programming developer tools',
  'artificial intelligence technology',
  'cloud infrastructure devops',
  'cybersecurity technology',
  'open source software',
  'semiconductor hardware engineering',
  'web development framework',
  'machine learning research',
  'startup technology product launch',
  'embedded systems IoT',
  'database systems performance',
]

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function decodeXml(text) {
  if (!text) return ''
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim()
}

function extractTag(block, tag) {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i')
  const cdataMatch = block.match(cdata)
  if (cdataMatch) return decodeXml(cdataMatch[1])

  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const plainMatch = block.match(plain)
  return plainMatch ? decodeXml(plainMatch[1]) : ''
}

function parseRssItems(xml) {
  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = extractTag(block, 'title')
    const link = extractTag(block, 'link')
    const pubDate = extractTag(block, 'pubDate')
    const publisher = extractTag(block, 'source')
    if (title && link) {
      items.push({ title, url: link, publisher: publisher || undefined, publishedAt: pubDate || undefined })
    }
  }
  return items
}

export function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return ''
  try {
    const parsed = new URL(url.trim())
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return ''
    parsed.hash = ''
    let normalized = parsed.toString()
    if (normalized.endsWith('/')) normalized = normalized.slice(0, -1)
    return normalized.toLowerCase()
  } catch {
    return ''
  }
}

function publisherFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

function dedupeKey(headline) {
  return normalizeUrl(headline.url) || headline.title.toLowerCase().slice(0, 120)
}

function mergeHeadlines(target, batch) {
  const seen = new Set(target.map(dedupeKey))
  for (const h of batch) {
    const key = dedupeKey(h)
    if (!key || seen.has(key)) continue
    seen.add(key)
    target.push(h)
  }
}

/** Google News RSS search — aggregates many publishers, no API key. */
async function searchGoogleNews(query, limit = 10) {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!res.ok) throw new Error(`Google News RSS failed (${res.status}) for "${query}"`)

  const xml = await res.text()
  return parseRssItems(xml)
    .slice(0, limit)
    .map((h) => ({
      title: h.title,
      url: h.url,
      publisher: h.publisher || publisherFromUrl(h.url),
      publishedAt: h.publishedAt,
    }))
}

/** HN Algolia keyword search — finds recent stories by topic, not a fixed front page. */
async function searchRecentStories(query, limit = 8) {
  const weekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60
  const params = new URLSearchParams({
    query,
    tags: 'story',
    hitsPerPage: String(limit),
    numericFilters: `created_at_i>${weekAgo}`,
  })

  const res = await fetch(`https://hn.algolia.com/api/v1/search?${params}`, {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (!res.ok) throw new Error(`Story search failed (${res.status}) for "${query}"`)

  const data = await res.json()
  return (data.hits ?? [])
    .filter((h) => h.title)
    .map((h) => ({
      title: h.title,
      url: h.url || h.story_url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      publisher: publisherFromUrl(h.url || h.story_url || ''),
      publishedAt: h.created_at,
    }))
}

/**
 * Run several tech-news searches, merge, dedupe, and return a shuffled pool.
 * @param {{ maxTotal?: number, queryCount?: number }} options
 */
export async function discoverTechHeadlines({ maxTotal = 28, queryCount = 4 } = {}) {
  const queries = shuffle(TECH_SEARCH_QUERIES).slice(0, queryCount)
  const searches = []

  for (const q of queries) {
    searches.push(searchGoogleNews(q, 10))
    searches.push(searchRecentStories(q, 6))
  }

  const settled = await Promise.allSettled(searches)
  const headlines = []

  for (const result of settled) {
    if (result.status === 'fulfilled') {
      mergeHeadlines(headlines, result.value)
    } else {
      console.warn('  search skipped:', result.reason?.message ?? result.reason)
    }
  }

  if (headlines.length === 0) {
    throw new Error('No headlines discovered from search')
  }

  return shuffle(headlines).slice(0, maxTotal)
}
