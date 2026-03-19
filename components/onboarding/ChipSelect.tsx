'use client'

import { useState } from 'react'

interface ChipSelectProps {
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  descriptions?: Record<string, string>
  labels?: Record<string, string>
  singleSelect?: boolean
}

export function ChipSelect({
  options,
  selected,
  onChange,
  descriptions,
  labels,
  singleSelect = false,
}: ChipSelectProps) {
  const [hoveredOption, setHoveredOption] = useState<string | null>(null)

  function toggle(option: string) {
    if (singleSelect) {
      onChange([option])
      return
    }
    if (selected.includes(option)) {
      onChange(selected.filter((s) => s !== option))
    } else {
      onChange([...selected, option])
    }
  }

  const activeDescription =
    descriptions && hoveredOption ? descriptions[hoveredOption] : null

  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-6">
        {options.map((option) => {
          const isSelected = selected.includes(option)
          return (
            <button
              key={option}
              type="button"
              onClick={() => toggle(option)}
              onMouseEnter={() => descriptions && setHoveredOption(option)}
              onMouseLeave={() => descriptions && setHoveredOption(null)}
              className={`px-5 py-2.5 rounded-full text-[13px] font-medium cursor-pointer transition-colors border ${
                isSelected
                  ? 'bg-tickr-text border-tickr-text text-white'
                  : 'bg-transparent border-tickr-border text-tickr-secondary hover:border-tickr-secondary'
              }`}
            >
              {labels ? labels[option] : option}
            </button>
          )
        })}
      </div>
      {descriptions && (
        <p className="text-[12px] text-tickr-muted mt-3 h-4 transition-opacity">
          {activeDescription ?? '\u00a0'}
        </p>
      )}
    </div>
  )
}
