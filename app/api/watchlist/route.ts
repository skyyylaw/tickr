import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getQuote, getCompanyProfile } from '@/lib/finnhub/client'

const addSchema = z.object({
  ticker: z.string().min(1).max(10).transform((v) => v.toUpperCase()),
})

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  // Fetch quotes and profiles for all tickers in parallel
  const tickers = Array.from(new Set(items.map((i: { ticker: string }) => i.ticker)))
  const [quotes, profiles] = await Promise.all([
    Promise.all(tickers.map((t) => getQuote(t).then((q) => [t, q] as const))),
    Promise.all(tickers.map((t) => getCompanyProfile(t).then((p) => [t, p] as const))),
  ])

  const quoteMap = Object.fromEntries(quotes)
  const profileMap = Object.fromEntries(profiles)

  const enriched = items.map((item: { id: string; ticker: string; user_id: string; added_at: string; notes: string | null }) => {
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

  return NextResponse.json({ items: enriched })
}

export async function POST(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid ticker' }, { status: 400 })
  }

  const { ticker } = parsed.data

  // Check for duplicates
  const { data: existing } = await supabase
    .from('watchlist_items')
    .select('id')
    .eq('user_id', user.id)
    .eq('ticker', ticker)
    .single()

  if (existing) {
    return NextResponse.json({ error: 'Ticker already in watchlist' }, { status: 409 })
  }

  // Validate ticker by fetching a quote
  const quote = await getQuote(ticker)
  if (!quote || quote.price === 0) {
    return NextResponse.json({ error: 'Invalid ticker — could not fetch quote' }, { status: 404 })
  }

  const profile = await getCompanyProfile(ticker)

  const { data: item, error } = await supabase
    .from('watchlist_items')
    .insert({ user_id: user.id, ticker })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    item: {
      ...item,
      companyName: profile?.name ?? null,
      price: quote.price,
      change: quote.change,
      changePercent: quote.changePercent,
      positions: [],
    },
  }, { status: 201 })
}
