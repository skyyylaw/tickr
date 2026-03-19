'use client'

import { useState, useMemo, useEffect } from 'react'
import type { WizardData } from '@/types/Thesis'
import { saveThesis } from '@/app/onboarding/actions'
import { ChipSelect } from './ChipSelect'
import { CardSelect, type CardOption } from './CardSelect'
import { RiskSlider } from './RiskSlider'
import { TickerSearch } from './TickerSearch'

// ─── Step transition container ───────────────────────────────────────────────

function StepContainer({
  direction,
  children,
}: {
  direction: 'forward' | 'back'
  children: React.ReactNode
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        visible
          ? 'opacity-100 translate-y-0'
          : direction === 'forward'
            ? 'opacity-0 translate-y-3'
            : 'opacity-0 -translate-y-3'
      }`}
    >
      {children}
    </div>
  )
}

// ─── Step option data ─────────────────────────────────────────────────────────

const INVESTMENT_GOALS = ['Growth', 'Income', 'Capital Preservation', 'Speculation', 'Learning']

const TIME_HORIZON_OPTIONS: CardOption[] = [
  { value: 'short_term', label: 'Short-term', subtitle: '< 6 months' },
  { value: 'medium_term', label: 'Medium-term', subtitle: '6 months – 2 years' },
  { value: 'long_term', label: 'Long-term', subtitle: '2+ years' },
]

const CAPITAL_RANGE_OPTIONS = ['Under $1K', '$1K–$10K', '$10K–$50K', '$50K–$100K', '$100K+']

const SECTOR_OPTIONS = [
  'Technology', 'Healthcare', 'Energy', 'Finance', 'Consumer',
  'Real Estate', 'Industrials', 'Materials', 'Utilities', 'Communication Services',
]

const INDUSTRY_OPTIONS = [
  'AI/Machine Learning', 'Electric Vehicles', 'Biotech/Pharma', 'Semiconductors',
  'Cloud Computing', 'Renewable Energy', 'Fintech', 'E-commerce', 'Social Media',
  'Space/Aerospace', 'Cannabis', 'Cybersecurity', 'Gaming', 'Real Estate/REITs',
  'Blockchain/Web3',
]

const STRATEGY_OPTIONS = [
  'Value Investing', 'Growth/Momentum', 'Event-Driven', 'Contrarian',
  'Dividend', 'Index/Passive', 'Swing Trading', 'Buy and Hold',
]

const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  'Value Investing': 'Buying undervalued companies',
  'Growth/Momentum': 'Riding high-growth trends',
  'Event-Driven': 'Earnings, M&A, catalysts',
  'Contrarian': 'Fading crowd sentiment',
  'Dividend': 'Income through distributions',
  'Index/Passive': 'Broad market exposure',
  'Swing Trading': 'Short-term price moves',
  'Buy and Hold': 'Long-term compounding',
}

const FREQUENCY_OPTIONS = [
  'multiple_daily', 'daily', 'few_times_week', 'weekly', 'monthly_or_less',
]

const FREQUENCY_LABELS: Record<string, string> = {
  multiple_daily: 'Multiple times a day',
  daily: 'Daily',
  few_times_week: 'A few times a week',
  weekly: 'Weekly',
  monthly_or_less: 'Monthly or less',
}

const EXPERIENCE_OPTIONS: CardOption[] = [
  { value: 'beginner', label: 'Beginner', subtitle: 'Just getting started' },
  { value: 'intermediate', label: 'Intermediate', subtitle: 'Understand basics, made some trades' },
  { value: 'advanced', label: 'Advanced', subtitle: 'Regularly trade, understand technical analysis' },
]

const CONSTRAINT_OPTIONS = [
  'No Options', 'No Short Selling', 'ESG Only', 'No Penny Stocks',
  'Only Large Cap', 'Only Dividend Stocks',
]

// ─── Step config builder ──────────────────────────────────────────────────────

type UpdateDataFn = <K extends keyof WizardData>(key: K, value: WizardData[K]) => void

interface StepConfig {
  title: string
  subtitle: string
  optional?: boolean
  isValid: (d: WizardData) => boolean
  component: React.ReactNode
}

function buildSteps(data: WizardData, updateData: UpdateDataFn): StepConfig[] {
  return [
    {
      title: 'What are your investment goals?',
      subtitle: 'Select all that apply',
      isValid: (d) => d.investment_goals.length > 0,
      component: (
        <ChipSelect
          options={INVESTMENT_GOALS}
          selected={data.investment_goals}
          onChange={(v) => updateData('investment_goals', v)}
        />
      ),
    },
    {
      title: "What's your time horizon?",
      subtitle: 'Pick the one that fits best',
      isValid: (d) => d.time_horizon !== '',
      component: (
        <CardSelect
          options={TIME_HORIZON_OPTIONS}
          selected={data.time_horizon}
          onChange={(v) => updateData('time_horizon', v)}
        />
      ),
    },
    {
      title: 'How much risk are you comfortable with?',
      subtitle: 'Drag the slider to set your comfort level',
      isValid: () => true,
      component: (
        <RiskSlider
          value={data.risk_tolerance}
          onChange={(v) => updateData('risk_tolerance', v)}
        />
      ),
    },
    {
      title: 'How much capital are you working with?',
      subtitle: 'Approximate is fine',
      isValid: (d) => d.capital_range !== '',
      component: (
        <ChipSelect
          options={CAPITAL_RANGE_OPTIONS}
          selected={data.capital_range ? [data.capital_range] : []}
          onChange={(v) => updateData('capital_range', v[v.length - 1] ?? '')}
          singleSelect
        />
      ),
    },
    {
      title: 'What sectors interest you?',
      subtitle: 'Select all that apply',
      isValid: (d) => d.sectors.length > 0,
      component: (
        <ChipSelect
          options={SECTOR_OPTIONS}
          selected={data.sectors}
          onChange={(v) => updateData('sectors', v)}
        />
      ),
    },
    {
      title: 'What industries or topics do you follow?',
      subtitle: 'Get more specific — select all that apply',
      isValid: (d) => d.industries.length > 0,
      component: (
        <ChipSelect
          options={INDUSTRY_OPTIONS}
          selected={data.industries}
          onChange={(v) => updateData('industries', v)}
        />
      ),
    },
    {
      title: "What's your strategy style?",
      subtitle: 'Select all that apply — hover for details',
      isValid: (d) => d.strategy_preferences.length > 0,
      component: (
        <ChipSelect
          options={STRATEGY_OPTIONS}
          selected={data.strategy_preferences}
          onChange={(v) => updateData('strategy_preferences', v)}
          descriptions={STRATEGY_DESCRIPTIONS}
        />
      ),
    },
    {
      title: 'How often do you check your investments?',
      subtitle: 'This helps us calibrate how many ideas to send you',
      isValid: (d) => d.check_frequency !== '',
      component: (
        <ChipSelect
          options={FREQUENCY_OPTIONS}
          selected={data.check_frequency ? [data.check_frequency] : []}
          onChange={(v) => updateData('check_frequency', v[v.length - 1] ?? '')}
          labels={FREQUENCY_LABELS}
          singleSelect
        />
      ),
    },
    {
      title: "What's your experience level?",
      subtitle: 'This helps us tailor how ideas are written',
      isValid: (d) => d.experience_level !== '',
      component: (
        <CardSelect
          options={EXPERIENCE_OPTIONS}
          selected={data.experience_level}
          onChange={(v) => updateData('experience_level', v)}
        />
      ),
    },
    {
      title: "Any tickers you're already watching?",
      subtitle: 'Search US stocks — optional',
      optional: true,
      isValid: () => true,
      component: (
        <TickerSearch
          selected={data.interested_tickers}
          onChange={(v) => updateData('interested_tickers', v)}
        />
      ),
    },
    {
      title: 'Any constraints?',
      subtitle: 'We\'ll filter out ideas that don\'t match — optional',
      optional: true,
      isValid: () => true,
      component: (
        <ChipSelect
          options={CONSTRAINT_OPTIONS}
          selected={data.constraints}
          onChange={(v) => updateData('constraints', v)}
        />
      ),
    },
  ]
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

const TOTAL_STEPS = 11

export function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [data, setData] = useState<WizardData>({
    investment_goals: [],
    time_horizon: '',
    risk_tolerance: 5,
    capital_range: '',
    sectors: [],
    industries: [],
    strategy_preferences: [],
    check_frequency: '',
    experience_level: '',
    interested_tickers: [],
    constraints: [],
  })

  function updateData<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }))
  }

  const steps = useMemo(
    () => buildSteps(data, updateData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data]
  )

  const step = steps[currentStep]
  const isFirst = currentStep === 0
  const isLast = currentStep === TOTAL_STEPS - 1
  const canAdvance = step.isValid(data)

  function handleNext() {
    setDirection('forward')
    setCurrentStep((prev) => Math.min(TOTAL_STEPS - 1, prev + 1))
  }

  function handleBack() {
    setDirection('back')
    setCurrentStep((prev) => Math.max(0, prev - 1))
  }

  async function handleFinish() {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await saveThesis(data)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-tickr-bg flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-10">
        <span
          className="font-serif italic font-bold text-[22px] text-tickr-text"
          style={{ letterSpacing: '-0.02em' }}
        >
          tickr
        </span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1 mb-10 w-[360px]">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-0.5 rounded-[1px] transition-colors duration-300 ${
              i <= currentStep ? 'bg-tickr-text' : 'bg-tickr-border'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="w-full max-w-[480px]">
        <h1
          className="font-serif font-bold text-2xl text-tickr-text leading-snug"
          style={{ marginBottom: '6px' }}
        >
          {step.title}
        </h1>
        <p className="text-[13px] text-tickr-muted">{step.subtitle}</p>

        <StepContainer key={currentStep} direction={direction}>
          {step.component}
        </StepContainer>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 mt-10">
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirst}
          className="px-6 py-2.5 bg-transparent border border-tickr-border rounded-[10px] text-[13px] text-tickr-secondary cursor-pointer hover:border-tickr-secondary transition-colors disabled:opacity-30 disabled:cursor-default"
        >
          Back
        </button>

        {step.optional && !isLast && (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 bg-transparent border border-tickr-border rounded-[10px] text-[13px] text-tickr-secondary cursor-pointer hover:border-tickr-secondary transition-colors"
          >
            Skip
          </button>
        )}

        {isLast ? (
          <button
            type="button"
            onClick={handleFinish}
            disabled={isSubmitting}
            className="px-8 py-2.5 bg-tickr-text rounded-[10px] text-[13px] font-medium text-white cursor-pointer hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-default"
          >
            {isSubmitting ? 'Saving…' : 'Finish'}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            disabled={!canAdvance}
            className="px-8 py-2.5 bg-tickr-text rounded-[10px] text-[13px] font-medium text-white cursor-pointer hover:bg-black/90 transition-colors disabled:opacity-40 disabled:cursor-default"
          >
            Next
          </button>
        )}
      </div>

      {submitError && (
        <p className="text-red-500 text-xs mt-3">{submitError}</p>
      )}
    </div>
  )
}
