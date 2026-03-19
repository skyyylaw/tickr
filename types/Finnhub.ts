export interface FinnhubSearchResult {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

export interface FinnhubQuote {
  c: number  // current price
  d: number  // change
  dp: number // percent change
  h: number  // high of the day
  l: number  // low of the day
  o: number  // open
  pc: number // previous close
  t: number  // timestamp
}

export interface FinnhubCompanyProfile {
  country: string
  currency: string
  exchange: string
  finnhubIndustry: string
  ipo: string
  logo: string
  marketCapitalization: number
  name: string
  phone: string
  shareOutstanding: number
  ticker: string
  weburl: string
}

export interface FinnhubNewsArticle {
  category: string
  datetime: number
  headline: string
  id: number
  image: string
  related: string
  source: string
  summary: string
  url: string
}

export interface FinnhubCandles {
  c: number[] // close prices
  h: number[] // high prices
  l: number[] // low prices
  o: number[] // open prices
  s: string   // status: "ok" or "no_data"
  t: number[] // timestamps
  v: number[] // volumes
}

export interface FinnhubEarningsCalendarEvent {
  date: string
  epsActual: number | null
  epsEstimate: number | null
  hour: string
  quarter: number
  revenueActual: number | null
  revenueEstimate: number | null
  symbol: string
  year: number
}

export interface FinnhubEarningsCalendar {
  earningsCalendar: FinnhubEarningsCalendarEvent[]
}

export interface FinnhubTranscriptSection {
  name: string
  speech: string[]
}

export interface FinnhubEarningsTranscript {
  symbol: string
  transcript: FinnhubTranscriptSection[]
}

export interface FinnhubRecommendationTrend {
  buy: number
  hold: number
  period: string
  sell: number
  strongBuy: number
  strongSell: number
  symbol: string
}

export interface FinnhubPriceTarget {
  lastUpdated: string
  symbol: string
  targetHigh: number
  targetLow: number
  targetMean: number
  targetMedian: number
}

export interface FinnhubUpgradeDowngrade {
  action: string
  company: string
  fromGrade: string
  gradeTime: string
  symbol: string
  toGrade: string
}

export interface FinnhubEpsEstimate {
  epsActual: number | null
  epsEstimate: number | null
  period: string
  quarter: number
  surprise: number | null
  surprisePercent: number | null
  symbol: string
  year: number
}

// Normalized types for consumer use

export interface SymbolMatch {
  symbol: string
  description: string
}

export interface Quote {
  price: number
  change: number
  changePercent: number
  high: number
  low: number
  open: number
  previousClose: number
  timestamp: number
}

export interface CompanyProfile {
  name: string
  ticker: string
  exchange: string
  industry: string
  marketCap: number
  logo: string
  weburl: string
  ipo: string
  country: string
}

export interface NewsArticle {
  id: number
  headline: string
  summary: string
  source: string
  url: string
  image: string
  datetime: number
  category: string
  related: string
}

export interface Candles {
  close: number[]
  high: number[]
  low: number[]
  open: number[]
  timestamps: number[]
  volumes: number[]
}

export interface EarningsEvent {
  symbol: string
  date: string
  quarter: number
  year: number
  epsActual: number | null
  epsEstimate: number | null
  revenueActual: number | null
  revenueEstimate: number | null
}

export interface TranscriptSection {
  name: string
  speech: string[]
}

export interface EarningsTranscript {
  symbol: string
  transcript: TranscriptSection[]
}

export interface RecommendationTrend {
  period: string
  buy: number
  hold: number
  sell: number
  strongBuy: number
  strongSell: number
}

export interface PriceTarget {
  targetHigh: number
  targetLow: number
  targetMean: number
  targetMedian: number
  lastUpdated: string
}

export interface UpgradeDowngrade {
  action: string
  company: string
  fromGrade: string
  toGrade: string
  date: string
  symbol: string
}

export interface EpsEstimate {
  period: string
  quarter: number
  year: number
  epsActual: number | null
  epsEstimate: number | null
  surprise: number | null
  surprisePercent: number | null
}
