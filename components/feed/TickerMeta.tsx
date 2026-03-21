function formatRelativeTime(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

interface TickerMetaProps {
  ticker: string
  priceAtGeneration: number | null
  quarterLabel?: string
  createdAt: string
}

export function TickerMeta({ ticker, priceAtGeneration, quarterLabel, createdAt }: TickerMetaProps) {
  const monoStyle = {
    fontFamily: "'JetBrains Mono', monospace",
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', flexWrap: 'wrap' as const }}>
      <span style={{ ...monoStyle, color: '#1a1a1a', fontSize: '13px', fontWeight: 600 }}>
        {ticker}
      </span>
      {priceAtGeneration !== null && (
        <span style={{ ...monoStyle, color: '#6b6b6b', fontSize: '12px' }}>
          ${priceAtGeneration.toFixed(2)}
        </span>
      )}
      {quarterLabel && (
        <span
          style={{
            color: '#9a9a9a',
            fontSize: '10px',
            padding: '2px 6px',
            border: '1px solid #E8E8E8',
            borderRadius: '4px',
          }}
        >
          {quarterLabel}
        </span>
      )}
      <span style={{ color: '#9a9a9a', fontSize: '11px' }}>·</span>
      <span style={{ color: '#9a9a9a', fontSize: '11px' }}>{formatRelativeTime(createdAt)}</span>
    </div>
  )
}
