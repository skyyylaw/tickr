import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import { getServiceClient } from '@/lib/supabase/service'
import { generateDailyDigest } from '@/lib/agent/digestGenerator'
import type { WizardData } from '@/types/Thesis'

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
  }
}

// Stagger delay between user digest runs (ms)
const STAGGER_DELAY_MS = 5_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // Find active users (had agent_run or user_action in last 7 days)
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
    console.log('[cron:generate-digests] No active users found')
    return NextResponse.json({ processed: 0, generated: 0 })
  }

  // Fetch profiles for active users
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profiles } = await (supabase as any)
    .from('user_profiles')
    .select('*')
    .in('id', activeUserIds) as { data: DBUserProfile[] | null }

  const eligibleProfiles = (profiles ?? []).filter(
    (p) => (p.sectors?.length > 0) || (p.interested_tickers?.length > 0)
  )

  console.log(`[cron:generate-digests] Found ${eligibleProfiles.length} eligible users`)

  let generated = 0
  const errors: string[] = []

  for (let i = 0; i < eligibleProfiles.length; i++) {
    const profileRow = eligibleProfiles[i]

    try {
      console.log(`[cron:generate-digests] Generating digest for user ${i + 1}/${eligibleProfiles.length}: ${profileRow.id}`)
      const userProfile = toWizardData(profileRow)
      await generateDailyDigest(profileRow.id, userProfile)
      generated++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[cron:generate-digests] Failed for user ${profileRow.id}:`, message)
      errors.push(`${profileRow.id}: ${message}`)
    }

    // Stagger to respect API rate limits
    if (i < eligibleProfiles.length - 1) {
      await sleep(STAGGER_DELAY_MS)
    }
  }

  console.log(`[cron:generate-digests] Done. Generated ${generated}/${eligibleProfiles.length} digests`)

  return NextResponse.json({
    processed: eligibleProfiles.length,
    generated,
    errors: errors.length,
  })
}

export const maxDuration = 300
