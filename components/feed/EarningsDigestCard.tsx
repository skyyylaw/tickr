'use client'

import { parseCitations } from '@/lib/parseCitations'
import { DirectionBadge } from './DirectionBadge'
import { TickerMeta } from './TickerMeta'
import { ActionButtons } from './ActionButtons'
import type { TradeIdeaRow } from '@/types/Feed'

const sectionLabel: React.CSSProperties = {
  color: '#9a9a9a',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.05em',
  marginBottom: '8px',
}

interface EarningsDigestCardProps {
  idea: TradeIdeaRow
  isExpanded: boolean
  onExpand: () => void
  onCollapse: () => void
  onSave: () => void
  onDismiss: () => void
  onThumbsUp: () => void
  onThumbsDown: (reason: string) => void
}

export function EarningsDigestCard({
  idea,
  isExpanded,
  onExpand,
  onCollapse,
  onSave,
  onDismiss,
  onThumbsUp,
  onThumbsDown,
}: EarningsDigestCardProps) {
  const sources = idea.sources ?? []
  const quarterLabel = idea.extra_data?.quarter_label
  const tldr = idea.event_summary
  const highlights = idea.reasoning ?? []
  const managementTone = idea.extra_data?.management_tone
  const analystView = idea.extra_data?.analyst_view
  const thesisConnection = idea.extra_data?.thesis_connection

  if (!isExpanded) {
    return (
      <div
        onClick={onExpand}
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8E8E8',
          borderRadius: '14px',
          padding: '20px 22px',
          marginBottom: '12px',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'start' }}>
          <DirectionBadge direction="earnings" />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#1a1a1a', fontSize: '15px', fontWeight: 600, lineHeight: '1.45' }}>
              {idea.headline}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TickerMeta
                ticker={idea.ticker}
                priceAtGeneration={idea.price_at_generation}
                quarterLabel={quarterLabel}
                createdAt={idea.created_at}
              />
              <div style={{ marginLeft: 'auto' }}>
                <ActionButtons
                  ideaId={idea.id}
                  isSaved={idea.status === 'saved'}
                  onSave={onSave}
                  onThumbsUp={onThumbsUp}
                  onThumbsDown={onThumbsDown}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Expanded
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8E8E8',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <DirectionBadge direction="earnings" />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#1a1a1a', fontSize: '14px', fontWeight: 700 }}>
          {idea.ticker}
        </span>
        {idea.price_at_generation !== null && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6b6b6b', fontSize: '12px' }}>
            ${idea.price_at_generation.toFixed(2)}
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
        <div style={{ marginLeft: 'auto' }}>
          <ActionButtons
            ideaId={idea.id}
            isSaved={idea.status === 'saved'}
            showDismiss
            onSave={onSave}
            onDismiss={onDismiss}
            onThumbsUp={onThumbsUp}
            onThumbsDown={onThumbsDown}
          />
        </div>
      </div>

      {/* Headline */}
      <h2
        onClick={onCollapse}
        style={{
          fontFamily: "'Noto Serif', Georgia, serif",
          color: '#1a1a1a',
          fontSize: '20px',
          fontWeight: 700,
          lineHeight: '1.35',
          margin: '12px 0 20px 0',
          cursor: 'pointer',
        }}
      >
        {idea.headline}
      </h2>

      {/* TL;DR */}
      {tldr && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionLabel}>TL;DR</div>
          <div style={{ color: '#6b6b6b', fontSize: '13px', lineHeight: '1.65' }}>
            {parseCitations(tldr, sources)}
          </div>
        </div>
      )}

      {/* Key highlights */}
      {highlights.length > 0 && (
        <div
          style={{
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #F0F0F0',
          }}
        >
          <div style={sectionLabel}>KEY HIGHLIGHTS</div>
          {highlights.map((bullet, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{ color: '#9a9a9a', fontSize: '12px', marginTop: '1px', flexShrink: 0 }}>—</span>
              <span style={{ color: '#1a1a1a', fontSize: '13px', lineHeight: '1.55' }}>{bullet}</span>
            </div>
          ))}
        </div>
      )}

      {/* Management tone */}
      {managementTone && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionLabel}>MANAGEMENT TONE</div>
          <div style={{ color: '#6b6b6b', fontSize: '13px', lineHeight: '1.6' }}>
            {managementTone}
          </div>
        </div>
      )}

      {/* What Wall Street thinks */}
      {analystView && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionLabel}>WHAT WALL STREET THINKS</div>
          <div style={{ color: '#6b6b6b', fontSize: '13px', lineHeight: '1.6' }}>
            {parseCitations(analystView, sources)}
          </div>
        </div>
      )}

      {/* Your thesis connection */}
      {thesisConnection && (
        <div
          style={{
            background: '#FAFAFA',
            borderRadius: '12px',
            padding: '14px 16px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              color: '#8B7300',
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              marginBottom: '6px',
            }}
          >
            YOUR THESIS
          </div>
          <div style={{ color: '#6b6b6b', fontSize: '13px', lineHeight: '1.6' }}>
            {thesisConnection}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <div style={sectionLabel}>SOURCES</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
            {sources.map((s) => (
              <a
                key={s.id}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#2563EB',
                  fontSize: '12px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                [{s.id}] {s.publisher} ↗
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div style={{ color: '#9a9a9a', fontSize: '11px' }}>
        AI-generated digest · not financial advice
      </div>
    </div>
  )
}
