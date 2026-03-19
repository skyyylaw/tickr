'use client'

interface RiskSliderProps {
  value: number
  onChange: (value: number) => void
}

const DESCRIPTIONS: Record<number, string> = {
  1: 'Very conservative. Capital preservation is the priority.',
  2: 'Very conservative. Capital preservation is the priority.',
  3: 'Conservative. Prefer steady, low-volatility positions.',
  4: 'Conservative. Prefer steady, low-volatility positions.',
  5: 'Moderate. Balanced mix of risk and reward.',
  6: 'Moderate. Balanced mix of risk and reward.',
  7: 'Growth-oriented. Comfortable with significant volatility.',
  8: 'Growth-oriented. Comfortable with significant volatility.',
  9: 'Aggressive. Maximum growth, high risk tolerance.',
  10: 'Aggressive. Maximum growth, high risk tolerance.',
}

export function RiskSlider({ value, onChange }: RiskSliderProps) {
  const pct = ((value - 1) / 9) * 100
  const trackStyle = {
    background: `linear-gradient(to right, #1a1a1a ${pct}%, #E8E8E8 ${pct}%)`,
  }

  return (
    <div className="mt-8">
      <input
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="risk-slider w-full cursor-pointer h-0.5 rounded-full outline-none"
        style={trackStyle}
      />
      <div className="flex justify-between items-center mt-3">
        <span className="text-[12px] text-tickr-muted">Conservative</span>
        <span className="text-[20px] font-bold text-tickr-text font-serif">
          {value}
        </span>
        <span className="text-[12px] text-tickr-muted">Aggressive</span>
      </div>
      <p className="text-[13px] text-tickr-secondary text-center mt-4">
        {DESCRIPTIONS[value]}
      </p>
    </div>
  )
}
