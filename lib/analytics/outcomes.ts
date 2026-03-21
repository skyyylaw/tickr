import { getServiceClient } from '@/lib/supabase/service'

interface TradeIdea {
  id: string
  ticker: string
  direction: 'buy' | 'sell' | 'hold' | null
  price_at_generation: number | null
  created_at: string
  status: string
}

interface PriceSnapshot {
  id: string
  price: number
  snapshot_type: 'generation' | '1d' | '1w' | '1m'
  captured_at: string
}

export interface OutcomeAnalysis {
  ideaId: string
  ticker: string
  direction: 'buy' | 'sell' | 'hold' | null
  generationPrice: number | null
  latestSnapshotPrice: number | null
  latestSnapshotType: string | null
  latestSnapshotDate: string | null
  returnPercent: number | null
  returnAbsolute: number | null
  directionCorrect: boolean | null
  ageDays: number
}

export async function analyzeOutcome(tradeIdeaId: string): Promise<OutcomeAnalysis | null> {
  const supabase = getServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: idea, error: ideaError } = await (supabase as any)
    .from('trade_ideas')
    .select('id, ticker, direction, price_at_generation, created_at, status')
    .eq('id', tradeIdeaId)
    .single() as { data: TradeIdea | null; error: Error | null }

  if (ideaError || !idea) return null

  // Get the latest snapshot for this idea
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: snapshots } = await (supabase as any)
    .from('price_snapshots')
    .select('id, price, snapshot_type, captured_at')
    .eq('reference_trade_idea_id', tradeIdeaId)
    .order('captured_at', { ascending: false })
    .limit(1) as { data: PriceSnapshot[] | null }

  const latestSnapshot = snapshots?.[0] ?? null
  const ageDays = (Date.now() - new Date(idea.created_at).getTime()) / (1000 * 60 * 60 * 24)

  if (!idea.price_at_generation || !latestSnapshot) {
    return {
      ideaId: idea.id,
      ticker: idea.ticker,
      direction: idea.direction,
      generationPrice: idea.price_at_generation,
      latestSnapshotPrice: null,
      latestSnapshotType: null,
      latestSnapshotDate: null,
      returnPercent: null,
      returnAbsolute: null,
      directionCorrect: null,
      ageDays: Math.round(ageDays),
    }
  }

  const returnAbsolute = latestSnapshot.price - idea.price_at_generation
  const returnPercent = (returnAbsolute / idea.price_at_generation) * 100

  // Direction correctness:
  // BUY is correct if price went up
  // SELL is correct if price went down
  // HOLD: we don't judge (null)
  let directionCorrect: boolean | null = null
  if (idea.direction === 'buy') {
    directionCorrect = returnAbsolute > 0
  } else if (idea.direction === 'sell') {
    directionCorrect = returnAbsolute < 0
  }

  return {
    ideaId: idea.id,
    ticker: idea.ticker,
    direction: idea.direction,
    generationPrice: idea.price_at_generation,
    latestSnapshotPrice: latestSnapshot.price,
    latestSnapshotType: latestSnapshot.snapshot_type,
    latestSnapshotDate: latestSnapshot.captured_at,
    returnPercent: Math.round(returnPercent * 100) / 100,
    returnAbsolute: Math.round(returnAbsolute * 100) / 100,
    directionCorrect,
    ageDays: Math.round(ageDays),
  }
}

export async function analyzeUserOutcomes(userId: string): Promise<{
  outcomes: OutcomeAnalysis[]
  summary: {
    totalWithSnapshots: number
    correctCalls: number
    incorrectCalls: number
    accuracy: number | null
    avgReturnPercent: number | null
  }
}> {
  const supabase = getServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ideas } = await (supabase as any)
    .from('trade_ideas')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['active', 'saved', 'expired'])
    .not('price_at_generation', 'is', null) as { data: { id: string }[] | null }

  if (!ideas || ideas.length === 0) {
    return {
      outcomes: [],
      summary: {
        totalWithSnapshots: 0,
        correctCalls: 0,
        incorrectCalls: 0,
        accuracy: null,
        avgReturnPercent: null,
      },
    }
  }

  const outcomes = await Promise.all(
    ideas.map((i) => analyzeOutcome(i.id))
  )
  const valid = outcomes.filter((o): o is OutcomeAnalysis => o !== null && o.returnPercent !== null)
  const withDirection = valid.filter((o) => o.directionCorrect !== null)
  const correct = withDirection.filter((o) => o.directionCorrect === true)

  return {
    outcomes: valid,
    summary: {
      totalWithSnapshots: valid.length,
      correctCalls: correct.length,
      incorrectCalls: withDirection.length - correct.length,
      accuracy: withDirection.length > 0
        ? Math.round((correct.length / withDirection.length) * 100)
        : null,
      avgReturnPercent: valid.length > 0
        ? Math.round(valid.reduce((sum, o) => sum + (o.returnPercent ?? 0), 0) / valid.length * 100) / 100
        : null,
    },
  }
}
