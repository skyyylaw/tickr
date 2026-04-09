'use client'

import { useState, useRef, useEffect } from 'react'

const FEEDBACK_OPTIONS = [
  'Wrong sector',
  'Bad timing',
  'Already holding',
  'Too risky',
  'Not enough upside',
  'Other',
]

interface ActionButtonsProps {
  ideaId: string
  isSaved: boolean
  isThumbsUp?: boolean
  isThumbsDown?: boolean
  showDismiss?: boolean
  onSave: () => void
  onDismiss?: () => void
  onThumbsUp: () => void
  onThumbsDown: (reason: string) => void
}

export function ActionButtons({
  isSaved,
  isThumbsUp = false,
  isThumbsDown = false,
  showDismiss = false,
  onSave,
  onDismiss,
  onThumbsUp,
  onThumbsDown,
}: ActionButtonsProps) {
  const [showFeedback, setShowFeedback] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showFeedback) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowFeedback(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showFeedback])

  const btnStyle = {
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    color: '#9a9a9a',
    fontSize: '14px',
    lineHeight: 1,
    display: 'flex',
    alignItems: 'center',
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' as const }} ref={dropdownRef}>
      {/* Save / Bookmark */}
      <button
        style={{ ...btnStyle, color: isSaved ? '#1a1a1a' : '#9a9a9a' }}
        onClick={(e) => { e.stopPropagation(); onSave() }}
        title={isSaved ? 'Unsave' : 'Save'}
        aria-label="Save"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Thumbs Up */}
      <button
        style={{ ...btnStyle, color: isThumbsUp ? '#1a1a1a' : '#9a9a9a' }}
        onClick={(e) => { e.stopPropagation(); onThumbsUp() }}
        title={isThumbsUp ? 'Remove helpful' : 'Helpful'}
        aria-label="Thumbs up"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={isThumbsUp ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" />
          <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
        </svg>
      </button>

      {/* Thumbs Down */}
      <button
        style={{ ...btnStyle, color: (isThumbsDown || showFeedback) ? '#1a1a1a' : '#9a9a9a' }}
        onClick={(e) => {
          e.stopPropagation()
          if (isThumbsDown) {
            // Undo: call onThumbsDown with empty reason to trigger undo
            onThumbsDown('')
          } else {
            setShowFeedback((v) => !v)
          }
        }}
        title={isThumbsDown ? 'Remove not helpful' : 'Not helpful'}
        aria-label="Thumbs down"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill={isThumbsDown ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z" />
          <path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
        </svg>
      </button>

      {/* Dismiss X */}
      {showDismiss && onDismiss && (
        <button
          style={btnStyle}
          onClick={(e) => { e.stopPropagation(); onDismiss() }}
          title="Dismiss"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Feedback dropdown */}
      {showFeedback && (
        <div
          style={{
            position: 'absolute',
            right: 0,
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
          onClick={(e) => e.stopPropagation()}
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
                onThumbsDown(option)
                setShowFeedback(false)
              }}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
