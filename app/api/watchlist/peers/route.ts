import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getPeers, getCompanyProfile } from '@/lib/finnhub/client'

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: watchlistItems } = await supabase
    .from('watchlist_items')
    .select('ticker')
    .eq('user_id', user.id)

  const tickers = (watchlistItems ?? []).map((i) => i.ticker)
  if (tickers.length === 0) {
    return NextResponse.json({ suggestions: [] })
  }

  const watchlistSet = new Set(tickers)

  // Fetch peers for all watched tickers in parallel
  const peerArrays = await Promise.all(tickers.map((t) => getPeers(t)))

  // Deduplicate and remove already-watched tickers
  const seen = new Set<string>()
  const uniquePeers: string[] = []
  for (const peers of peerArrays) {
    for (const peer of peers) {
      if (!watchlistSet.has(peer) && !seen.has(peer)) {
        seen.add(peer)
        uniquePeers.push(peer)
      }
    }
  }

  // Take top 8 and enrich with company name
  const top = uniquePeers.slice(0, 8)
  const profiles = await Promise.all(top.map((t) => getCompanyProfile(t)))

  const suggestions = top.map((ticker, i) => ({
    ticker,
    companyName: profiles[i]?.name ?? '',
  }))

  return NextResponse.json({ suggestions })
}
