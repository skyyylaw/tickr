'use client'

import { useReducer, useEffect, useRef, useCallback } from 'react'
import { FeedCard } from '@/components/feed/FeedCard'
import { FeedSkeleton } from '@/components/feed/FeedSkeleton'
import { DemoNav } from './DemoNav'
import { DemoController } from './DemoController'
import { DemoDigestView } from './DemoDigestView'
import { DemoWatchlistView } from './DemoWatchlistView'
import { DemoThesisModal } from './DemoThesisModal'
import { DemoCtaCard } from './DemoCtaCard'
import { DEMO_IDEAS, DEMO_EXTRA_IDEAS } from '@/lib/demo/data'
import { DEMO_STEPS } from '@/lib/demo/steps'
import type { TradeIdeaRow } from '@/types/Feed'
import type { DemoView, DemoTab } from '@/lib/demo/types'

interface DemoState {
  stepIndex: number
  view: DemoView
  tab: DemoTab
  ideas: TradeIdeaRow[]
  expandedId: string | null
  feedbackMap: Record<string, 'thumbs_up' | 'thumbs_down'>
  fadingIds: Set<string>
  generating: boolean
}

type DemoAction =
  | { type: 'NEXT_STEP' }
  | { type: 'EXPAND_CARD'; id: string }
  | { type: 'COLLAPSE_CARD' }
  | { type: 'SAVE_IDEA'; id: string }
  | { type: 'THUMBS_UP'; id: string }
  | { type: 'THUMBS_DOWN'; id: string }
  | { type: 'FADE_COMPLETE'; id: string }
  | { type: 'CHANGE_TAB'; tab: DemoTab }
  | { type: 'GENERATE' }
  | { type: 'GENERATE_COMPLETE' }
  | { type: 'SKIP' }
  | { type: 'RESTART' }

function getInitialState(): DemoState {
  return {
    stepIndex: 0,
    view: 'feed',
    tab: 'for-you',
    ideas: [...DEMO_IDEAS],
    expandedId: null,
    feedbackMap: {},
    fadingIds: new Set(),
    generating: false,
  }
}

function shouldAdvance(state: DemoState, actionType: string, ideaId?: string): boolean {
  const step = DEMO_STEPS[state.stepIndex]
  if (!step || !step.awaitAction) return false
  const actionMap: Record<string, string> = {
    EXPAND_CARD: 'expand',
    SAVE_IDEA: 'save',
    THUMBS_UP: 'thumbsUp',
    THUMBS_DOWN: 'thumbsDown',
    CHANGE_TAB: 'tabSaved',
    GENERATE: 'generate',
  }
  if (actionMap[actionType] !== step.awaitAction) return false
  if (step.targetIdeaId && ideaId && step.targetIdeaId !== ideaId) return false
  return true
}

function advanceStep(state: DemoState): Partial<DemoState> {
  const nextIndex = Math.min(state.stepIndex + 1, DEMO_STEPS.length - 1)
  const nextStep = DEMO_STEPS[nextIndex]
  const updates: Partial<DemoState> = { stepIndex: nextIndex }
  if (nextStep.view !== state.view) {
    updates.view = nextStep.view
  }
  // Auto-set tab for feed views
  if (nextStep.view === 'feed' && nextStep.id === 'generate') {
    updates.tab = 'for-you'
  }
  if (nextStep.view === 'digest') {
    updates.tab = 'digest'
  }
  return updates
}

function reducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'NEXT_STEP': {
      return { ...state, ...advanceStep(state) }
    }

    case 'EXPAND_CARD': {
      const advance = shouldAdvance(state, 'EXPAND_CARD', action.id)
      return {
        ...state,
        expandedId: action.id,
        ...(advance ? advanceStep(state) : {}),
      }
    }

    case 'COLLAPSE_CARD': {
      return { ...state, expandedId: null }
    }

    case 'SAVE_IDEA': {
      const idea = state.ideas.find((i) => i.id === action.id)
      const newStatus = idea?.status === 'saved' ? 'active' as const : 'saved' as const
      const advance = shouldAdvance(state, 'SAVE_IDEA', action.id)
      return {
        ...state,
        ideas: state.ideas.map((i) => i.id === action.id ? { ...i, status: newStatus } : i),
        ...(advance ? advanceStep(state) : {}),
      }
    }

    case 'THUMBS_UP': {
      const advance = shouldAdvance(state, 'THUMBS_UP', action.id)
      const current = state.feedbackMap[action.id]
      const newMap = { ...state.feedbackMap }
      if (current === 'thumbs_up') {
        delete newMap[action.id]
      } else {
        newMap[action.id] = 'thumbs_up'
      }
      return {
        ...state,
        feedbackMap: newMap,
        ...(advance ? advanceStep(state) : {}),
      }
    }

    case 'THUMBS_DOWN': {
      const advance = shouldAdvance(state, 'THUMBS_DOWN', action.id)
      const newFading = new Set(state.fadingIds)
      newFading.add(action.id)
      return {
        ...state,
        feedbackMap: { ...state.feedbackMap, [action.id]: 'thumbs_down' },
        fadingIds: newFading,
        expandedId: state.expandedId === action.id ? null : state.expandedId,
        ...(advance ? advanceStep(state) : {}),
      }
    }

    case 'FADE_COMPLETE': {
      const newFading = new Set(state.fadingIds)
      newFading.delete(action.id)
      return {
        ...state,
        fadingIds: newFading,
        ideas: state.ideas.map((i) => i.id === action.id ? { ...i, status: 'dismissed' as const } : i),
      }
    }

    case 'CHANGE_TAB': {
      const advance = action.tab === 'saved' && shouldAdvance(state, 'CHANGE_TAB')
      const tabToView: Record<string, DemoView> = { digest: 'digest' }
      const newView = tabToView[action.tab] || 'feed'
      return {
        ...state,
        tab: action.tab,
        view: newView,
        expandedId: null,
        ...(advance ? advanceStep(state) : {}),
      }
    }

    case 'GENERATE': {
      const advance = shouldAdvance(state, 'GENERATE')
      return {
        ...state,
        generating: true,
        ...(advance ? {} : {}), // Don't advance yet — advance on GENERATE_COMPLETE
      }
    }

    case 'GENERATE_COMPLETE': {
      const newIdeas = [
        ...DEMO_EXTRA_IDEAS.map((i) => ({ ...i, created_at: new Date().toISOString() })),
        ...state.ideas,
      ]
      // Advance if we were on the generate step
      const step = DEMO_STEPS[state.stepIndex]
      const advance = step?.awaitAction === 'generate'
      return {
        ...state,
        generating: false,
        ideas: newIdeas,
        ...(advance ? advanceStep(state) : {}),
      }
    }

    case 'SKIP': {
      const ctaIndex = DEMO_STEPS.findIndex((s) => s.id === 'cta')
      return {
        ...state,
        stepIndex: ctaIndex >= 0 ? ctaIndex : DEMO_STEPS.length - 1,
        view: 'cta',
        expandedId: null,
      }
    }

    case 'RESTART': {
      return getInitialState()
    }

    default:
      return state
  }
}

export function DemoClient() {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState)
  const generateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const currentStep = DEMO_STEPS[state.stepIndex]

  // Handle fade completion
  useEffect(() => {
    if (state.fadingIds.size === 0) return
    const timers: ReturnType<typeof setTimeout>[] = []
    Array.from(state.fadingIds).forEach((id) => {
      timers.push(setTimeout(() => dispatch({ type: 'FADE_COMPLETE', id }), 300))
    })
    return () => timers.forEach(clearTimeout)
  }, [state.fadingIds])

  // Handle generate timer
  const handleGenerate = useCallback(() => {
    dispatch({ type: 'GENERATE' })
    if (generateTimerRef.current) clearTimeout(generateTimerRef.current)
    generateTimerRef.current = setTimeout(() => {
      dispatch({ type: 'GENERATE_COMPLETE' })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 2000)
  }, [])

  useEffect(() => {
    return () => {
      if (generateTimerRef.current) clearTimeout(generateTimerRef.current)
    }
  }, [])

  // Filter ideas based on current tab
  const filteredIdeas = state.ideas.filter((idea) => {
    if (state.tab === 'for-you') return idea.status === 'active' || idea.status === 'saved'
    if (state.tab === 'saved') return idea.status === 'saved'
    if (state.tab === 'dismissed') return idea.status === 'dismissed'
    return false
  })

  function renderFeed() {
    return (
      <>
        {/* Disclaimer + Generate row */}
        {state.tab === 'for-you' && (
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
              data-demo-id="demo-generate-btn"
              onClick={handleGenerate}
              disabled={state.generating}
              style={{
                padding: '8px 18px',
                background: state.generating ? '#9a9a9a' : '#1a1a1a',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 500,
                cursor: state.generating ? 'not-allowed' : 'pointer',
                position: 'relative',
                zIndex: currentStep?.spotlightTarget === 'demo-generate-btn' ? 1001 : undefined,
              }}
            >
              {state.generating ? 'Generating...' : 'Generate Ideas'}
            </button>
          </div>
        )}

        {/* Feed cards */}
        {state.generating && filteredIdeas.length === 0 ? (
          <FeedSkeleton />
        ) : filteredIdeas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0' }}>
            <p style={{ color: '#6b6b6b', fontSize: '14px' }}>
              {state.tab === 'saved' ? 'No saved ideas yet.' : state.tab === 'dismissed' ? 'No dismissed ideas.' : 'No ideas yet.'}
            </p>
          </div>
        ) : (
          <div data-demo-id="demo-feed-area">
            {filteredIdeas.map((idea, index) => {
              const cardTarget = `demo-card-${index}`
              const isSpotlighted = currentStep?.spotlightTarget === cardTarget
              return (
                <div
                  key={idea.id}
                  data-demo-id={cardTarget}
                  style={{
                    position: 'relative',
                    zIndex: isSpotlighted ? 1001 : undefined,
                    transition: 'opacity 300ms ease',
                    opacity: state.fadingIds.has(idea.id) ? 0 : 1,
                    marginBottom: '2px',
                  }}
                >
                  <FeedCard
                    idea={idea}
                    isExpanded={state.expandedId === idea.id}
                    isThumbsUp={state.feedbackMap[idea.id] === 'thumbs_up'}
                    isThumbsDown={state.feedbackMap[idea.id] === 'thumbs_down'}
                    onExpand={() => dispatch({ type: 'EXPAND_CARD', id: idea.id })}
                    onCollapse={() => dispatch({ type: 'COLLAPSE_CARD' })}
                    onSave={() => dispatch({ type: 'SAVE_IDEA', id: idea.id })}
                    onDismiss={() => {/* no-op in demo */}}
                    onThumbsUp={() => dispatch({ type: 'THUMBS_UP', id: idea.id })}
                    onThumbsDown={() => dispatch({ type: 'THUMBS_DOWN', id: idea.id })}
                  />
                </div>
              )
            })}
          </div>
        )}

        {state.generating && filteredIdeas.length > 0 && <FeedSkeleton />}
      </>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA' }}>
      {/* CSS animations */}
      <style>{`
        @keyframes demoFadeIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes demoSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes demoPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Demo Nav */}
      {state.view !== 'cta' && (
        <DemoNav
          activeTab={state.tab}
          onTabChange={(tab) => dispatch({ type: 'CHANGE_TAB', tab })}
          view={state.view}
        />
      )}

      {/* Main content */}
      <div style={{ maxWidth: '620px', margin: '0 auto', padding: '24px 20px' }}>
        {state.view === 'feed' && renderFeed()}
        {state.view === 'digest' && <DemoDigestView />}
        {state.view === 'watchlist' && <DemoWatchlistView />}
      </div>

      {/* Thesis modal (step 1) */}
      {currentStep?.overlay === 'modal' && currentStep.id === 'thesis' && (
        <DemoThesisModal onNext={() => dispatch({ type: 'NEXT_STEP' })} />
      )}

      {/* CTA modal (step 11) */}
      {currentStep?.overlay === 'modal' && currentStep.id === 'cta' && (
        <DemoCtaCard onRestart={() => dispatch({ type: 'RESTART' })} />
      )}

      {/* Controller overlay (non-modal steps) */}
      {currentStep && currentStep.overlay !== 'modal' && (
        <DemoController
          step={currentStep}
          stepIndex={state.stepIndex}
          totalSteps={DEMO_STEPS.length}
          onNext={() => dispatch({ type: 'NEXT_STEP' })}
          onSkip={() => dispatch({ type: 'SKIP' })}
        />
      )}
    </div>
  )
}
