'use client'

import { DEMO_THESIS } from '@/lib/demo/data'

interface DemoThesisModalProps {
  onNext: () => void
}

export function DemoThesisModal({ onNext }: DemoThesisModalProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
        }}
      />
      <div
        style={{
          position: 'relative',
          background: '#FFFFFF',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: 'demoFadeIn 200ms ease-out',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <p style={{ color: '#9a9a9a', fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', marginBottom: '4px' }}>
            STEP 1 OF 11
          </p>
          <h2
            style={{
              fontFamily: "'Noto Serif', Georgia, serif",
              fontSize: '20px',
              fontWeight: 700,
              color: '#1a1a1a',
              margin: 0,
            }}
          >
            Meet {DEMO_THESIS.name}&apos;s thesis
          </h2>
        </div>

        <p style={{ color: '#6b6b6b', fontSize: '13px', lineHeight: '1.6', marginBottom: '20px' }}>
          tickr generates ideas based on your investment profile. Here&apos;s the one we set up for this demo:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
          <Row label="Goals" value={DEMO_THESIS.goals.join(', ')} />
          <Row label="Risk tolerance" value={`${DEMO_THESIS.riskTolerance} / 10 (moderate)`} />
          <Row label="Time horizon" value={DEMO_THESIS.timeHorizon} />
          <Row label="Capital range" value={DEMO_THESIS.capitalRange} />
          <Row label="Sectors" value={DEMO_THESIS.sectors.join(', ')} />
          <Row label="Industries" value={DEMO_THESIS.industries.join(', ')} />
          <Row label="Strategies" value={DEMO_THESIS.strategies.join(', ')} />
          <Row label="Watchlist" value={DEMO_THESIS.tickers.join(', ')} />
          <Row label="Experience" value={DEMO_THESIS.experience} />
        </div>

        <button
          onClick={onNext}
          style={{
            width: '100%',
            padding: '12px',
            background: '#1a1a1a',
            border: 'none',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Next
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', gap: '8px', fontSize: '13px', lineHeight: '1.5' }}>
      <span style={{ color: '#9a9a9a', minWidth: '100px', flexShrink: 0 }}>{label}</span>
      <span style={{ color: '#1a1a1a' }}>{value}</span>
    </div>
  )
}
