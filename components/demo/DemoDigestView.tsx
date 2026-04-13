'use client'

import { parseCitations } from '@/lib/parseCitations'
import { DEMO_DIGEST } from '@/lib/demo/data'

function formatTime(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })
}

function formatDate(isoString: string): string {
  const d = new Date(isoString)
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

export function DemoDigestView() {
  const digest = DEMO_DIGEST
  const sources = digest.sources ?? []

  return (
    <div>
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
      </div>

      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E8E8E8',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
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

        {sources.length > 0 && (
          <div>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {sources.map((s) => (
                <span
                  key={s.id}
                  style={{ color: '#2563EB', fontSize: '12px' }}
                >
                  [{s.id}] {s.publisher}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
