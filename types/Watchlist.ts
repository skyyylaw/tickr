export interface WatchlistItemRow {
  id: string
  user_id: string
  ticker: string
  added_at: string
  notes: string | null
}

export interface PositionRow {
  id: string
  user_id: string
  ticker: string
  shares: number
  entry_price: number
  entry_date: string
  notes: string | null
  created_at: string
}

export interface WatchlistItemWithQuote extends WatchlistItemRow {
  companyName: string | null
  price: number | null
  change: number | null
  changePercent: number | null
  positions: PositionRow[]
}
