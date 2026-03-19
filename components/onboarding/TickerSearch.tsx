'use client'

import { useState, useRef, useEffect } from 'react'
import type { TickerResult } from '@/types/Thesis'

interface TickerSearchProps {
  selected: string[]
  onChange: (tickers: string[]) => void
  maxTickers?: number
}

export function TickerSearch({
  selected,
  onChange,
  maxTickers = 20,
}: TickerSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TickerResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  function handleQueryChange(value: string) {
    setQuery(value)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        const res = await fetch(
          `/api/market/search?q=${encodeURIComponent(value)}`
        )
        const data = await res.json()
        setResults(data.results ?? [])
        setIsOpen(true)
      } catch {
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)
  }

  function selectTicker(symbol: string) {
    if (!selected.includes(symbol) && selected.length < maxTickers) {
      onChange([...selected, symbol])
    }
    setQuery('')
    setResults([])
    setIsOpen(false)
  }

  function removeTicker(symbol: string) {
    onChange(selected.filter((s) => s !== symbol))
  }

  const atMax = selected.length >= maxTickers

  return (
    <div className="mt-6">
      {!atMax && (
        <div className="relative">
          <input
            type="text"
            placeholder="Search tickers... (e.g. AAPL)"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            className={`w-full px-4 py-3 bg-tickr-surface border border-tickr-border text-sm text-tickr-text placeholder:text-tickr-muted focus:outline-none focus:ring-1 focus:ring-tickr-text focus:border-tickr-text transition-colors ${
              isOpen && results.length > 0 ? 'rounded-t-xl' : 'rounded-xl'
            }`}
          />
          {isLoading && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] text-tickr-muted">
              searching…
            </span>
          )}
          {isOpen && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 bg-tickr-surface border border-tickr-border border-t-0 rounded-b-xl z-10 overflow-hidden">
              {results.map((item, i) => (
                <div
                  key={item.symbol}
                  onMouseDown={() => selectTicker(item.symbol)}
                  className={`px-4 py-2.5 flex justify-between items-center cursor-pointer hover:bg-tickr-bg ${
                    i < results.length - 1
                      ? 'border-b border-tickr-border-light'
                      : ''
                  }`}
                >
                  <span className="text-[13px] font-semibold font-mono text-tickr-text">
                    {item.symbol}
                  </span>
                  <span className="text-xs text-tickr-muted truncate ml-4 max-w-[240px]">
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {atMax && (
        <p className="text-[12px] text-tickr-muted mb-3">
          Maximum of {maxTickers} tickers reached.
        </p>
      )}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {selected.map((ticker) => (
            <span
              key={ticker}
              className="flex items-center gap-1 px-3 py-1.5 bg-tickr-bg border border-tickr-border rounded-full text-xs font-semibold font-mono text-tickr-text"
            >
              {ticker}
              <button
                type="button"
                onClick={() => removeTicker(ticker)}
                className="text-tickr-muted hover:text-tickr-text ml-0.5 leading-none"
                aria-label={`Remove ${ticker}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
