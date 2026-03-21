import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WatchlistClient } from '@/components/watchlist/WatchlistClient'
import { getQuote, getCompanyProfile } from '@/lib/finnhub/client'
import type { WatchlistItemWithQuote } from '@/types/Watchlist'

export default async function WatchlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [itemsResult, positionsResult] = await Promise.all([
    supabase
      .from('watchlist_items')
      .select('*')
      .eq('user_id', user.id)
      .order('added_at', { ascending: false }),
    supabase
      .from('positions')
      .select('*')
      .eq('user_id', user.id),
  ])

  const items = itemsResult.data ?? []
  const positions = positionsResult.data ?? []

  const tickers = Array.from(new Set(items.map((i: { ticker: string }) => i.ticker)))
  const [quotes, profiles] = await Promise.all([
    Promise.all(tickers.map((t) => getQuote(t).then((q) => [t, q] as const))),
    Promise.all(tickers.map((t) => getCompanyProfile(t).then((p) => [t, p] as const))),
  ])

  const quoteMap = Object.fromEntries(quotes)
  const profileMap = Object.fromEntries(profiles)

  const enriched: WatchlistItemWithQuote[] = items.map((item: { id: string; ticker: string; user_id: string; added_at: string; notes: string | null }) => {
    const q = quoteMap[item.ticker]
    const p = profileMap[item.ticker]
    return {
      ...item,
      companyName: p?.name ?? null,
      price: q?.price ?? null,
      change: q?.change ?? null,
      changePercent: q?.changePercent ?? null,
      positions: positions.filter((pos: { ticker: string }) => pos.ticker === item.ticker),
    }
  })

  return <WatchlistClient initialItems={enriched} />
}
