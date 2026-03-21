import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import { getServiceClient } from '@/lib/supabase/service'
import { runAgentPipeline } from '@/lib/agent/pipeline'

interface ActiveUser {
  id: string
}

// Stagger delay between user pipeline runs (ms)
const STAGGER_DELAY_MS = 10_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Find active users: those with a profile who have at least 1 sector or ticker,
  // and who have had an agent run or user action in the last 7 days
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentRunUsers } = await (supabase as any)
    .from('agent_runs')
    .select('user_id')
    .gt('created_at', sevenDaysAgo) as { data: { user_id: string }[] | null }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentActionUsers } = await (supabase as any)
    .from('user_actions')
    .select('user_id')
    .gt('created_at', sevenDaysAgo) as { data: { user_id: string }[] | null }

  const activeUserIds = Array.from(new Set([
    ...(recentRunUsers ?? []).map((r) => r.user_id),
    ...(recentActionUsers ?? []).map((r) => r.user_id),
  ]))

  if (activeUserIds.length === 0) {
    console.log('[cron:generate-ideas] No active users found')
    return NextResponse.json({ processed: 0, results: [] })
  }

  // Verify each user has a configured profile (sectors or tickers)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabase as any)
    .from('user_profiles')
    .select('id')
    .in('id', activeUserIds)
    .or('sectors.cs.{},interested_tickers.cs.{}')
    .not('sectors', 'eq', '{}') as { data: ActiveUser[] | null }

  // Also get users with tickers set
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tickerProfiles } = await (supabase as any)
    .from('user_profiles')
    .select('id')
    .in('id', activeUserIds)
    .not('interested_tickers', 'eq', '{}') as { data: ActiveUser[] | null }

  const eligibleIds = Array.from(new Set([
    ...(profiles ?? []).map((p) => p.id),
    ...(tickerProfiles ?? []).map((p) => p.id),
  ]))

  console.log(`[cron:generate-ideas] Found ${eligibleIds.length} eligible users out of ${activeUserIds.length} active`)

  const results: { userId: string; ideas: number; earnings: number; errors: number }[] = []

  for (let i = 0; i < eligibleIds.length; i++) {
    const userId = eligibleIds[i]

    try {
      console.log(`[cron:generate-ideas] Running pipeline for user ${i + 1}/${eligibleIds.length}: ${userId}`)
      const result = await runAgentPipeline(userId)
      results.push({
        userId,
        ideas: result.tradeIdeas.length,
        earnings: result.earningsDigests.length,
        errors: result.errors.length,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[cron:generate-ideas] Pipeline failed for user ${userId}:`, message)
      results.push({ userId, ideas: 0, earnings: 0, errors: 1 })
    }

    // Stagger to respect Finnhub rate limits
    if (i < eligibleIds.length - 1) {
      await sleep(STAGGER_DELAY_MS)
    }
  }

  const totalIdeas = results.reduce((sum, r) => sum + r.ideas, 0)
  const totalEarnings = results.reduce((sum, r) => sum + r.earnings, 0)
  console.log(`[cron:generate-ideas] Done. ${eligibleIds.length} users, ${totalIdeas} ideas, ${totalEarnings} earnings digests`)

  return NextResponse.json({
    processed: eligibleIds.length,
    totalIdeas,
    totalEarnings,
    results,
  })
}

export const maxDuration = 300
