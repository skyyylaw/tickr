'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { TopNav } from './TopNav'
import { FeedCard } from './FeedCard'
import { FeedSkeleton } from './FeedSkeleton'
import { EmptyState } from './EmptyState'
import { DigestView } from '@/components/digest/DigestView'
import type { TradeIdeaRow, DigestRow } from '@/types/Feed'

type Tab = 'for-you' | 'digest' | 'saved' | 'dismissed'

interface FeedClientProps {
  initialIdeas: TradeIdeaRow[]
  initialDigest: DigestRow | null
}

export function FeedClient({ initialIdeas, initialDigest }: FeedClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('for-you')
  const [ideas, setIdeas] = useState<TradeIdeaRow[]>(initialIdeas)
  const [tabIdeas, setTabIdeas] = useState<Partial<Record<Tab, TradeIdeaRow[]>>>({})
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loadingTab, setLoadingTab] = useState(false)

  // Viewport time tracking
  const entryTimes = useRef<Map<string, number>>(new Map())
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Auto-refresh tracking
  const lastHiddenTime = useRef<number | null>(null)

  // ── Viewport observer ──────────────────────────────────────────────
  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = (entry.target as HTMLElement).dataset.ideaId
        if (!id) continue
        if (entry.isIntersecting) {
          entryTimes.current.set(id, Date.now())
        } else {
          const startTime = entryTimes.current.get(id)
          if (startTime) {
            const timeSpent = Date.now() - startTime
            entryTimes.current.delete(id)
            if (timeSpent > 1000) {
              fetch('/api/actions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action_type: 'view',
                  trade_idea_id: id,
                  time_spent_ms: timeSpent,
                }),
              }).catch(() => {})
            }
          }
        }
      }
    }, { threshold: 0.5 })

    return () => observerRef.current?.disconnect()
  }, [])

  // ── Auto-refresh ───────────────────────────────────────────────────
  const refreshActive = useCallback(async () => {
    try {
      const res = await fetch('/api/feed?status=active')
      if (res.ok) {
        const data = await res.json()
        setIdeas(data.ideas ?? [])
      }
    } catch {}
  }, [])

  useEffect(() => {
    const interval = setInterval(refreshActive, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refreshActive])

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) {
        lastHiddenTime.current = Date.now()
      } else if (lastHiddenTime.current) {
        const hiddenFor = Date.now() - lastHiddenTime.current
        if (hiddenFor > 5 * 60 * 1000) {
          refreshActive()
        }
        lastHiddenTime.current = null
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [refreshActive])

  // ── Tab switching ──────────────────────────────────────────────────
  async function handleTabChange(tab: Tab) {
    setActiveTab(tab)
    setExpandedId(null)

    if (tab === 'saved' || tab === 'dismissed') {
      if (!tabIdeas[tab]) {
        setLoadingTab(true)
        try {
          const res = await fetch(`/api/feed?status=${tab === 'saved' ? 'saved' : 'dismissed'}`)
          if (res.ok) {
            const data = await res.json()
            setTabIdeas((prev) => ({ ...prev, [tab]: data.ideas ?? [] }))
          }
        } catch {}
        setLoadingTab(false)
      }
    }
  }

  // ── Generate Ideas ─────────────────────────────────────────────────
  async function handleGenerateIdeas() {
    setGenerating(true)
    try {
      const res = await fetch('/api/agent/run', { method: 'POST' })
      if (res.ok) {
        await refreshActive()
      }
    } catch {}
    setGenerating(false)
  }

  // ── Card actions ───────────────────────────────────────────────────
  function logAction(ideaId: string, actionType: string, extra?: object) {
    fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_type: actionType, trade_idea_id: ideaId, ...extra }),
    }).catch(() => {})
  }

  function updateIdeaStatus(id: string, status: 'saved' | 'dismissed' | 'active') {
    fetch(`/api/ideas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
  }

  function handleSave(id: string) {
    const idea = ideas.find((i) => i.id === id)
    const isSaved = idea?.status === 'saved'
    const newStatus = isSaved ? 'active' : 'saved'
    updateIdeaStatus(id, newStatus)
    logAction(id, 'save')
    setIdeas((prev) => prev.map((i) => i.id === id ? { ...i, status: newStatus } : i))
  }

  function handleDismiss(id: string) {
    updateIdeaStatus(id, 'dismissed')
    logAction(id, 'dismiss')
    setIdeas((prev) => prev.filter((i) => i.id !== id))
    if (expandedId === id) setExpandedId(null)
  }

  function handleThumbsUp(id: string) {
    logAction(id, 'thumbs_up')
  }

  function handleThumbsDown(id: string, reason: string) {
    logAction(id, 'thumbs_down', { feedback_reason: reason })
  }

  function handleExpand(id: string) {
    setExpandedId(id)
    logAction(id, 'expand')
  }

  function handleCollapse() {
    setExpandedId(null)
  }

  // ── Render helpers ─────────────────────────────────────────────────
  function renderFeed(feedIdeas: TradeIdeaRow[], tab: 'for-you' | 'saved' | 'dismissed') {
    if (loadingTab && tab !== 'for-you') return <FeedSkeleton />
    if (feedIdeas.length === 0) {
      return (
        <EmptyState
          tab={tab === 'for-you' ? 'active' : tab}
          onGenerate={tab === 'for-you' ? handleGenerateIdeas : undefined}
          generating={generating}
        />
      )
    }
    return feedIdeas.map((idea) => (
      <div
        key={idea.id}
        data-idea-id={idea.id}
        ref={(el) => {
          if (el && observerRef.current) {
            observerRef.current.observe(el)
          }
        }}
      >
        <FeedCard
          idea={idea}
          isExpanded={expandedId === idea.id}
          onExpand={() => handleExpand(idea.id)}
          onCollapse={handleCollapse}
          onSave={() => handleSave(idea.id)}
          onDismiss={() => handleDismiss(idea.id)}
          onThumbsUp={() => handleThumbsUp(idea.id)}
          onThumbsDown={(reason) => handleThumbsDown(idea.id, reason)}
        />
      </div>
    ))
  }

  const currentIdeas =
    activeTab === 'for-you'
      ? ideas
      : tabIdeas[activeTab] ?? []

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      <TopNav activeTab={activeTab} onTabChange={handleTabChange} />

      <div style={{ maxWidth: '620px', margin: '0 auto', padding: '24px 20px' }}>
        {/* Digest tab */}
        {activeTab === 'digest' ? (
          <DigestView initialDigest={initialDigest} />
        ) : (
          <>
            {/* Disclaimer + Generate Ideas row (For You tab only) */}
            {activeTab === 'for-you' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                }}
              >
                <div style={{ color: '#9a9a9a', fontSize: '12px' }}>
                  AI-generated ideas · not financial advice
                </div>
                <button
                  onClick={handleGenerateIdeas}
                  disabled={generating}
                  style={{
                    padding: '8px 18px',
                    background: generating ? '#9a9a9a' : '#1a1a1a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: generating ? 'not-allowed' : 'pointer',
                  }}
                >
                  {generating ? 'Generating...' : 'Generate Ideas'}
                </button>
              </div>
            )}

            {/* Loading state */}
            {generating && ideas.length === 0 ? (
              <FeedSkeleton />
            ) : (
              renderFeed(currentIdeas, activeTab as 'for-you' | 'saved' | 'dismissed')
            )}
          </>
        )}
      </div>
    </div>
  )
}
