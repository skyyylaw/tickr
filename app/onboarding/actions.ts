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

  const { error } = await supabase
    .from('user_profiles')
    .update({
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
    })
    .eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }

  redirect('/feed')
}
