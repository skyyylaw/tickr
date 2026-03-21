import type { Quote, CompanyProfile, RecommendationTrend, PriceTarget, UpgradeDowngrade, EpsEstimate, EarningsTranscript } from './Finnhub'
import type { TavilySearchResult } from './Tavily'

export interface Source {
  id: number
  title: string
  url: string
  publisher: string
}

export interface DetectedEvent {
  headline: string
  summary: string
  source: string
  url: string
  tickers: string[]
  sector: string
  datetime: number
  relevanceScore: number
  matchReason: string
}

export interface TickerMetrics {
  currentPrice: number
  weekChangePercent: number
  monthChangePercent: number
  percentFrom52wHigh: number
  percentFrom52wLow: number
  relativeVolume: number
}

export interface EnrichedEvent {
  event: DetectedEvent
  quote: Quote | null
  profile: CompanyProfile | null
  metrics: TickerMetrics | null
  sources: Source[]
  tavilyContext: TavilySearchResult[]
  searchQueries: string[]
}

export interface TickerEventGroup {
  ticker: string
  events: DetectedEvent[]
  maxRelevanceScore: number
}

export interface EnrichedTickerGroup {
  ticker: string
  events: DetectedEvent[]
  quote: Quote | null
  profile: CompanyProfile | null
  metrics: TickerMetrics | null
  sources: Source[]
  tavilyContext: TavilySearchResult[]
  searchQueries: string[]
}

export interface EnrichedEarningsData {
  ticker: string
  year: number
  quarter: number
  transcript: EarningsTranscript | null
  quote: Quote | null
  profile: CompanyProfile | null
  recommendations: RecommendationTrend[]
  priceTarget: PriceTarget | null
  upgrades: UpgradeDowngrade[]
  epsEstimates: EpsEstimate[]
  tavilyContext: TavilySearchResult[]
  sources: Source[]
  searchQueries: string[]
}

export interface TradeIdeaLLMResponse {
  has_idea: boolean
  ticker: string
  direction: 'buy' | 'sell' | 'hold'
  headline: string
  event_summary: string
  reasoning: string[]
  risks: string[]
  confidence: number
  time_horizon: 'days' | 'weeks' | 'months'
  watch_for: string
  sources: Source[]
}

export interface EarningsDigestLLMResponse {
  card_type: 'earnings_digest'
  ticker: string
  quarter_label: string
  headline: string
  tldr: string
  highlights: string[]
  management_tone: string
  analyst_view: string
  thesis_connection: string | null
  sources: Source[]
}

export interface LLMCallMetadata {
  prompt: string
  response: string
  model: string
  latencyMs: number
  tokens: { input: number; output: number }
}

export interface TradeIdeaResult {
  idea: TradeIdeaLLMResponse
  metadata: LLMCallMetadata
}

export interface EarningsDigestResult {
  digest: EarningsDigestLLMResponse
  metadata: LLMCallMetadata
}

export interface PipelineResult {
  tradeIdeas: { id: string; ticker: string; headline: string }[]
  earningsDigests: { id: string; ticker: string; headline: string }[]
  errors: string[]
}
