/**
 * Shared AI provider configs, model discovery, and resolution.
 * Used by generate-story.mjs and check-providers.mjs.
 */

export const SYSTEM_JSON =
  'You return only valid JSON with keys body, sourceTitle, sourceUrl. No markdown, no code fences.'

/** Comma-separated provider names to skip, e.g. STORY_SKIP_PROVIDERS=gemini,github-models */
export function getSkippedProviders() {
  const raw = process.env.STORY_SKIP_PROVIDERS ?? ''
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  )
}

export function isProviderSkipped(name) {
  return getSkippedProviders().has(name.toLowerCase())
}

/** Providers in chain order, excluding skipped. */
export function getActiveProviders() {
  return AI_PROVIDERS.filter((p) => !isProviderSkipped(p.name))
}

/** Ordered provider chain — Groq first. */
export const AI_PROVIDERS = [
  {
    name: 'groq',
    env: 'GROQ_API_KEY',
    type: 'openai',
    chatUrl: 'https://api.groq.com/openai/v1/chat/completions',
    modelsUrl: 'https://api.groq.com/openai/v1/models',
    preferredModels: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
      'gemma2-9b-it',
    ],
  },
  {
    name: 'cerebras',
    env: 'CEREBRAS_API_KEY',
    type: 'openai',
    chatUrl: 'https://api.cerebras.ai/v1/chat/completions',
    modelsUrl: 'https://api.cerebras.ai/v1/models',
    preferredModels: [
      'gpt-oss-120b',
      'gemma-4-31b',
      'zai-glm-4.7',
    ],
  },
  {
    name: 'openrouter',
    env: 'OPENROUTER_API_KEY',
    type: 'openai',
    chatUrl: 'https://openrouter.ai/api/v1/chat/completions',
    modelsUrl: 'https://openrouter.ai/api/v1/models',
    preferredModels: [
      'meta-llama/llama-3.3-70b-instruct:free',
      'google/gemma-2-9b-it:free',
      'qwen/qwen-2.5-72b-instruct:free',
      'mistralai/mistral-7b-instruct:free',
    ],
    extraHeaders: {
      'HTTP-Referer': 'https://github.com/HozSerkany/Hoz-Serkany-Resume-Web',
      'X-Title': 'Hoz Serkany Resume',
    },
    filterAvailable: (models) =>
      models.filter(
        (m) =>
          m.id.endsWith(':free') ||
          m.pricing?.prompt === '0' ||
          m.pricing?.prompt === 0,
      ),
  },
  {
    name: 'gemini',
    env: 'GEMINI_API_KEY',
    type: 'gemini',
    modelsUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    preferredModels: [
      'gemini-2.5-flash',
      'gemini-flash-latest',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash',
    ],
  },
  {
    name: 'github-models',
    env: 'GITHUB_TOKEN',
    type: 'openai',
    chatUrl: 'https://models.inference.ai.azure.com/chat/completions',
    modelsUrl: 'https://models.inference.ai.azure.com/models',
    preferredModels: [
      'meta-llama/Llama-3.2-3B-Instruct',
      'meta-llama/Llama-3.1-8B-Instruct',
      'Mistral-small',
      'gpt-4o-mini',
    ],
  },
]

function normalizeId(id) {
  return id.replace(/^models\//, '').toLowerCase()
}

function modelMatches(preferred, availableId) {
  const p = normalizeId(preferred)
  const a = normalizeId(availableId)
  return a === p || a.endsWith(`/${p}`) || a.includes(p) || p.includes(a)
}

/**
 * Pick preferred models that appear in the provider's available list.
 * Falls back to preferred list if discovery fails.
 */
export function resolveModels(preferred, availableIds) {
  if (!availableIds?.length) return [...preferred]

  const matched = []
  for (const pref of preferred) {
    const hit = availableIds.find((id) => modelMatches(pref, id))
    if (hit && !matched.includes(hit)) matched.push(hit)
  }

  return matched.length > 0 ? matched : [...preferred]
}

async function listOpenAIModels(modelsUrl, apiKey, extraHeaders = {}, filterFn = null) {
  const res = await fetch(modelsUrl, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`models list failed (${res.status}): ${err.slice(0, 150)}`)
  }

  const data = await res.json()
  let items = data.data ?? data.models ?? data

  if (!Array.isArray(items)) {
    throw new Error('unexpected models response shape')
  }

  if (filterFn) {
    items = filterFn(items)
  }

  return items.map((m) => (typeof m === 'string' ? m : m.id)).filter(Boolean)
}

async function listGeminiModels(apiKey) {
  const res = await fetch(`${AI_PROVIDERS.find((p) => p.name === 'gemini').modelsUrl}?key=${apiKey}`)
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`models list failed (${res.status}): ${err.slice(0, 150)}`)
  }

  const data = await res.json()
  return (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
}

/** Fetch raw model IDs from a provider API. */
export async function fetchAvailableModels(provider, apiKey) {
  if (provider.type === 'gemini') {
    return listGeminiModels(apiKey)
  }

  return listOpenAIModels(
    provider.modelsUrl,
    apiKey,
    provider.extraHeaders ?? {},
    provider.filterAvailable ?? null,
  )
}

/** Models to try for generation: preferred ∩ available, or preferred on discovery failure. */
export async function getModelsToTry(provider, apiKey) {
  try {
    const available = await fetchAvailableModels(provider, apiKey)
    const resolved = resolveModels(provider.preferredModels, available)
    return { models: resolved, available, discoveryError: null }
  } catch (err) {
    return {
      models: [...provider.preferredModels],
      available: [],
      discoveryError: err.message,
    }
  }
}

/** Probe all providers that have API keys set. */
export async function probeAllProviders() {
  const results = []

  for (const provider of AI_PROVIDERS) {
    if (isProviderSkipped(provider.name)) {
      results.push({
        name: provider.name,
        env: provider.env,
        configured: false,
        skipped: true,
        available: [],
        willUse: [],
        discoveryError: null,
      })
      continue
    }

    const apiKey = process.env[provider.env]
    if (!apiKey) {
      results.push({
        name: provider.name,
        env: provider.env,
        configured: false,
        skipped: false,
        available: [],
        willUse: [],
        discoveryError: null,
      })
      continue
    }

    const { models, available, discoveryError } = await getModelsToTry(provider, apiKey)
    results.push({
      name: provider.name,
      env: provider.env,
      configured: true,
      skipped: false,
      available,
      willUse: models,
      discoveryError,
    })
  }

  return results
}

function validateFact(parsed) {
  if (!parsed.body || !parsed.sourceTitle || !parsed.sourceUrl) {
    throw new Error('JSON missing required fields (body, sourceTitle, sourceUrl)')
  }
  return {
    body: String(parsed.body).trim(),
    sourceTitle: String(parsed.sourceTitle).trim(),
    sourceUrl: String(parsed.sourceUrl).trim(),
  }
}

/** Parse model output that should be JSON; tolerate fences and leading prose. */
export function parseFactJson(text) {
  let cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()

  const attempts = [cleaned]

  const objectMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objectMatch && objectMatch[0] !== cleaned) {
    attempts.push(objectMatch[0])
  }

  let lastError
  for (const candidate of attempts) {
    try {
      return validateFact(JSON.parse(candidate))
    } catch (err) {
      lastError = err
    }
  }

  const preview = cleaned.slice(0, 120).replace(/\s+/g, ' ')
  throw new Error(
    `Invalid JSON from model: ${lastError instanceof Error ? lastError.message : 'parse error'} — preview: "${preview}"`,
  )
}

export async function callOpenAICompatible({ url, apiKey, model, prompt, extraHeaders = {} }) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      max_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_JSON },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`API failed (${res.status}): ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data?.choices?.[0]?.message?.content
  if (!text) throw new Error('Empty response')

  return parseFactJson(text)
}

const FACT_JSON_SCHEMA = {
  type: 'object',
  properties: {
    body: { type: 'string', description: '2-3 sentence tech fact' },
    sourceTitle: { type: 'string' },
    sourceUrl: { type: 'string' },
  },
  required: ['body', 'sourceTitle', 'sourceUrl'],
}

export async function callGemini(prompt, apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  let text
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_JSON }],
      },
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json',
        responseSchema: FACT_JSON_SCHEMA,
      },
    }),
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`API failed (${res.status}): ${errText.slice(0, 200)}`)
  }

  const data = await res.json()
  text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response')

  try {
    return parseFactJson(text)
  } catch (parseErr) {
    const retryPrompt = `${prompt}\n\nYour previous response was not valid JSON. Return ONLY one JSON object with keys body, sourceTitle, sourceUrl. Keep string values on one line.`
    const retryRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: SYSTEM_JSON }],
        },
        contents: [{ parts: [{ text: retryPrompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1024,
          responseMimeType: 'application/json',
          responseSchema: FACT_JSON_SCHEMA,
        },
      }),
    })

    if (!retryRes.ok) {
      throw parseErr
    }

    const retryData = await retryRes.json()
    const retryText = retryData?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!retryText) throw parseErr

    return parseFactJson(retryText)
  }
}

export async function callProviderModel(provider, apiKey, model, prompt) {
  if (provider.type === 'gemini') {
    return callGemini(prompt, apiKey, model)
  }
  return callOpenAICompatible({
    url: provider.chatUrl,
    apiKey,
    model,
    prompt,
    extraHeaders: provider.extraHeaders ?? {},
  })
}
