import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import { getServiceClient } from '@/lib/supabase/service'
import { getQuote } from '@/lib/finnhub/client'

interface ActiveIdea {
  id: string
  ticker: string
  price_at_generation: number | null
  created_at: string
}

function getSnapshotType(createdAt: string): '1d' | '1w' | '1m' | null {
  const ageMs = Date.now() - new Date(createdAt).getTime()
  const ageDays = ageMs / (1000 * 60 * 60 * 24)

  // Take snapshot at the appropriate milestone (within a 36-hour window to avoid duplicates)
  if (ageDays >= 29 && ageDays < 31) return '1m'
  if (ageDays >= 6.5 && ageDays < 8) return '1w'
  if (ageDays >= 0.8 && ageDays < 1.5) return '1d'
  return null
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Fetch active trade ideas less than 30 days old
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: activeIdeas, error: fetchError } = await (supabase as any)
    .from('trade_ideas')
    .select('id, ticker, price_at_generation, created_at')
    .eq('status', 'active')
    .gt('created_at', thirtyDaysAgo) as { data: ActiveIdea[] | null; error: Error | null }

  if (fetchError) {
    console.error('[cron:price-snapshots] Failed to fetch ideas:', fetchError)
    return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 })
  }

  const ideas = activeIdeas ?? []

  // Also fetch ideas older than 30 days to expire them
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: expireError } = await (supabase as any)
    .from('trade_ideas')
    .update({ status: 'expired' })
    .eq('status', 'active')
    .lt('created_at', thirtyDaysAgo)

  if (expireError) {
    console.error('[cron:price-snapshots] Failed to expire old ideas:', expireError)
  }

  // Dedupe tickers and fetch quotes in parallel
  const tickerSet = new Set(ideas.map((i) => i.ticker).filter(Boolean))
  const tickers = Array.from(tickerSet)
  const quoteEntries = await Promise.all(
    tickers.map((t) => getQuote(t).then((q) => [t, q] as const))
  )
  const quoteMap = Object.fromEntries(quoteEntries)

  // Check existing snapshots to avoid duplicates
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingSnapshots } = await (supabase as any)
    .from('price_snapshots')
    .select('reference_trade_idea_id, snapshot_type')
    .in('reference_trade_idea_id', ideas.map((i) => i.id)) as { data: { reference_trade_idea_id: string; snapshot_type: string }[] | null }

  const existingSet = new Set(
    (existingSnapshots ?? []).map((s) => `${s.reference_trade_idea_id}:${s.snapshot_type}`)
  )

  // Create snapshots
  const inserts: {
    ticker: string
    price: number
    snapshot_type: string
    reference_trade_idea_id: string
  }[] = []

  for (const idea of ideas) {
    if (!idea.ticker) continue
    const snapshotType = getSnapshotType(idea.created_at)
    if (!snapshotType) continue

    // Skip if we already have this snapshot
    if (existingSet.has(`${idea.id}:${snapshotType}`)) continue

    const quote = quoteMap[idea.ticker]
    if (!quote) continue

    inserts.push({
      ticker: idea.ticker,
      price: quote.price,
      snapshot_type: snapshotType,
      reference_trade_idea_id: idea.id,
    })
  }

  let inserted = 0
  if (inserts.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('price_snapshots')
      .insert(inserts)

    if (insertError) {
      console.error('[cron:price-snapshots] Insert error:', insertError)
    } else {
      inserted = inserts.length
    }
  }

  console.log(`[cron:price-snapshots] Processed ${ideas.length} ideas, created ${inserted} snapshots`)

  return NextResponse.json({
    processed: ideas.length,
    snapshots_created: inserted,
    expired: 'done',
  })
}
