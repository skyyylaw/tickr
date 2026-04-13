'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { DemoStep } from '@/lib/demo/types'

interface DemoControllerProps {
  step: DemoStep
  stepIndex: number
  totalSteps: number
  onNext: () => void
  onSkip: () => void
}

function useSpotlightRect(targetId: string | undefined): DOMRect | null {
  const [rect, setRect] = useState<DOMRect | null>(null)

  const update = useCallback(() => {
    if (!targetId) { setRect(null); return }
    const el = document.querySelector(`[data-demo-id="${targetId}"]`)
    if (el) {
      setRect(el.getBoundingClientRect())
    } else {
      setRect(null)
    }
  }, [targetId])

  useEffect(() => {
    update()
    // Small delay to allow DOM to settle after view changes
    const timer = setTimeout(update, 100)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)

    // Observe size changes on the target element (e.g. card expanding)
    let resizeObserver: ResizeObserver | null = null
    if (targetId) {
      const el = document.querySelector(`[data-demo-id="${targetId}"]`)
      if (el) {
        resizeObserver = new ResizeObserver(() => update())
        resizeObserver.observe(el)
      }
    }

    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
      resizeObserver?.disconnect()
    }
  }, [update, targetId])

  return rect
}

function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    function check() { setMobile(window.innerWidth < 640) }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return mobile
}

export function DemoController({ step, stepIndex, totalSteps, onNext, onSkip }: DemoControllerProps) {
  const rect = useSpotlightRect(step.overlay === 'modal' ? undefined : step.spotlightTarget)
  const isMobile = useIsMobile()
  const cardRef = useRef<HTMLDivElement>(null)
  const [animKey, setAnimKey] = useState(0)

  // Trigger re-animation on step change
  useEffect(() => {
    setAnimKey((k) => k + 1)
  }, [stepIndex])

  // Scroll target into view when step changes
  useEffect(() => {
    if (step.spotlightTarget && step.overlay !== 'modal') {
      const timer = setTimeout(() => {
        const el = document.querySelector(`[data-demo-id="${step.spotlightTarget}"]`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [step.spotlightTarget, step.overlay])

  // Modal steps (thesis, CTA) are handled by their own components
  if (step.overlay === 'modal') return null

  const PAD = 8
  const hasSpotlight = rect !== null

  // Build clip-path to create a cutout
  let clipPath = 'none'
  if (hasSpotlight) {
    const top = Math.max(0, rect.top - PAD)
    const left = Math.max(0, rect.left - PAD)
    const bottom = rect.bottom + PAD
    const right = rect.right + PAD
    // Polygon that covers the entire viewport EXCEPT the cutout rectangle
    clipPath = `polygon(
      0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
      ${left}px ${top}px, ${left}px ${bottom}px, ${right}px ${bottom}px, ${right}px ${top}px, ${left}px ${top}px
    )`
  }

  // Instruction card position
  let cardStyle: React.CSSProperties = {}
  if (isMobile) {
    cardStyle = {
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      right: '16px',
      maxWidth: 'none',
    }
  } else if (hasSpotlight && step.instructionPosition) {
    const OFFSET = 16
    const cardWidth = 320
    switch (step.instructionPosition) {
      case 'below':
        cardStyle = {
          position: 'fixed',
          top: `${rect.bottom + PAD + OFFSET}px`,
          left: `${Math.max(16, rect.left + rect.width / 2 - cardWidth / 2)}px`,
        }
        break
      case 'above':
        cardStyle = {
          position: 'fixed',
          bottom: `${window.innerHeight - rect.top + PAD + OFFSET}px`,
          left: `${Math.max(16, rect.left + rect.width / 2 - cardWidth / 2)}px`,
        }
        break
      case 'left':
        cardStyle = {
          position: 'fixed',
          top: `${rect.top + rect.height / 2 - 60}px`,
          right: `${window.innerWidth - rect.left + PAD + OFFSET}px`,
        }
        break
      case 'right':
        cardStyle = {
          position: 'fixed',
          top: `${rect.top + rect.height / 2 - 60}px`,
          left: `${rect.right + PAD + OFFSET}px`,
        }
        break
    }
  } else {
    // No spotlight or no position specified — center bottom
    cardStyle = {
      position: 'fixed',
      bottom: '40px',
      left: '50%',
      transform: 'translateX(-50%)',
    }
  }

  return (
    <>
      {/* Backdrop with cutout */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: hasSpotlight ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.25)',
          clipPath: hasSpotlight ? clipPath : undefined,
          transition: 'clip-path 300ms ease, background 300ms ease',
          pointerEvents: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Instruction card */}
      <div
        key={animKey}
        ref={cardRef}
        style={{
          ...cardStyle,
          zIndex: 1002,
          background: '#FFFFFF',
          border: '1px solid #E8E8E8',
          borderRadius: '12px',
          padding: '20px 24px',
          maxWidth: isMobile ? 'none' : '320px',
          width: isMobile ? 'auto' : '320px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          animation: 'demoSlideIn 200ms ease-out',
        }}
      >
        {/* Skip link */}
        <button
          onClick={onSkip}
          style={{
            position: 'absolute',
            top: '12px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: '#9a9a9a',
            fontSize: '11px',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Skip demo
        </button>

        {/* Step counter */}
        <p style={{ color: '#9a9a9a', fontSize: '11px', fontWeight: 600, letterSpacing: '0.04em', marginBottom: '6px' }}>
          {stepIndex + 1} OF {totalSteps}
        </p>

        {/* Title */}
        <h3
          style={{
            fontFamily: "'Noto Serif', Georgia, serif",
            fontSize: '16px',
            fontWeight: 700,
            color: '#1a1a1a',
            margin: '0 0 8px 0',
          }}
        >
          {step.title}
        </h3>

        {/* Body */}
        <p style={{ color: '#6b6b6b', fontSize: '13px', lineHeight: '1.6', margin: '0 0 16px 0' }}>
          {step.body}
        </p>

        {/* Action area */}
        {step.type === 'info' ? (
          <button
            onClick={onNext}
            style={{
              width: '100%',
              padding: '10px',
              background: '#1a1a1a',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Next
          </button>
        ) : (
          <p
            style={{
              color: '#9a9a9a',
              fontSize: '12px',
              fontStyle: 'italic',
              margin: 0,
              textAlign: 'center',
              animation: 'demoPulse 2s ease-in-out infinite',
            }}
          >
            Tap the highlighted element to continue
          </p>
        )}

        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginTop: '14px' }}>
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              style={{
                width: i === stepIndex ? '16px' : '6px',
                height: '6px',
                borderRadius: '3px',
                background: i === stepIndex ? '#1a1a1a' : i < stepIndex ? '#9a9a9a' : '#E8E8E8',
                transition: 'all 200ms ease',
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
