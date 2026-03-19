export interface WizardData {
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

export interface TickerResult {
  symbol: string
  description: string
}
