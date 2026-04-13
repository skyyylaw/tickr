import Anthropic from '@anthropic-ai/sdk'
import { extractJson } from './extractJson'
import * as cache from '@/lib/cache/client'
import { THESIS_QUERIES_TTL } from '@/lib/cache/ttl'
import { createHash } from 'crypto'

const LLM_MODEL = 'claude-sonnet-4-20250514'

const SYSTEM_PROMPT =
  "You extract investment search queries and relevant stock tickers from a user's investment thesis. Given the thesis text, return a JSON object with two fields: \"queries\" (an array of search queries that would find relevant current market news, events, and stock movements for the themes mentioned, each specific enough for a news search, up to 6) and \"tickers\" (an array of real US-listed stock ticker symbols relevant to the thesis themes — only actual NYSE/NASDAQ ticker symbols, not abbreviations or acronyms that aren't real tickers). Return only the raw JSON object with no markdown formatting, no code fences, no explanation."

export interface ThesisSearchResult {
  queries: string[]
  tickers: string[]
}

export async function extractThesisQueries(customThesis: string): Promise<ThesisSearchResult> {
  if (!customThesis || !customThesis.trim()) {
    return { queries: [], tickers: [] }
  }

  const thesis = customThesis.trim()
  const hash = createHash('md5').update(thesis).digest('hex')
  const cacheKey = `thesis-queries:${hash}`

  const cached = await cache.get<ThesisSearchResult>(cacheKey)
  if (cached !== null && Array.isArray(cached.queries)) {
    console.log(`[agent:thesisSearcher] Cache hit for thesis queries (${cached.queries.length} queries, ${cached.tickers.length} tickers)`)
    return cached
  }

  try {
    const client = new Anthropic()

    const response = await client.messages.create({
      model: LLM_MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: thesis }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return { queries: [], tickers: [] }
    }

    const parsed = extractJson(textBlock.text) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.queries)) {
      return { queries: [], tickers: [] }
    }

    const queries = parsed.queries.filter(
      (q): q is string => typeof q === 'string' && q.trim().length > 0
    )
    const tickers = (Array.isArray(parsed.tickers) ? parsed.tickers : []).filter(
      (t): t is string => typeof t === 'string' && /^[A-Z]{1,5}$/.test(t.trim())
    ).map((t) => t.trim())

    const result: ThesisSearchResult = { queries, tickers }
    await cache.set(cacheKey, result, 'thesis-searcher', THESIS_QUERIES_TTL)
    console.log(`[agent:thesisSearcher] Extracted ${queries.length} queries and ${tickers.length} tickers from custom thesis`)

    return result
  } catch (err) {
    console.error(
      '[agent:thesisSearcher] Failed to extract thesis queries:',
      err instanceof Error ? err.message : err
    )
    return { queries: [], tickers: [] }
  }
}
