import * as cache from '@/lib/cache/client'
import {
  QUOTE_TTL,
  COMPANY_PROFILE_TTL,
  NEWS_TTL,
  SYMBOL_SEARCH_TTL,
  CANDLES_TTL,
  ANALYST_DATA_TTL,
  EARNINGS_TRANSCRIPT_TTL,
  SEARCH_TTL,
  PEERS_TTL,
} from '@/lib/cache/ttl'
import { finnhubRateLimiter } from './rateLimiter'
import type {
  FinnhubSearchResult,
  FinnhubQuote,
  FinnhubCompanyProfile,
  FinnhubNewsArticle,
  FinnhubCandles,
  FinnhubEarningsCalendar,
  FinnhubEarningsTranscript,
  FinnhubRecommendationTrend,
  FinnhubPriceTarget,
  FinnhubUpgradeDowngrade,
  FinnhubEpsEstimate,
  SymbolMatch,
  Quote,
  CompanyProfile,
  NewsArticle,
  Candles,
  EarningsEvent,
  EarningsTranscript,
  RecommendationTrend,
  PriceTarget,
  UpgradeDowngrade,
  EpsEstimate,
} from '@/types/Finnhub'

const BASE_URL = 'https://finnhub.io/api/v1'

function getApiKey(): string {
  const key = process.env.FINNHUB_API_KEY
  if (!key) throw new Error('FINNHUB_API_KEY is not set')
  return key
}

async function fetchFinnhub<T>(path: string, params: Record<string, string> = {}): Promise<T | null> {
  await finnhubRateLimiter.waitForToken()

  const url = new URL(`${BASE_URL}${path}`)
  url.searchParams.set('token', getApiKey())
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v)
  }

  try {
    const res = await fetch(url.toString())
    if (!res.ok) {
      console.error(`[finnhub] ${path} returned ${res.status}`)
      return null
    }
    return await res.json() as T
  } catch (err) {
    console.error(`[finnhub] ${path} fetch error:`, err)
    return null
  }
}

async function cachedFetch<TRaw, TResult>(
  cacheKey: string,
  ttl: number,
  fetcher: () => Promise<TRaw | null>,
  transform: (raw: TRaw) => TResult
): Promise<TResult | null> {
  const cached = await cache.get<TResult>(cacheKey)
  if (cached !== null) return cached

  const raw = await fetcher()
  if (raw === null) return null

  const result = transform(raw)
  await cache.set(cacheKey, result, 'finnhub', ttl)
  return result
}

// --- Public API ---

export async function searchSymbol(query: string): Promise<SymbolMatch[]> {
  const cacheKey = `finnhub:search:${query.toLowerCase()}`

  const cached = await cache.get<SymbolMatch[]>(cacheKey)
  if (cached !== null) return cached

  const data = await fetchFinnhub<{ count: number; result: FinnhubSearchResult[] }>('/search', { q: query })
  if (!data) return []

  const results = (data.result ?? [])
    .filter(
      (item) =>
        item.type === 'Common Stock' &&
        !item.symbol.includes('.') &&
        item.displaySymbol === item.symbol
    )
    .slice(0, 10)
    .map((item) => ({ symbol: item.symbol, description: item.description }))

  await cache.set(cacheKey, results, 'finnhub', SYMBOL_SEARCH_TTL)
  return results
}

export async function getQuote(ticker: string): Promise<Quote | null> {
  return cachedFetch<FinnhubQuote, Quote>(
    `finnhub:quote:${ticker}`,
    QUOTE_TTL,
    () => fetchFinnhub<FinnhubQuote>('/quote', { symbol: ticker }),
    (raw) => ({
      price: raw.c,
      change: raw.d,
      changePercent: raw.dp,
      high: raw.h,
      low: raw.l,
      open: raw.o,
      previousClose: raw.pc,
      timestamp: raw.t,
    })
  )
}

export async function getCompanyProfile(ticker: string): Promise<CompanyProfile | null> {
  return cachedFetch<FinnhubCompanyProfile, CompanyProfile>(
    `finnhub:profile:${ticker}`,
    COMPANY_PROFILE_TTL,
    () => fetchFinnhub<FinnhubCompanyProfile>('/stock/profile2', { symbol: ticker }),
    (raw) => ({
      name: raw.name,
      ticker: raw.ticker,
      exchange: raw.exchange,
      industry: raw.finnhubIndustry,
      marketCap: raw.marketCapitalization,
      logo: raw.logo,
      weburl: raw.weburl,
      ipo: raw.ipo,
      country: raw.country,
    })
  )
}

export async function getCompanyNews(
  ticker: string,
  from: string,
  to: string
): Promise<NewsArticle[]> {
  const cacheKey = `finnhub:news:${ticker}:${from}:${to}`

  const cached = await cache.get<NewsArticle[]>(cacheKey)
  if (cached !== null) return cached

  const data = await fetchFinnhub<FinnhubNewsArticle[]>('/company-news', {
    symbol: ticker,
    from,
    to,
  })
  if (!data) return []

  const articles: NewsArticle[] = data.map((a) => ({
    id: a.id,
    headline: a.headline,
    summary: a.summary,
    source: a.source,
    url: a.url,
    image: a.image,
    datetime: a.datetime,
    category: a.category,
    related: a.related,
  }))

  await cache.set(cacheKey, articles, 'finnhub', NEWS_TTL)
  return articles
}

export async function getCandles(
  ticker: string,
  resolution: 'D',
  from: number,
  to: number
): Promise<Candles | null> {
  return cachedFetch<FinnhubCandles, Candles>(
    `finnhub:candles:${ticker}:${resolution}:${from}:${to}`,
    CANDLES_TTL,
    () =>
      fetchFinnhub<FinnhubCandles>('/stock/candle', {
        symbol: ticker,
        resolution,
        from: String(from),
        to: String(to),
      }),
    (raw) => {
      if (raw.s !== 'ok') return { close: [], high: [], low: [], open: [], timestamps: [], volumes: [] }
      return {
        close: raw.c,
        high: raw.h,
        low: raw.l,
        open: raw.o,
        timestamps: raw.t,
        volumes: raw.v,
      }
    }
  )
}

export async function getMarketNews(
  category: 'general' | 'forex' | 'crypto' | 'merger' = 'general'
): Promise<NewsArticle[]> {
  const cacheKey = `finnhub:market-news:${category}`

  const cached = await cache.get<NewsArticle[]>(cacheKey)
  if (cached !== null) return cached

  const data = await fetchFinnhub<FinnhubNewsArticle[]>('/news', { category })
  if (!data) return []

  const articles: NewsArticle[] = data.map((a) => ({
    id: a.id,
    headline: a.headline,
    summary: a.summary,
    source: a.source,
    url: a.url,
    image: a.image,
    datetime: a.datetime,
    category: a.category,
    related: a.related,
  }))

  await cache.set(cacheKey, articles, 'finnhub', NEWS_TTL)
  return articles
}

export async function getEarningsCalendar(
  from: string,
  to: string
): Promise<EarningsEvent[]> {
  const cacheKey = `finnhub:earnings-calendar:${from}:${to}`

  const cached = await cache.get<EarningsEvent[]>(cacheKey)
  if (cached !== null) return cached

  const data = await fetchFinnhub<FinnhubEarningsCalendar>('/calendar/earnings', { from, to })
  if (!data) return []

  const events: EarningsEvent[] = (data.earningsCalendar ?? []).map((e) => ({
    symbol: e.symbol,
    date: e.date,
    quarter: e.quarter,
    year: e.year,
    epsActual: e.epsActual,
    epsEstimate: e.epsEstimate,
    revenueActual: e.revenueActual,
    revenueEstimate: e.revenueEstimate,
  }))

  await cache.set(cacheKey, events, 'finnhub', SEARCH_TTL)
  return events
}

export async function getEarningsTranscript(
  ticker: string,
  year: number,
  quarter: number
): Promise<EarningsTranscript | null> {
  return cachedFetch<FinnhubEarningsTranscript, EarningsTranscript>(
    `finnhub:transcript:${ticker}:${year}:Q${quarter}`,
    EARNINGS_TRANSCRIPT_TTL,
    () =>
      fetchFinnhub<FinnhubEarningsTranscript>('/stock/transcript', {
        symbol: ticker,
        year: String(year),
        quarter: String(quarter),
      }),
    (raw) => ({
      symbol: raw.symbol,
      transcript: raw.transcript.map((s) => ({ name: s.name, speech: s.speech })),
    })
  )
}

export async function getRecommendationTrends(
  ticker: string
): Promise<RecommendationTrend[]> {
  const cacheKey = `finnhub:recommendations:${ticker}`

  const cached = await cache.get<RecommendationTrend[]>(cacheKey)
  if (cached !== null) return cached

  const data = await fetchFinnhub<FinnhubRecommendationTrend[]>('/stock/recommendation', {
    symbol: ticker,
  })
  if (!data) return []

  const trends: RecommendationTrend[] = data.map((r) => ({
    period: r.period,
    buy: r.buy,
    hold: r.hold,
    sell: r.sell,
    strongBuy: r.strongBuy,
    strongSell: r.strongSell,
  }))

  await cache.set(cacheKey, trends, 'finnhub', ANALYST_DATA_TTL)
  return trends
}

export async function getPriceTarget(ticker: string): Promise<PriceTarget | null> {
  return cachedFetch<FinnhubPriceTarget, PriceTarget>(
    `finnhub:price-target:${ticker}`,
    ANALYST_DATA_TTL,
    () => fetchFinnhub<FinnhubPriceTarget>('/stock/price-target', { symbol: ticker }),
    (raw) => ({
      targetHigh: raw.targetHigh,
      targetLow: raw.targetLow,
      targetMean: raw.targetMean,
      targetMedian: raw.targetMedian,
      lastUpdated: raw.lastUpdated,
    })
  )
}

export async function getUpgradeDowngrade(ticker: string): Promise<UpgradeDowngrade[]> {
  const cacheKey = `finnhub:upgrades:${ticker}`

  const cached = await cache.get<UpgradeDowngrade[]>(cacheKey)
  if (cached !== null) return cached

  const data = await fetchFinnhub<FinnhubUpgradeDowngrade[]>('/stock/upgrade-downgrade', {
    symbol: ticker,
  })
  if (!data) return []

  const results: UpgradeDowngrade[] = data.map((u) => ({
    action: u.action,
    company: u.company,
    fromGrade: u.fromGrade,
    toGrade: u.toGrade,
    date: u.gradeTime,
    symbol: u.symbol,
  }))

  await cache.set(cacheKey, results, 'finnhub', ANALYST_DATA_TTL)
  return results
}

export async function getEpsEstimates(ticker: string): Promise<EpsEstimate[]> {
  const cacheKey = `finnhub:eps-estimates:${ticker}`

  const cached = await cache.get<EpsEstimate[]>(cacheKey)
  if (cached !== null) return cached

  const data = await fetchFinnhub<{ data: FinnhubEpsEstimate[] }>('/stock/eps-surprise', {
    symbol: ticker,
  })
  if (!data) return []

  const estimates: EpsEstimate[] = (data.data ?? []).map((e) => ({
    period: e.period,
    quarter: e.quarter,
    year: e.year,
    epsActual: e.epsActual,
    epsEstimate: e.epsEstimate,
    surprise: e.surprise,
    surprisePercent: e.surprisePercent,
  }))

  await cache.set(cacheKey, estimates, 'finnhub', ANALYST_DATA_TTL)
  return estimates
}

export async function getPeers(ticker: string): Promise<string[]> {
  const cacheKey = `finnhub:peers:${ticker}`

  const cached = await cache.get<string[]>(cacheKey)
  if (cached !== null) return cached

  const data = await fetchFinnhub<string[]>('/stock/peers', { symbol: ticker })
  if (!data) return []

  // Filter out the ticker itself and any non-US symbols (containing dots)
  const peers = data.filter((s) => s !== ticker && !s.includes('.'))

  await cache.set(cacheKey, peers, 'finnhub', PEERS_TTL)
  return peers
}
