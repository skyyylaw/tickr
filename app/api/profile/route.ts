import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import type { WizardData } from '@/types/Thesis'

const updateSchema = z.object({
  investment_goals: z.array(z.string()).optional(),
  time_horizon: z.string().optional(),
  risk_tolerance: z.number().min(1).max(10).optional(),
  capital_range: z.string().optional(),
  sectors: z.array(z.string()).optional(),
  industries: z.array(z.string()).optional(),
  strategy_preferences: z.array(z.string()).optional(),
  check_frequency: z.string().optional(),
  experience_level: z.string().optional(),
  interested_tickers: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  custom_thesis: z
    .string()
    .max(2000)
    .nullable()
    .optional()
    .transform((v) => {
      if (v === null || v === undefined) return v
      const trimmed = v.trim()
      return trimmed.length === 0 ? null : trimmed
    }),
})

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [profileResult, statsResult, historyResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    // Gather stats in parallel
    Promise.all([
      supabase
        .from('trade_ideas')
        .select('id, ticker, status, card_type', { count: 'exact' })
        .eq('user_id', user.id),
      supabase
        .from('user_actions')
        .select('action_type', { count: 'exact' })
        .eq('user_id', user.id),
      supabase
        .from('user_actions')
        .select('action_type')
        .eq('user_id', user.id)
        .in('action_type', ['save', 'dismiss']),
    ]),
    supabase
      .from('thesis_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (profileResult.error) {
    return NextResponse.json({ error: profileResult.error.message }, { status: 500 })
  }

  const [ideasResult, actionsCountResult, savesDismissesResult] = statsResult
  const ideas = ideasResult.data ?? []
  const totalIdeas = ideasResult.count ?? 0
  const totalActions = actionsCountResult.count ?? 0
  const savesDismisses = savesDismissesResult.data ?? []

  const saves = savesDismisses.filter((a) => a.action_type === 'save').length
  const dismisses = savesDismisses.filter((a) => a.action_type === 'dismiss').length

  // Most active sectors from generated ideas tickers
  const tickerCounts: Record<string, number> = {}
  for (const idea of ideas) {
    if (idea.ticker) {
      tickerCounts[idea.ticker] = (tickerCounts[idea.ticker] || 0) + 1
    }
  }
  const topTickers = Object.entries(tickerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ticker, count]) => ({ ticker, count }))

  return NextResponse.json({
    profile: profileResult.data,
    email: user.email,
    stats: {
      totalIdeas,
      saves,
      dismisses,
      totalActions,
      topTickers,
    },
    history: historyResult.data ?? [],
  })
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const updates = parsed.data
  const changedFields = Object.keys(updates) as (keyof WizardData)[]
  if (changedFields.length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  // Get current profile for history snapshot
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Build snapshot of only the changed fields (old -> new)
  const snapshot: Record<string, { from: unknown; to: unknown }> = {}
  for (const field of changedFields) {
    snapshot[field] = {
      from: currentProfile?.[field] ?? null,
      to: updates[field],
    }
  }

  // Update profile
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // Log to thesis_history
  await supabase
    .from('thesis_history')
    .insert({
      user_id: user.id,
      changed_fields: changedFields,
      snapshot,
    })

  return NextResponse.json({ ok: true })
}
