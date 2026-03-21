import type { Source } from './Agent'

export type { Source }

export interface TradeIdeaRow {
  id: string
  card_type: 'trade_idea' | 'earnings_digest'
  ticker: string
  direction: 'buy' | 'sell' | 'hold' | null
  headline: string
  event_summary: string | null
  reasoning: string[]
  risks: string[]
  watch_for: string | null
  sources: Source[]
  confidence_score: number | null
  time_horizon: 'days' | 'weeks' | 'months' | null
  price_at_generation: number | null
  status: 'active' | 'dismissed' | 'saved' | 'expired'
  extra_data: {
    card_type?: string
    quarter_label?: string
    management_tone?: string
    analyst_view?: string
    thesis_connection?: string | null
  } | null
  created_at: string
}

export interface DigestRow {
  id: string
  greeting: string
  sections: { label: string; body: string }[]
  watch_today: string | null
  sources: Source[]
  created_at: string
}
