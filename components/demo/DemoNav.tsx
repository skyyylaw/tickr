'use client'

import type { DemoTab, DemoView } from '@/lib/demo/types'

const FEED_TABS: { id: DemoTab; label: string }[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'digest', label: 'Digest' },
  { id: 'saved', label: 'Saved' },
  { id: 'dismissed', label: 'Dismissed' },
]

interface DemoNavProps {
  activeTab: DemoTab
  onTabChange: (tab: DemoTab) => void
  view: DemoView
}

export function DemoNav({ activeTab, onTabChange, view }: DemoNavProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: '#FFFFFF',
        borderBottom: '1px solid #E8E8E8',
        padding: '0 16px',
      }}
    >
      <div
        className="justify-start md:justify-center"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          padding: '16px 0 0 0',
        }}
      >
        <span>
          <span
            style={{
              fontFamily: "'Noto Serif', Georgia, serif",
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: '22px',
              color: '#1a1a1a',
              letterSpacing: '-0.02em',
            }}
          >
            tickr
          </span>
          <span
            style={{
              fontFamily: "'Noto Serif', Georgia, serif",
              fontStyle: 'italic',
              fontSize: '9px',
              color: '#9a9a9a',
              fontWeight: 400,
              marginLeft: '2px',
              position: 'relative',
              top: '5px',
            }}
          >
            by sky
          </span>
        </span>
        <div
          style={{
            position: 'absolute',
            right: 0,
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          {view === 'watchlist' ? (
            <span style={{ color: '#1a1a1a', fontSize: '12px', fontWeight: 600 }}>Watchlist</span>
          ) : (
            <span
              style={{ color: '#9a9a9a', fontSize: '12px', cursor: 'default' }}
            >
              Watchlist
            </span>
          )}
          <span style={{ color: '#9a9a9a', fontSize: '12px', cursor: 'default' }}>Profile</span>
        </div>
      </div>

      {view !== 'watchlist' && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '14px' }}>
          {FEED_TABS.map(({ id, label }) => (
            <button
              key={id}
              data-demo-id={`demo-tab-${id}`}
              onClick={() => onTabChange(id)}
              style={{
                background: 'none',
                border: 'none',
                padding: '0 0 10px 0',
                borderBottom: activeTab === id ? '2px solid #1a1a1a' : '2px solid transparent',
                color: activeTab === id ? '#1a1a1a' : '#9a9a9a',
                fontSize: '14px',
                fontWeight: activeTab === id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
