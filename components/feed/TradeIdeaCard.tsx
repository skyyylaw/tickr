'use client'

import { parseCitations } from '@/lib/parseCitations'
import { DirectionBadge } from './DirectionBadge'
import { TickerMeta } from './TickerMeta'
import { ActionButtons } from './ActionButtons'
import type { TradeIdeaRow } from '@/types/Feed'

function confidenceLabel(score: number | null): string {
  if (score === null) return ''
  if (score >= 0.7) return 'High confidence'
  if (score >= 0.4) return 'Moderate confidence'
  return 'Low confidence'
}

function confidenceColor(score: number | null): string {
  if (score === null) return '#9a9a9a'
  if (score >= 0.7) return '#1B8C5A'
  if (score >= 0.4) return '#8B7300'
  return '#C4342D'
}

const sectionLabel: React.CSSProperties = {
  color: '#9a9a9a',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.05em',
  marginBottom: '8px',
}

interface TradeIdeaCardProps {
  idea: TradeIdeaRow
  isExpanded: boolean
  isThumbsUp: boolean
  isThumbsDown: boolean
  onExpand: () => void
  onCollapse: () => void
  onSave: () => void
  onDismiss: () => void
  onThumbsUp: () => void
  onThumbsDown: (reason: string) => void
  onDropdownChange?: (open: boolean) => void
}

export function TradeIdeaCard({
  idea,
  isExpanded,
  isThumbsUp,
  isThumbsDown,
  onExpand,
  onCollapse,
  onSave,
  onDismiss,
  onThumbsUp,
  onThumbsDown,
  onDropdownChange,
}: TradeIdeaCardProps) {
  const direction = (idea.direction ?? 'hold') as 'buy' | 'sell' | 'hold'
  const sources = idea.sources ?? []

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
          <DirectionBadge direction={direction} />
          <div style={{ flex: 1 }}>
            <div style={{ color: '#1a1a1a', fontSize: '15px', fontWeight: 600, lineHeight: '1.45' }}>
              {idea.headline}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <TickerMeta
                ticker={idea.ticker}
                priceAtGeneration={idea.price_at_generation}
                createdAt={idea.created_at}
              />
              <div style={{ marginLeft: 'auto' }}>
                <ActionButtons
                  ideaId={idea.id}
                  isSaved={idea.status === 'saved'}
                  isThumbsUp={isThumbsUp}
                  isThumbsDown={isThumbsDown}
                  onSave={onSave}
                  onThumbsUp={onThumbsUp}
                  onThumbsDown={onThumbsDown}
                  onDropdownChange={onDropdownChange}
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
        <DirectionBadge direction={direction} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#1a1a1a', fontSize: '14px', fontWeight: 700 }}>
          {idea.ticker}
        </span>
        {idea.price_at_generation !== null && (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#6b6b6b', fontSize: '12px' }}>
            ${idea.price_at_generation.toFixed(2)}
          </span>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <ActionButtons
            ideaId={idea.id}
            isSaved={idea.status === 'saved'}
            isThumbsUp={isThumbsUp}
            isThumbsDown={isThumbsDown}
            showDismiss
            onSave={onSave}
            onDismiss={onDismiss}
            onThumbsUp={onThumbsUp}
            onThumbsDown={onThumbsDown}
            onDropdownChange={onDropdownChange}
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

      {/* Event summary */}
      {idea.event_summary && (
        <div
          style={{
            color: '#6b6b6b',
            fontSize: '13px',
            lineHeight: '1.6',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid #F0F0F0',
          }}
        >
          {parseCitations(idea.event_summary, sources)}
        </div>
      )}

      {/* Why it matters */}
      {idea.reasoning && idea.reasoning.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionLabel}>WHY IT MATTERS</div>
          {idea.reasoning.map((bullet, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <span style={{ color: '#9a9a9a', fontSize: '12px', marginTop: '1px', flexShrink: 0 }}>—</span>
              <span style={{ color: '#1a1a1a', fontSize: '13px', lineHeight: '1.55' }}>
                {parseCitations(bullet, sources)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Risks */}
      {idea.risks && idea.risks.length > 0 && (
        <div style={{ marginBottom: '16px' }}>
          <div style={sectionLabel}>RISKS</div>
          <div style={{ color: '#6b6b6b', fontSize: '13px', lineHeight: '1.6' }}>
            {idea.risks.join(' · ')}
          </div>
        </div>
      )}

      {/* Watch for */}
      {idea.watch_for && (
        <div style={{ marginBottom: '20px' }}>
          <div style={sectionLabel}>WATCH FOR</div>
          <div style={{ color: '#6b6b6b', fontSize: '13px', lineHeight: '1.6' }}>
            {idea.watch_for}
          </div>
        </div>
      )}

      {/* Footer row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #F0F0F0',
          flexWrap: 'wrap' as const,
        }}
      >
        {idea.time_horizon && (
          <span
            style={{
              fontSize: '11px',
              color: '#6b6b6b',
              padding: '3px 8px',
              border: '1px solid #E8E8E8',
              borderRadius: '20px',
            }}
          >
            {idea.time_horizon}
          </span>
        )}
        {idea.confidence_score !== null && (
          <span style={{ fontSize: '11px', color: confidenceColor(idea.confidence_score), fontWeight: 500 }}>
            {confidenceLabel(idea.confidence_score)}
          </span>
        )}
      </div>

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
        AI-generated idea · not financial advice
      </div>
    </div>
  )
}
