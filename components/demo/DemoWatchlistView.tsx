'use client'

import { DEMO_WATCHLIST } from '@/lib/demo/data'

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
}

const DEMO_PEERS = [
  { ticker: 'AMD', companyName: 'Advanced Micro D...' },
  { ticker: 'GOOG', companyName: 'Alphabet Inc.' },
  { ticker: 'META', companyName: 'Meta Platforms' },
  { ticker: 'CRM', companyName: 'Salesforce Inc.' },
  { ticker: 'AVGO', companyName: 'Broadcom Inc.' },
]

export function DemoWatchlistView() {
  return (
    <div>
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

      {/* Search bar */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          readOnly
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
            cursor: 'default',
          }}
        />
        <button
          disabled
          style={{
            padding: '12px 20px',
            background: colors.text,
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 500,
            cursor: 'default',
            whiteSpace: 'nowrap',
            opacity: 0.6,
          }}
        >
          Add
        </button>
      </div>

      {/* Watchlist Items */}
      {DEMO_WATCHLIST.map((item) => (
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span
              style={{
                color: colors.text,
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
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
                    fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
                  }}
                >
                  ${item.price.toFixed(2)}
                </span>
                <span
                  style={{
                    color: (item.change ?? 0) >= 0 ? colors.buy : colors.sell,
                    fontSize: '12px',
                    fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
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
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: colors.textMuted,
                  fontSize: '11px',
                  cursor: 'default',
                }}
              >
                + Position
              </button>
              <button
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  padding: '4px 8px',
                  color: colors.textMuted,
                  fontSize: '11px',
                  cursor: 'default',
                }}
              >
                Note
              </button>
              <button
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '4px 6px',
                  color: colors.textMuted,
                  fontSize: '14px',
                  cursor: 'default',
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Notes (if present) */}
          {item.notes && (
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
          )}
        </div>
      ))}

      {/* You might also like */}
      <div
        style={{
          marginTop: '24px',
          padding: '16px 20px',
          background: colors.surface,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: '14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ color: colors.textMuted, fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em' }}>
            YOU MIGHT ALSO LIKE
          </span>
          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: colors.textMuted,
              fontSize: '14px',
              cursor: 'default',
              padding: '0 2px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {DEMO_PEERS.map((peer) => (
            <div
              key={peer.ticker}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: colors.bg,
                border: `1px solid ${colors.borderLight}`,
                borderRadius: '10px',
              }}
            >
              <span
                style={{
                  color: colors.text,
                  fontSize: '13px',
                  fontWeight: 600,
                  fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
                }}
              >
                {peer.ticker}
              </span>
              <span style={{ color: colors.textMuted, fontSize: '11px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {peer.companyName}
              </span>
              <button
                style={{
                  background: 'transparent',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '6px',
                  padding: '3px 10px',
                  color: colors.text,
                  fontSize: '11px',
                  fontWeight: 500,
                  cursor: 'default',
                  whiteSpace: 'nowrap',
                }}
              >
                Add
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Price note */}
      <div style={{ color: colors.textMuted, fontSize: '11px', textAlign: 'center', marginTop: '16px' }}>
        Demo data — prices shown are examples only
      </div>
    </div>
  )
}
