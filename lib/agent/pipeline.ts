import { getServiceClient } from '@/lib/supabase/service'
import { detectRelevantEvents, groupEventsByTicker } from './eventDetector'
import { enrichTickerGroup } from './dataEnricher'
import { generateTradeIdeaForTickerGroup } from './ideaGenerator'
import { checkAndGenerateEarningsDigests } from './earningsTrigger'
import type { WizardData } from '@/types/Thesis'
import type { PipelineResult } from '@/types/Agent'

interface DBUserProfile {
  id: string
  investment_goals: string[]
  time_horizon: string
  risk_tolerance: number
  capital_range: string
  sectors: string[]
  industries: string[]
  strategy_preferences: string[]
  check_frequency: string
  experience_level: string
  interested_tickers: string[]
  constraints: string[]
  custom_thesis: string | null
}

function toWizardData(row: DBUserProfile): WizardData {
  return {
    investment_goals: row.investment_goals || [],
    time_horizon: row.time_horizon || '',
    risk_tolerance: row.risk_tolerance || 5,
    capital_range: row.capital_range || '',
    sectors: row.sectors || [],
    industries: row.industries || [],
    strategy_preferences: row.strategy_preferences || [],
    check_frequency: row.check_frequency || '',
    experience_level: row.experience_level || '',
    interested_tickers: row.interested_tickers || [],
    constraints: row.constraints || [],
    custom_thesis: row.custom_thesis || undefined,
  }
}

export async function runAgentPipeline(userId: string): Promise<PipelineResult> {
  const supabase = getServiceClient()
  const errors: string[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profileRow, error: profileError } = await (supabase as any)
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single() as { data: DBUserProfile | null; error: Error | null }

  if (profileError || !profileRow) {
    return {
      tradeIdeas: [],
      earningsDigests: [],
      errors: ['User profile not found. Please complete onboarding.'],
    }
  }

  const userProfile = toWizardData(profileRow as DBUserProfile)

  // Merge watchlist tickers into interested_tickers so the pipeline monitors all tracked stocks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: watchlistRows } = await (supabase as any)
    .from('watchlist_items')
    .select('ticker')
    .eq('user_id', userId) as { data: { ticker: string }[] | null }

  if (watchlistRows && watchlistRows.length > 0) {
    const existingSet = new Set(userProfile.interested_tickers.map((t) => t.toUpperCase()))
    for (const row of watchlistRows) {
      if (!existingSet.has(row.ticker.toUpperCase())) {
        userProfile.interested_tickers.push(row.ticker)
        existingSet.add(row.ticker.toUpperCase())
      }
    }
  }

  if (userProfile.sectors.length === 0 && userProfile.interested_tickers.length === 0) {
    return {
      tradeIdeas: [],
      earningsDigests: [],
      errors: ['No sectors or tickers configured. Please update your profile.'],
    }
  }

  const tradeIdeasResult: { id: string; ticker: string; headline: string }[] = []
  let earningsResult: { id: string; ticker: string; headline: string }[] = []

  const [tradeIdeasOutcome, earningsOutcome] = await Promise.allSettled([
    (async () => {
      console.log(`[agent:pipeline] Starting trade ideas pipeline for user ${userId}`)
      console.log(`[agent:pipeline] User profile: sectors=${JSON.stringify(userProfile.sectors)}, tickers=${JSON.stringify(userProfile.interested_tickers)}, strategies=${JSON.stringify(userProfile.strategy_preferences)}`)

      const events = await detectRelevantEvents(userProfile)
      console.log(`[agent:pipeline] Events returned from detector: ${events.length}`)
      if (events.length === 0) {
        console.log('[agent:pipeline] No relevant events detected — pipeline will produce 0 trade ideas')
        return
      }

      // Group events by ticker → one idea per ticker, no contradictions
      const tickerGroups = groupEventsByTicker(events)
      console.log(`[agent:pipeline] Processing ${tickerGroups.length} ticker group(s)`)

      for (const group of tickerGroups) {
        try {
          const enriched = await enrichTickerGroup(group, userProfile)
          const result = await generateTradeIdeaForTickerGroup(enriched, userProfile, userId)

          if (!result) {
            console.log(`[agent] No trade idea generated for ${group.ticker} (${group.events.length} events)`)
            continue
          }

          const { idea, metadata } = result

          // Layer 2: Post-generation dedup — skip if same ticker+direction exists within 24h
          const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: duplicateCheck } = await (supabase as any)
            .from('trade_ideas')
            .select('id')
            .eq('user_id', userId)
            .eq('ticker', idea.ticker)
            .eq('direction', idea.direction)
            .in('status', ['active', 'saved'])
            .gte('created_at', twentyFourHoursAgo)
            .limit(1) as { data: { id: string }[] | null }

          if (duplicateCheck && duplicateCheck.length > 0) {
            console.log(`[agent] Dedup: skipping ${idea.ticker} ${idea.direction} — duplicate exists from last 24h (${duplicateCheck[0].id})`)
            continue
          }

          const pipelineStartTime = Date.now()

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: agentRun } = await (supabase as any)
            .from('agent_runs')
            .insert({
              user_id: userId,
              trigger_type: 'manual',
              triggering_event_data: group.events,
              user_thesis_snapshot: userProfile,
              search_queries: enriched.searchQueries,
              retrieved_data: {
                quote: enriched.quote,
                profile: enriched.profile,
                metrics: enriched.metrics,
                tavilyContext: enriched.tavilyContext.map((t) => ({
                  title: t.title,
                  url: t.url,
                  snippet: t.content.slice(0, 500),
                })),
              },
              llm_prompt: metadata.prompt,
              llm_response: metadata.response,
              llm_model: metadata.model,
              llm_latency_ms: metadata.latencyMs,
              total_latency_ms: Date.now() - pipelineStartTime + metadata.latencyMs,
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
              card_type: 'trade_idea',
              ticker: idea.ticker,
              direction: idea.direction,
              headline: idea.headline,
              event_summary: idea.event_summary,
              reasoning: idea.reasoning,
              risks: idea.risks,
              watch_for: idea.watch_for,
              sources: idea.sources,
              confidence_score: idea.confidence,
              time_horizon: idea.time_horizon,
              triggering_event: group.events.map((e) => e.headline).join(' | '),
              price_at_generation: enriched.quote?.price || null,
              status: 'active',
              extra_data: null,
            })
            .select('id')
            .single() as { data: { id: string } | null }

          if (tradeIdea) {
            tradeIdeasResult.push({
              id: tradeIdea.id,
              ticker: idea.ticker,
              headline: idea.headline,
            })
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(`[agent] Failed to process ticker group "${group.ticker}":`, message)
          errors.push(`Ticker ${group.ticker}: ${message}`)
        }
      }
    })(),

    (async () => {
      console.log(`[agent:pipeline] Starting earnings digest pipeline for user ${userId}`)
      try {
        earningsResult = await checkAndGenerateEarningsDigests(userId, userProfile)
        console.log(`[agent:pipeline] Earnings digests generated: ${earningsResult.length}`)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[agent] Earnings digest check failed:', message)
        errors.push(`Earnings check: ${message}`)
      }
    })(),
  ])

  if (tradeIdeasOutcome.status === 'rejected') {
    const message = tradeIdeasOutcome.reason instanceof Error
      ? tradeIdeasOutcome.reason.message
      : String(tradeIdeasOutcome.reason)
    errors.push(`Trade ideas pipeline: ${message}`)
  }

  if (earningsOutcome.status === 'rejected') {
    const message = earningsOutcome.reason instanceof Error
      ? earningsOutcome.reason.message
      : String(earningsOutcome.reason)
    errors.push(`Earnings pipeline: ${message}`)
  }

  return {
    tradeIdeas: tradeIdeasResult,
    earningsDigests: earningsResult,
    errors,
  }
}
