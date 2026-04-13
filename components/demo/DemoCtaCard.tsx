'use client'

import Link from 'next/link'

interface DemoCtaCardProps {
  onRestart: () => void
}

export function DemoCtaCard({ onRestart }: DemoCtaCardProps) {
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
          padding: '40px 32px',
          maxWidth: '420px',
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          animation: 'demoFadeIn 200ms ease-out',
        }}
      >
        <h2
          style={{
            fontFamily: "'Noto Serif', Georgia, serif",
            fontSize: '24px',
            fontWeight: 700,
            color: '#1a1a1a',
            marginBottom: '12px',
          }}
        >
          Ready to build yours?
        </h2>
        <p style={{ color: '#6b6b6b', fontSize: '14px', lineHeight: '1.6', marginBottom: '12px' }}>
          Set your own thesis, build your watchlist, and get trade ideas tailored to your strategy.
        </p>
        <p style={{ color: '#9a9a9a', fontSize: '12px', lineHeight: '1.5', marginBottom: '32px' }}>
          This was just a basic walkthrough — there&apos;s much more to explore including position tracking, detailed feedback, outcome analysis, and more.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link
            href="/signup"
            style={{
              display: 'block',
              padding: '14px',
              background: '#1a1a1a',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 500,
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Sign up — it&apos;s free
          </Link>
          <button
            onClick={onRestart}
            style={{
              padding: '14px',
              background: 'transparent',
              border: '1px solid #E8E8E8',
              borderRadius: '10px',
              color: '#6b6b6b',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Restart demo
          </button>
          <Link
            href="/"
            style={{
              color: '#9a9a9a',
              fontSize: '12px',
              textDecoration: 'none',
              marginTop: '4px',
            }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
