'use client'

interface TickerSuggestionsProps {
  suggestions: string[]
  selected: string[]
  onChange: (tickers: string[]) => void
}

export function TickerSuggestions({
  suggestions,
  selected,
  onChange,
}: TickerSuggestionsProps) {
  function toggle(ticker: string) {
    if (selected.includes(ticker)) {
      onChange(selected.filter((t) => t !== ticker))
    } else {
      onChange([...selected, ticker])
    }
  }

  function selectAll() {
    const merged = new Set([...selected, ...suggestions])
    onChange(Array.from(merged))
  }

  const allSelected = suggestions.every((t) => selected.includes(t))

  return (
    <div className="mt-6">
      <div className="flex flex-wrap gap-2">
        {suggestions.map((ticker) => {
          const isSelected = selected.includes(ticker)
          return (
            <button
              key={ticker}
              type="button"
              onClick={() => toggle(ticker)}
              className={`px-4 py-2 rounded-full text-[13px] font-semibold font-mono cursor-pointer transition-colors border ${
                isSelected
                  ? 'bg-tickr-text border-tickr-text text-white'
                  : 'bg-transparent border-tickr-border text-tickr-secondary hover:border-tickr-secondary'
              }`}
            >
              {ticker}
            </button>
          )
        })}
      </div>

      {!allSelected && (
        <button
          type="button"
          onClick={selectAll}
          className="mt-4 text-[12px] text-tickr-muted hover:text-tickr-secondary transition-colors underline underline-offset-2"
        >
          Select all
        </button>
      )}
    </div>
  )
}
