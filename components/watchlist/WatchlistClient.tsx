'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import type { WatchlistItemWithQuote, PositionRow } from '@/types/Watchlist'

// Design tokens from wireframes
const colors = {
  bg: '#FAFAFA',
  surface: '#FFFFFF',
  text: '#1a1a1a',
  textSecondary: '#6b6b6b',
  textMuted: '#9a9a9a',
  border: '#E8E8E8',
  borderLight: '#F0F0F0',
  buy: '#1B8C5A',
  sell: '#C4342D',
  link: '#2563EB',
}

interface WatchlistClientProps {
  initialItems: WatchlistItemWithQuote[]
}

export function WatchlistClient({ initialItems }: WatchlistClientProps) {
  const [items, setItems] = useState<WatchlistItemWithQuote[]>(initialItems)
  const [tickerInput, setTickerInput] = useState('')
  const [searchResults, setSearchResults] = useState<{ symbol: string; description: string }[]>([])
  const [adding, setAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')
  const [positionModal, setPositionModal] = useState<string | null>(null)
  const [positionForm, setPositionForm] = useState({ shares: '', price: '', date: '' })
  const [positionError, setPositionError] = useState<string | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Poll for price updates every 60s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/watchlist')
        if (res.ok) {
          const data = await res.json()
          setItems(data.items)
        }
      } catch { /* silent */ }
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Debounced ticker search
  const handleSearch = useCallback((query: string) => {
    setTickerInput(query)
    setAddError(null)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 1) {
      setSearchResults([])
      setShowSearch(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`)
        if (res.ok) {
          const data = await res.json()
          setSearchResults(data.results ?? [])
          setShowSearch(true)
        }
      } catch { /* silent */ }
    }, 300)
  }, [])

  // Add ticker
  const addTicker = useCallback(async (ticker: string) => {
    setAdding(true)
    setAddError(null)
    setShowSearch(false)
    setTickerInput(ticker)

    // Optimistic: check if already exists
    if (items.some((i) => i.ticker === ticker.toUpperCase())) {
      setAddError('Already in your watchlist')
      setAdding(false)
      return
    }

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker }),
      })

      if (!res.ok) {
        const err = await res.json()
        setAddError(err.error || 'Failed to add')
        return
      }

      const data = await res.json()
      setItems((prev) => [data.item, ...prev])
      setTickerInput('')
    } catch {
      setAddError('Network error')
    } finally {
      setAdding(false)
    }
  }, [items])

  // Remove ticker (optimistic)
  const removeTicker = useCallback(async (id: string) => {
    const prev = items
    setItems((cur) => cur.filter((i) => i.id !== id))

    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setItems(prev) // rollback
      }
    } catch {
      setItems(prev) // rollback
    }
  }, [items])

  // Save notes
  const saveNotes = useCallback(async (id: string, notes: string | null) => {
    setItems((cur) =>
      cur.map((i) => (i.id === id ? { ...i, notes } : i))
    )
    setEditingNotes(null)

    try {
      await fetch(`/api/watchlist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || null }),
      })
    } catch { /* silent */ }
  }, [])

  // Add position
  const addPosition = useCallback(async (watchlistItemId: string) => {
    setPositionError(null)
    const shares = parseFloat(positionForm.shares)
    const price = parseFloat(positionForm.price)
    const date = positionForm.date

    if (!shares || shares <= 0) { setPositionError('Enter valid shares'); return }
    if (!price || price <= 0) { setPositionError('Enter valid price'); return }
    if (!date) { setPositionError('Enter a date'); return }

    try {
      const res = await fetch(`/api/watchlist/${watchlistItemId}/positions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shares, entry_price: price, entry_date: date }),
      })

      if (!res.ok) {
        const err = await res.json()
        setPositionError(err.error || 'Failed to add position')
        return
      }

      const data = await res.json()
      setItems((cur) =>
        cur.map((i) =>
          i.id === watchlistItemId
            ? { ...i, positions: [...i.positions, data.position] }
            : i
        )
      )
      setPositionModal(null)
      setPositionForm({ shares: '', price: '', date: '' })
    } catch {
      setPositionError('Network error')
    }
  }, [positionForm])

  // Delete position
  const deletePosition = useCallback(async (positionId: string, watchlistItemId: string) => {
    setItems((cur) =>
      cur.map((i) =>
        i.id === watchlistItemId
          ? { ...i, positions: i.positions.filter((p) => p.id !== positionId) }
          : i
      )
    )

    try {
      await fetch(`/api/watchlist/positions/${positionId}`, { method: 'DELETE' })
    } catch { /* silent */ }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tickerInput.trim()) {
      addTicker(tickerInput.trim())
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: colors.bg }}>
      {/* Nav */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          background: colors.surface,
          borderBottom: `1px solid ${colors.border}`,
          padding: '0 32px',
        }}
      >
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px 0 14px 0',
          }}
        >
          <Link href="/feed" style={{ textDecoration: 'none' }}>
            <span
              style={{
                fontFamily: "'Noto Serif', Georgia, serif",
                fontStyle: 'italic',
                fontWeight: 700,
                fontSize: '22px',
                color: colors.text,
                letterSpacing: '-0.02em',
              }}
            >
              tickr
            </span>
          </Link>
          <div
            style={{
              position: 'absolute',
              right: 0,
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
            }}
          >
            <Link
              href="/feed"
              style={{ color: colors.textMuted, fontSize: '12px', textDecoration: 'none' }}
            >
              Feed
            </Link>
            <span
              style={{ color: colors.text, fontSize: '12px', fontWeight: 600 }}
            >
              Watchlist
            </span>
            <Link
              href="/profile"
              style={{ color: colors.textMuted, fontSize: '12px', textDecoration: 'none' }}
            >
              Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 20px' }}>
        <h1
          style={{
            fontFamily: "'Noto Serif', Georgia, serif",
            fontSize: '24px',
            fontWeight: 700,
            color: colors.text,
            margin: '0 0 24px 0',
          }}
        >
          Watchlist
        </h1>

        {/* Add Ticker Input */}
        <div ref={searchRef} style={{ position: 'relative', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={tickerInput}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => { if (searchResults.length > 0) setShowSearch(true) }}
              placeholder="Search tickers... (e.g. AAPL)"
              style={{
                flex: 1,
                padding: '12px 16px',
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '12px',
                color: colors.text,
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <button
              onClick={() => tickerInput.trim() && addTicker(tickerInput.trim())}
              disabled={adding || !tickerInput.trim()}
              style={{
                padding: '12px 20px',
                background: adding ? colors.textMuted : colors.text,
                border: 'none',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                cursor: adding ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>

          {addError && (
            <div style={{ color: colors.sell, fontSize: '12px', marginTop: '6px' }}>
              {addError}
            </div>
          )}

          {/* Search Dropdown */}
          {showSearch && searchResults.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: colors.surface,
                border: `1px solid ${colors.border}`,
                borderTop: 'none',
                borderRadius: '0 0 12px 12px',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                maxHeight: '240px',
                overflowY: 'auto',
              }}
            >
              {searchResults.map((r) => (
                <div
                  key={r.symbol}
                  onClick={() => addTicker(r.symbol)}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${colors.borderLight}`,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = colors.bg
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = 'transparent'
                  }}
                >
                  <span
                    style={{
                      color: colors.text,
                      fontSize: '13px',
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {r.symbol}
                  </span>
                  <span style={{ color: colors.textMuted, fontSize: '12px' }}>
                    {r.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Empty State */}
        {items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>📋</div>
            <p style={{ color: colors.text, fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
              No tickers yet
            </p>
            <p style={{ color: colors.textSecondary, fontSize: '14px', maxWidth: '320px', margin: '0 auto' }}>
              Add tickers above to track prices and get AI-generated ideas tailored to your watchlist.
            </p>
          </div>
        )}

        {/* Watchlist Items */}
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              background: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: '14px',
              padding: '20px 22px',
              marginBottom: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
            }}
          >
            {/* Main Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span
                style={{
                  color: colors.text,
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  minWidth: '60px',
                }}
              >
                {item.ticker}
              </span>
              <span
                style={{
                  color: colors.textSecondary,
                  fontSize: '13px',
                  flex: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.companyName || '—'}
              </span>
              {item.price !== null && (
                <>
                  <span
                    style={{
                      color: colors.text,
                      fontSize: '14px',
                      fontWeight: 600,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    ${item.price.toFixed(2)}
                  </span>
                  <span
                    style={{
                      color: (item.change ?? 0) >= 0 ? colors.buy : colors.sell,
                      fontSize: '12px',
                      fontFamily: "'JetBrains Mono', monospace",
                      minWidth: '70px',
                      textAlign: 'right',
                    }}
                  >
                    {(item.change ?? 0) >= 0 ? '+' : ''}
                    {(item.change ?? 0).toFixed(2)} ({(item.changePercent ?? 0) >= 0 ? '+' : ''}
                    {(item.changePercent ?? 0).toFixed(2)}%)
                  </span>
                </>
              )}
              <div style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                <button
                  onClick={() => {
                    setPositionModal(item.id)
                    setPositionForm({ shares: '', price: '', date: new Date().toISOString().split('T')[0] })
                    setPositionError(null)
                  }}
                  title="Log position"
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    padding: '4px 8px',
                    color: colors.textMuted,
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  + Position
                </button>
                <button
                  onClick={() => {
                    if (editingNotes === item.id) {
                      saveNotes(item.id, notesValue)
                    } else {
                      setEditingNotes(item.id)
                      setNotesValue(item.notes || '')
                    }
                  }}
                  title={editingNotes === item.id ? 'Save note' : 'Add note'}
                  style={{
                    background: 'transparent',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    padding: '4px 8px',
                    color: colors.textMuted,
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  {editingNotes === item.id ? 'Save' : item.notes ? 'Edit Note' : 'Note'}
                </button>
                <button
                  onClick={() => removeTicker(item.id)}
                  title="Remove"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: '4px 6px',
                    color: colors.textMuted,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Notes */}
            {editingNotes === item.id ? (
              <div style={{ marginTop: '10px' }}>
                <textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Why are you watching this ticker?"
                  rows={2}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      saveNotes(item.id, notesValue)
                    }
                    if (e.key === 'Escape') setEditingNotes(null)
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.text,
                    fontSize: '13px',
                    lineHeight: '1.5',
                    resize: 'none',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            ) : item.notes ? (
              <div
                style={{
                  marginTop: '8px',
                  color: colors.textSecondary,
                  fontSize: '12px',
                  lineHeight: '1.5',
                  fontStyle: 'italic',
                }}
              >
                {item.notes}
              </div>
            ) : null}

            {/* Position Modal (inline) */}
            {positionModal === item.id && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '16px',
                  background: colors.bg,
                  borderRadius: '12px',
                  border: `1px solid ${colors.borderLight}`,
                }}
              >
                <div
                  style={{
                    color: colors.textMuted,
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    marginBottom: '12px',
                  }}
                >
                  LOG POSITION
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 100px' }}>
                    <label style={{ color: colors.textMuted, fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                      Shares
                    </label>
                    <input
                      type="number"
                      value={positionForm.shares}
                      onChange={(e) => setPositionForm((f) => ({ ...f, shares: e.target.value }))}
                      placeholder="100"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ flex: '1 1 100px' }}>
                    <label style={{ color: colors.textMuted, fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                      Entry Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={positionForm.price}
                      onChange={(e) => setPositionForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="150.00"
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div style={{ flex: '1 1 120px' }}>
                    <label style={{ color: colors.textMuted, fontSize: '11px', display: 'block', marginBottom: '4px' }}>
                      Date
                    </label>
                    <input
                      type="date"
                      value={positionForm.date}
                      onChange={(e) => setPositionForm((f) => ({ ...f, date: e.target.value }))}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        background: colors.surface,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.text,
                        fontSize: '13px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
                {positionError && (
                  <div style={{ color: colors.sell, fontSize: '12px', marginTop: '8px' }}>
                    {positionError}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button
                    onClick={() => addPosition(item.id)}
                    style={{
                      padding: '8px 18px',
                      background: colors.text,
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Save Position
                  </button>
                  <button
                    onClick={() => { setPositionModal(null); setPositionError(null) }}
                    style={{
                      padding: '8px 18px',
                      background: 'transparent',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      color: colors.textSecondary,
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Positions List */}
            {item.positions.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div
                  style={{
                    color: colors.textMuted,
                    fontSize: '10px',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    marginBottom: '6px',
                  }}
                >
                  POSITIONS
                </div>
                {item.positions.map((pos: PositionRow) => {
                  const pnl = item.price !== null
                    ? (item.price - pos.entry_price) * pos.shares
                    : null
                  const pnlPercent = item.price !== null
                    ? ((item.price - pos.entry_price) / pos.entry_price) * 100
                    : null
                  const isPositive = pnl !== null && pnl >= 0

                  return (
                    <div
                      key={pos.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        background: colors.bg,
                        borderRadius: '8px',
                        marginBottom: '4px',
                        fontSize: '12px',
                      }}
                    >
                      <span style={{ color: colors.textSecondary, fontFamily: "'JetBrains Mono', monospace" }}>
                        {pos.shares} shares @ ${Number(pos.entry_price).toFixed(2)}
                      </span>
                      <span style={{ color: colors.textMuted }}>
                        {pos.entry_date}
                      </span>
                      {pnl !== null && pnlPercent !== null && (
                        <span
                          style={{
                            color: isPositive ? colors.buy : colors.sell,
                            fontFamily: "'JetBrains Mono', monospace",
                            fontWeight: 600,
                          }}
                        >
                          {isPositive ? '+' : ''}${pnl.toFixed(2)} ({isPositive ? '+' : ''}{pnlPercent.toFixed(1)}%)
                        </span>
                      )}
                      <button
                        onClick={() => deletePosition(pos.id, item.id)}
                        style={{
                          marginLeft: 'auto',
                          background: 'transparent',
                          border: 'none',
                          color: colors.textMuted,
                          fontSize: '13px',
                          cursor: 'pointer',
                          padding: '0 4px',
                        }}
                        title="Remove position"
                      >
                        ×
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))}

        {/* Price refresh note */}
        {items.length > 0 && (
          <div style={{ color: colors.textMuted, fontSize: '11px', textAlign: 'center', marginTop: '16px' }}>
            Prices refresh every 60 seconds
          </div>
        )}
      </div>
    </div>
  )
}
