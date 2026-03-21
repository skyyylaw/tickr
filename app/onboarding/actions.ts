'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { WizardData } from '@/types/Thesis'

export async function saveThesis(data: WizardData): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  // Snapshot current profile before overwriting (for thesis history)
  const { data: currentProfile } = await supabase
    .from('user_profiles')
    .select('investment_goals, time_horizon, risk_tolerance, capital_range, sectors, industries, strategy_preferences, check_frequency, experience_level, interested_tickers, constraints')
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

  redirect('/feed')
}
