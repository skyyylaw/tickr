import { getCompanyNews, getMarketNews } from '@/lib/finnhub/client'
import type { NewsArticle } from '@/types/Finnhub'
import type { WizardData } from '@/types/Thesis'
import type { DetectedEvent, TickerEventGroup } from '@/types/Agent'

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

function scoreArticle(article: NewsArticle, profile: WizardData): { score: number; reason: string } {
  let score = 0
  let reason = ''

  const relatedTickers = article.related
    ? article.related.split(',').map((t) => t.trim().toUpperCase())
    : []

  const watchlistMatch = profile.interested_tickers.some((t) =>
    relatedTickers.includes(t.toUpperCase())
  )
  if (watchlistMatch) {
    score += 0.4
    reason = 'watchlist ticker match'
  }

  const textToSearch = `${article.headline} ${article.summary}`.toLowerCase()
  const sectorMatch = profile.sectors.some((s) => textToSearch.includes(s.toLowerCase()))
  if (sectorMatch) {
    score += 0.3
    if (!reason) reason = 'sector keyword match'
  }

  const industryMatch = profile.industries.some((i) => textToSearch.includes(i.toLowerCase()))
  if (industryMatch) {
    score += 0.2
    if (!reason) reason = 'industry keyword match'
  }

  const strategyKeywords: Record<string, string[]> = {
    growth: ['growth', 'expansion', 'revenue increase', 'market share'],
    value: ['undervalued', 'discount', 'value', 'cheap', 'bargain'],
    momentum: ['surge', 'rally', 'breakout', 'momentum', 'soar'],
    dividend: ['dividend', 'yield', 'payout', 'distribution'],
    merger: ['merger', 'acquisition', 'buyout', 'takeover', 'deal'],
  }
  const strategyMatch = profile.strategy_preferences.some((pref) => {
    const keywords = strategyKeywords[pref.toLowerCase()] || [pref.toLowerCase()]
    return keywords.some((kw) => textToSearch.includes(kw))
  })
  if (strategyMatch) {
    score += 0.2
    if (!reason) reason = 'strategy alignment'
  }

  const sixHoursAgo = Date.now() / 1000 - 6 * 3600
  if (article.datetime > sixHoursAgo) {
    score += 0.1
    if (!reason) reason = 'recent event'
  }

  return { score, reason }
}

function extractPrimaryTicker(article: NewsArticle): string[] {
  if (!article.related) return []
  return article.related
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter((t) => t.length > 0)
}

export async function detectRelevantEvents(userProfile: WizardData): Promise<DetectedEvent[]> {
  const today = new Date()
  const twoDaysAgo = new Date(Date.now() - 2 * 86400_000)
  const from = toDateString(twoDaysAgo)
  const to = toDateString(today)

  const fetchPromises: Promise<NewsArticle[]>[] = []

  for (const ticker of userProfile.interested_tickers) {
    fetchPromises.push(
      getCompanyNews(ticker, from, to).catch((err) => {
        console.error(`[agent] Failed to fetch news for ${ticker}:`, err)
        return [] as NewsArticle[]
      })
    )
  }

  fetchPromises.push(
    getMarketNews('general').catch(() => [] as NewsArticle[])
  )
  fetchPromises.push(
    getMarketNews('merger').catch(() => [] as NewsArticle[])
  )

  const allResults = await Promise.all(fetchPromises)
  const allArticles = allResults.flat()

  console.log(`[agent:eventDetector] Raw articles fetched from Finnhub: ${allArticles.length}`)

  const seen = new Set<number>()
  const unique: NewsArticle[] = []
  for (const article of allArticles) {
    if (!seen.has(article.id)) {
      seen.add(article.id)
      unique.push(article)
    }
  }

  console.log(`[agent:eventDetector] Unique articles after dedup: ${unique.length}`)

  const DEFAULT_THRESHOLD = 0.15
  const MIN_THRESHOLD = 0.05
  const MIN_EVENTS = 3
  const STEP = 0.05

  const allScored = unique.map((article) => {
    const { score, reason } = scoreArticle(article, userProfile)
    return { article, score, reason }
  })

  // Log score distribution
  const scoreDistribution = { above05: 0, above03: 0, above015: 0, below015: 0 }
  for (const { score } of allScored) {
    if (score >= 0.5) scoreDistribution.above05++
    else if (score >= 0.3) scoreDistribution.above03++
    else if (score >= DEFAULT_THRESHOLD) scoreDistribution.above015++
    else scoreDistribution.below015++
  }
  console.log(`[agent:eventDetector] Score distribution: >=0.5: ${scoreDistribution.above05}, >=0.3: ${scoreDistribution.above03}, >=${DEFAULT_THRESHOLD}: ${scoreDistribution.above015}, <${DEFAULT_THRESHOLD}: ${scoreDistribution.below015}`)

  // Auto-tune: progressively lower threshold until we have enough events
  let threshold = DEFAULT_THRESHOLD
  let passing = allScored.filter(({ score }) => score >= threshold)
  while (passing.length < MIN_EVENTS && threshold > MIN_THRESHOLD) {
    threshold = Math.max(threshold - STEP, MIN_THRESHOLD)
    passing = allScored.filter(({ score }) => score >= threshold)
  }

  if (threshold < DEFAULT_THRESHOLD) {
    console.log(`[agent:eventDetector] Auto-tuned threshold from ${DEFAULT_THRESHOLD} to ${threshold.toFixed(2)} (needed ${MIN_EVENTS} events, found ${passing.length})`)
  }

  const scored = passing
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)

  console.log(`[agent:eventDetector] Articles passing threshold (${threshold.toFixed(2)}): ${passing.length}`)
  console.log(`[agent:eventDetector] Top events selected: ${scored.length}`)
  for (const { article, score, reason } of scored) {
    console.log(`[agent:eventDetector]   score=${score.toFixed(2)} reason="${reason}" headline="${article.headline.slice(0, 80)}"`)
  }

  return scored.map(({ article, score, reason }) => ({
    headline: article.headline,
    summary: article.summary,
    source: article.source,
    url: article.url,
    tickers: extractPrimaryTicker(article),
    sector: article.category || '',
    datetime: article.datetime,
    relevanceScore: Math.min(score, 1),
    matchReason: reason,
  }))
}

/** Group events by their primary ticker so the pipeline generates one idea per ticker. */
export function groupEventsByTicker(events: DetectedEvent[], maxTickers: number = 10): TickerEventGroup[] {
  const groups = new Map<string, DetectedEvent[]>()

  for (const event of events) {
    const ticker = event.tickers[0]
    if (!ticker) continue
    const existing = groups.get(ticker)
    if (existing) {
      existing.push(event)
    } else {
      groups.set(ticker, [event])
    }
  }

  const result: TickerEventGroup[] = Array.from(groups.entries()).map(
    ([ticker, tickerEvents]) => ({
      ticker,
      events: tickerEvents.sort((a, b) => b.relevanceScore - a.relevanceScore),
      maxRelevanceScore: Math.max(...tickerEvents.map((e) => e.relevanceScore)),
    })
  )

  // Sort by highest relevance, cap at max
  result.sort((a, b) => b.maxRelevanceScore - a.maxRelevanceScore)

  console.log(`[agent:eventDetector] Grouped into ${result.length} ticker groups (cap ${maxTickers}): ${result.slice(0, maxTickers).map((g) => `${g.ticker}(${g.events.length} events)`).join(', ')}`)

  return result.slice(0, maxTickers)
}
