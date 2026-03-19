import * as cache from '@/lib/cache/client'
import { SEARCH_TTL } from '@/lib/cache/ttl'
import type { TavilySearchResult, TavilySearchResponse, TavilySearchOptions } from '@/types/Tavily'

const BASE_URL = 'https://api.tavily.com'

function getApiKey(): string {
  const key = process.env.TAVILY_API_KEY
  if (!key) throw new Error('TAVILY_API_KEY is not set')
  return key
}

export async function search(
  query: string,
  options: TavilySearchOptions = {}
): Promise<TavilySearchResult[]> {
  const {
    maxResults = 10,
    searchDepth = 'basic',
    includeAnswer = false,
    includeDomains,
    excludeDomains,
  } = options

  const cacheKey = `tavily:search:${query.toLowerCase().replace(/\s+/g, '+')}`

  const cached = await cache.get<TavilySearchResult[]>(cacheKey)
  if (cached !== null) return cached

  try {
    const body: Record<string, unknown> = {
      api_key: getApiKey(),
      query,
      max_results: maxResults,
      search_depth: searchDepth,
      include_answer: includeAnswer,
    }
    if (includeDomains?.length) body.include_domains = includeDomains
    if (excludeDomains?.length) body.exclude_domains = excludeDomains

    const res = await fetch(`${BASE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      console.error(`[tavily] search returned ${res.status}`)
      return []
    }

    const data: TavilySearchResponse = await res.json()
    const results: TavilySearchResult[] = (data.results ?? []).map((r) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    }))

    await cache.set(cacheKey, results, 'tavily', SEARCH_TTL)
    return results
  } catch (err) {
    console.error('[tavily] search error:', err)
    return []
  }
}
