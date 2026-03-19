'use client'

export interface CardOption {
  value: string
  label: string
  subtitle: string
}

interface CardSelectProps {
  options: CardOption[]
  selected: string
  onChange: (value: string) => void
}

export function CardSelect({ options, selected, onChange }: CardSelectProps) {
  return (
    <div className="flex gap-2.5 mt-6">
      {options.map((option) => {
        const isSelected = selected === option.value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex-1 p-5 rounded-[14px] border text-center cursor-pointer transition-colors ${
              isSelected
                ? 'bg-tickr-text border-tickr-text'
                : 'bg-tickr-surface border-tickr-border hover:border-tickr-secondary'
            }`}
          >
            <div
              className={`text-sm font-semibold ${
                isSelected ? 'text-white' : 'text-tickr-text'
              }`}
            >
              {option.label}
            </div>
            <div
              className={`text-[11px] mt-1.5 leading-snug ${
                isSelected ? 'text-white/60' : 'text-tickr-muted'
              }`}
            >
              {option.subtitle}
            </div>
          </button>
        )
      })}
    </div>
  )
}
