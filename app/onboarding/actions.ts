'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { WizardData } from '@/types/Thesis'
import { getSuggestedTickers } from '@/lib/data/tickerSuggestions'

export async function saveThesis(data: WizardData): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/')
  }

  // Snapshot current profile before overwriting (for thesis history)
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('investment_goals, time_horizon, risk_tolerance, capital_range, sectors, industries, strategy_preferences, check_frequency, experience_level, interested_tickers, constraints, custom_thesis')
    .eq('id', user.id)
    .single()

  const updatePayload = {
    investment_goals: data.investment_goals,
    time_horizon: data.time_horizon,
    risk_tolerance: data.risk_tolerance,
    capital_range: data.capital_range,
    sectors: data.sectors,
    industries: data.industries,
    strategy_preferences: data.strategy_preferences,
    check_frequency: data.check_frequency,
    experience_level: data.experience_level,
    interested_tickers: data.interested_tickers,
    constraints: data.constraints,
    custom_thesis: data.custom_thesis?.trim() || null,
  }

  const { error } = await supabase
    .from('user_profiles')
    .update(updatePayload)
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  // Log thesis history if there was a previous profile
  if (currentProfile) {
    const thesisFields = Object.keys(updatePayload) as (keyof typeof updatePayload)[]
    const changedFields = thesisFields.filter((field) => {
      const oldVal = JSON.stringify(currentProfile[field])
      const newVal = JSON.stringify(updatePayload[field])
      return oldVal !== newVal
    })

    if (changedFields.length > 0) {
      const snapshot: Record<string, { from: unknown; to: unknown }> = {}
      for (const field of changedFields) {
        snapshot[field] = {
          from: currentProfile[field],
          to: updatePayload[field],
        }
      }
      await supabase.from('thesis_history').insert({
        user_id: user.id,
        changed_fields: changedFields,
        snapshot,
      })
    }
  }

  // Auto-populate watchlist if user skipped ticker selection
  if (data.interested_tickers.length === 0) {
    const suggested = getSuggestedTickers(data.sectors, data.industries).slice(0, 5)
    if (suggested.length > 0) {
      await supabase.from('watchlist_items').insert(
        suggested.map((ticker) => ({ user_id: user.id, ticker }))
      )
      redirect('/feed?seeded=1')
    }
  }

  redirect('/feed')
}
