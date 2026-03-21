'use client'

import { useState } from 'react'
import { parseCitations } from '@/lib/parseCitations'
import type { DigestRow } from '@/types/Feed'

const FEEDBACK_OPTIONS = [
  'Wrong sector',
  'Bad timing',
  'Already holding',
  'Too risky',
  'Not enough upside',
  'Other',
]

function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}

function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

interface DigestViewProps {
  initialDigest: DigestRow | null
}

export function DigestView({ initialDigest }: DigestViewProps) {
  const [digest, setDigest] = useState<DigestRow | null>(initialDigest)
  const [loading, setLoading] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)

  async function handleRefresh() {
    setLoading(true)
    try {
      const res = await fetch('/api/digest/generate', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setDigest(data.digest)
      }
    } catch (err) {
      console.error('[digest] Refresh failed:', err)
    } finally {
      setLoading(false)
    }
  }

  async function logDigestAction(action: 'digest_thumbs_up' | 'digest_thumbs_down', reason?: string) {
    if (!digest) return
    await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_type: action,
        digest_id: digest.id,
        feedback_reason: reason,
      }),
    }).catch(() => {})
  }

  if (!digest) {
    return (
      <div style={{ textAlign: 'center' as const, padding: '64px 0' }}>
        <div style={{ fontSize: '32px', marginBottom: '16px' }}>📰</div>
        <p style={{ color: '#1a1a1a', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
          No briefing yet
        </p>
        <p style={{ color: '#6b6b6b', fontSize: '14px', marginBottom: '24px' }}>
          Generate your first personalized market briefing.
        </p>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '10px 24px',
            background: loading ? '#9a9a9a' : '#1a1a1a',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Generating...' : 'Generate Briefing'}
        </button>
      </div>
    )
  }

  const sources = digest.sources ?? []

  return (
    <div>
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px',
        }}
      >
        <span style={{ color: '#9a9a9a', fontSize: '12px' }}>
          {formatDate(digest.created_at)} at {formatTime(digest.created_at)}
        </span>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            padding: '6px 14px',
            background: 'none',
            border: '1px solid #E8E8E8',
            borderRadius: '8px',
            color: loading ? '#9a9a9a' : '#1a1a1a',
            fontSize: '12px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {/* Main card */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8E8E8',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        {/* Greeting */}
        <p
          style={{
            fontFamily: "'Noto Serif', Georgia, serif",
            color: '#1a1a1a',
            fontSize: '17px',
            fontWeight: 600,
            lineHeight: '1.5',
            marginBottom: '24px',
          }}
        >
          {digest.greeting}
        </p>

        {/* Sections */}
        {(digest.sections ?? []).map((section, i) => (
          <div key={i} style={{ marginBottom: '20px' }}>
            <div
              style={{
                color: '#9a9a9a',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                marginBottom: '8px',
              }}
            >
              {section.label}
            </div>
            <p style={{ color: '#6b6b6b', fontSize: '14px', lineHeight: '1.75', margin: 0 }}>
              {parseCitations(section.body, sources)}
            </p>
          </div>
        ))}

        {/* Worth watching */}
        {digest.watch_today && (
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
                letterSpacing: '0.06em',
                marginBottom: '6px',
              }}
            >
              WORTH WATCHING
            </div>
            <p style={{ color: '#6b6b6b', fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
              {digest.watch_today}
            </p>
          </div>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                color: '#9a9a9a',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              SOURCES
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '10px' }}>
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
                  }}
                >
                  [{s.id}] {s.publisher} ↗
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Feedback row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid #F0F0F0',
            position: 'relative' as const,
          }}
        >
          <span style={{ color: '#9a9a9a', fontSize: '12px' }}>Was this helpful?</span>
          <button
            onClick={() => logDigestAction('digest_thumbs_up')}
            style={{
              background: 'none',
              border: '1px solid #E8E8E8',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '12px',
              color: '#1a1a1a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
            </svg>
            Yes
          </button>
          <div style={{ position: 'relative' as const }}>
            <button
              onClick={() => setShowFeedback((v) => !v)}
              style={{
                background: 'none',
                border: '1px solid #E8E8E8',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                color: '#1a1a1a',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
                <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
              </svg>
              No
            </button>
            {showFeedback && (
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: '100%',
                  marginTop: '6px',
                  background: '#FFFFFF',
                  border: '1px solid #E8E8E8',
                  borderRadius: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                  padding: '6px',
                  zIndex: 50,
                  minWidth: '180px',
                }}
              >
                {FEEDBACK_OPTIONS.map((option) => (
                  <button
                    key={option}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      padding: '8px 12px',
                      fontSize: '13px',
                      color: '#1a1a1a',
                      cursor: 'pointer',
                      borderRadius: '6px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F5F5F5')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                    onClick={() => {
                      logDigestAction('digest_thumbs_down', option)
                      setShowFeedback(false)
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
