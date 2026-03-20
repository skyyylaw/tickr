import { getEarningsCalendar } from '@/lib/finnhub/client'
import { getServiceClient } from '@/lib/supabase/service'
import { generateEarningsDigest } from './earningsDigester'
import type { WizardData } from '@/types/Thesis'

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function checkAndGenerateEarningsDigests(
  userId: string,
  userProfile: WizardData
): Promise<{ id: string; ticker: string; headline: string }[]> {
  const today = new Date()
  const twoDaysAgo = new Date(Date.now() - 2 * 86400_000)
  const from = toDateString(twoDaysAgo)
  const to = toDateString(today)

  const earningsEvents = await getEarningsCalendar(from, to)
  console.log(`[agent:earnings] Earnings calendar entries (${from} to ${to}): ${earningsEvents.length}`)

  const watchlistSet = new Set(
    userProfile.interested_tickers.map((t) => t.toUpperCase())
  )
  console.log(`[agent:earnings] User watchlist tickers: ${Array.from(watchlistSet).join(', ')}`)

  const watchlistMatches = earningsEvents.filter((e) => watchlistSet.has(e.symbol.toUpperCase()))
  console.log(`[agent:earnings] Watchlist matches in calendar: ${watchlistMatches.length}`)

  const relevantEarnings = watchlistMatches.filter((e) => e.epsActual !== null)
  console.log(`[agent:earnings] With actual EPS reported: ${relevantEarnings.length}`)

  if (relevantEarnings.length === 0) {
    console.log('[agent:earnings] No relevant earnings found — skipping digest generation')
    return []
  }

  const supabase = getServiceClient()
  const cutoff = new Date(Date.now() - 48 * 3600_000).toISOString()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingDigests } = await (supabase as any)
    .from('trade_ideas')
    .select('ticker')
    .eq('user_id', userId)
    .eq('card_type', 'earnings_digest')
    .gte('created_at', cutoff) as { data: { ticker: string }[] | null }

  const existingTickers = new Set(
    (existingDigests || []).map((d) => d.ticker.toUpperCase())
  )

  const newEarnings = relevantEarnings.filter(
    (e) => !existingTickers.has(e.symbol.toUpperCase())
  )
  console.log(`[agent:earnings] Already digested tickers (last 48h): ${Array.from(existingTickers).join(', ') || 'none'}`)
  console.log(`[agent:earnings] New earnings to process: ${newEarnings.length}`)

  const results: { id: string; ticker: string; headline: string }[] = []

  for (const earning of newEarnings) {
    try {
      const { digest, metadata } = await generateEarningsDigest(
        earning.symbol,
        earning.year,
        earning.quarter,
        userProfile
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: agentRun } = await (supabase as any)
        .from('agent_runs')
        .insert({
          user_id: userId,
          trigger_type: 'event',
          triggering_event_data: {
            type: 'earnings',
            ticker: earning.symbol,
            quarter: earning.quarter,
            year: earning.year,
          },
          user_thesis_snapshot: userProfile,
          search_queries: [],
          retrieved_data: { digest },
          llm_prompt: metadata.prompt,
          llm_response: metadata.response,
          llm_model: metadata.model,
          llm_latency_ms: metadata.latencyMs,
          total_latency_ms: metadata.latencyMs,
          tokens_used: metadata.tokens,
          success: true,
          error_message: null,
        })
        .select('id')
        .single() as { data: { id: string } | null }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: tradeIdea } = await (supabase as any)
        .from('trade_ideas')
        .insert({
          user_id: userId,
          agent_run_id: agentRun?.id || null,
          card_type: 'earnings_digest',
          ticker: digest.ticker,
          direction: 'hold',
          headline: digest.headline,
          event_summary: digest.tldr,
          reasoning: digest.highlights,
          risks: [],
          watch_for: null,
          sources: digest.sources,
          confidence_score: null,
          time_horizon: null,
          triggering_event: `Q${earning.quarter} ${earning.year} earnings`,
          price_at_generation: null,
          status: 'active',
          extra_data: {
            card_type: 'earnings_digest',
            quarter_label: digest.quarter_label,
            management_tone: digest.management_tone,
            analyst_view: digest.analyst_view,
            thesis_connection: digest.thesis_connection,
          },
        })
        .select('id')
        .single() as { data: { id: string } | null }

      if (tradeIdea) {
        results.push({
          id: tradeIdea.id,
          ticker: digest.ticker,
          headline: digest.headline,
        })
      }
    } catch (err) {
      console.error(`[agent] Earnings digest failed for ${earning.symbol}:`, err)
    }
  }

  return results
}
