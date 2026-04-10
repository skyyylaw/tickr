'use client'

import Link from 'next/link'
import { SignOutButton } from '@/components/SignOutButton'

type Tab = 'for-you' | 'digest' | 'saved' | 'dismissed'

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: 'for-you', label: 'For You' },
  { id: 'digest', label: 'Digest' },
  { id: 'saved', label: 'Saved' },
  { id: 'dismissed', label: 'Dismissed' },
]

interface TopNavProps {
  activeTab: Tab
  onTabChange: (tab: Tab) => void
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  return (
    <div
      style={{
        position: 'sticky' as const,
        top: 0,
        zIndex: 40,
        background: '#FFFFFF',
        borderBottom: '1px solid #E8E8E8',
        padding: '0 16px',
      }}
    >
      {/* Top row: left-aligned logo on mobile, centered on md+ */}
      <div
        className="justify-start md:justify-center"
        style={{
          position: 'relative' as const,
          display: 'flex',
          alignItems: 'center',
          padding: '16px 0 0 0',
        }}
      >
        <Link
          href="/feed"
          style={{ textDecoration: 'none' }}
          onClick={() => onTabChange('for-you')}
        >
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
        </Link>
        <div
          style={{
            position: 'absolute' as const,
            right: 0,
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          <Link
            href="/watchlist"
            style={{ color: '#9a9a9a', fontSize: '12px', textDecoration: 'none' }}
          >
            Watchlist
          </Link>
          <Link
            href="/profile"
            style={{ color: '#9a9a9a', fontSize: '12px', textDecoration: 'none' }}
          >
            Profile
          </Link>
          <SignOutButton />
        </div>
      </div>

      {/* Tabs row — centered */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '14px' }}>
        {TAB_LABELS.map(({ id, label }) => (
          <button
            key={id}
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
    </div>
  )
}
