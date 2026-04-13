import Anthropic from '@anthropic-ai/sdk'
import { extractJson } from './extractJson'
import * as cache from '@/lib/cache/client'
import { THESIS_QUERIES_TTL } from '@/lib/cache/ttl'
import { createHash } from 'crypto'

const LLM_MODEL = 'claude-sonnet-4-20250514'

const SYSTEM_PROMPT =
  "You extract investment search queries from a user's investment thesis. Given the thesis text, return a JSON array of search queries that would find relevant current market news, events, and stock movements for the themes mentioned. Each query should be specific enough for a news search. Return only the raw JSON array with no markdown formatting, no code fences, no explanation. Generate as many queries as the thesis warrants, up to a maximum of 6."

export async function extractThesisQueries(customThesis: string): Promise<string[]> {
  if (!customThesis || !customThesis.trim()) {
    return []
  }

  const thesis = customThesis.trim()
  const hash = createHash('md5').update(thesis).digest('hex')
  const cacheKey = `thesis-queries:${hash}`

  const cached = await cache.get<string[]>(cacheKey)
  if (cached !== null) {
    console.log(`[agent:thesisSearcher] Cache hit for thesis queries (${cached.length} queries)`)
    return cached
  }

  try {
    const client = new Anthropic()

    const response = await client.messages.create({
      model: LLM_MODEL,
      max_tokens: 200,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: thesis }],
    })

    const textBlock = response.content.find((block) => block.type === 'text')
    if (!textBlock || textBlock.type !== 'text') {
      return []
    }

    const queries: unknown = extractJson(textBlock.text)
    if (!Array.isArray(queries)) {
      return []
    }

    const validated = queries.filter(
      (q): q is string => typeof q === 'string' && q.trim().length > 0
    )

    await cache.set(cacheKey, validated, 'thesis-searcher', THESIS_QUERIES_TTL)
    console.log(`[agent:thesisSearcher] Extracted ${validated.length} queries from custom thesis`)

    return validated
  } catch (err) {
    console.error(
      '[agent:thesisSearcher] Failed to extract thesis queries:',
      err instanceof Error ? err.message : err
    )
    return []
  }
}
