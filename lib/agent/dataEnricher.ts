import { getQuote, getCompanyProfile, getCandles } from '@/lib/finnhub/client'
import { search as tavilySearch } from '@/lib/tavily/client'
import type { Candles, Quote } from '@/types/Finnhub'
import type { WizardData } from '@/types/Thesis'
import type { DetectedEvent, EnrichedEvent, TickerMetrics, Source } from '@/types/Agent'

function computeTickerMetrics(
  candles: Candles | null,
  quote: Quote | null
): TickerMetrics | null {
  if (!candles || candles.close.length < 5) return null

  const closes = candles.close
  const volumes = candles.volumes
  const currentPrice = quote?.price ?? closes[closes.length - 1]

  const weekAgoIdx = Math.max(0, closes.length - 6)
  const weekChangePercent = ((currentPrice - closes[weekAgoIdx]) / closes[weekAgoIdx]) * 100

  const monthChangePercent = ((currentPrice - closes[0]) / closes[0]) * 100

  const periodHigh = Math.max(...candles.high)
  const periodLow = Math.min(...candles.low)
  const percentFrom52wHigh = periodHigh > 0
    ? ((periodHigh - currentPrice) / periodHigh) * 100
    : 0
  const percentFrom52wLow = periodLow > 0
    ? ((currentPrice - periodLow) / periodLow) * 100
    : 0

  const avgVolume = volumes.length > 0
    ? volumes.reduce((sum, v) => sum + v, 0) / volumes.length
    : 0
  const latestVolume = volumes.length > 0 ? volumes[volumes.length - 1] : 0
  const relativeVolume = avgVolume > 0 ? latestVolume / avgVolume : 0

  return {
    currentPrice,
    weekChangePercent,
    monthChangePercent,
    percentFrom52wHigh,
    percentFrom52wLow,
    relativeVolume,
  }
}

function buildSources(
  event: DetectedEvent,
  tavilyResults: { title: string; url: string }[]
): Source[] {
  const sources: Source[] = []
  const seenUrls = new Set<string>()

  sources.push({
    id: 1,
    title: event.headline,
    url: event.url,
    publisher: event.source,
  })
  seenUrls.add(event.url)

  let nextId = 2
  for (const result of tavilyResults) {
    if (!seenUrls.has(result.url)) {
      sources.push({
        id: nextId++,
        title: result.title,
        url: result.url,
        publisher: 'Tavily',
      })
      seenUrls.add(result.url)
    }
  }

  return sources
}

export async function enrichEventData(
  event: DetectedEvent,
  userProfile: WizardData
): Promise<EnrichedEvent> {
  const ticker = event.tickers[0]
  if (!ticker) {
    return {
      event,
      quote: null,
      profile: null,
      metrics: null,
      sources: buildSources(event, []),
      tavilyContext: [],
      searchQueries: [],
    }
  }

  const now = Math.floor(Date.now() / 1000)
  const thirtyDaysAgo = now - 30 * 86400

  const sectorContext = userProfile.sectors.length > 0
    ? ` impact on ${userProfile.sectors[0]}`
    : ''
  const searchQuery = `${ticker} ${event.headline}${sectorContext}`
  const searchQueries = [
    `quote:${ticker}`,
    `profile:${ticker}`,
    `candles:${ticker}`,
    `tavily:${searchQuery}`,
  ]

  const results = await Promise.allSettled([
    getQuote(ticker),
    getCompanyProfile(ticker),
    getCandles(ticker, 'D', thirtyDaysAgo, now),
    tavilySearch(searchQuery, { maxResults: 5 }),
  ])

  const quote = results[0].status === 'fulfilled' ? results[0].value : null
  const profile = results[1].status === 'fulfilled' ? results[1].value : null
  const candles = results[2].status === 'fulfilled' ? results[2].value : null
  const tavilyResults = results[3].status === 'fulfilled' ? results[3].value : []

  if (results[0].status === 'rejected') console.error(`[agent] Quote fetch failed for ${ticker}:`, results[0].reason)
  if (results[1].status === 'rejected') console.error(`[agent] Profile fetch failed for ${ticker}:`, results[1].reason)
  if (results[2].status === 'rejected') console.error(`[agent] Candles fetch failed for ${ticker}:`, results[2].reason)
  if (results[3].status === 'rejected') console.error(`[agent] Tavily search failed for ${ticker}:`, results[3].reason)

  const metrics = computeTickerMetrics(candles, quote)
  const sources = buildSources(event, tavilyResults)

  return {
    event,
    quote,
    profile,
    metrics,
    sources,
    tavilyContext: tavilyResults,
    searchQueries,
  }
}
