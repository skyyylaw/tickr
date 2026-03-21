'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { SignOutButton } from '@/components/SignOutButton'
import { ChipSelect } from '@/components/onboarding/ChipSelect'
import { CardSelect, type CardOption } from '@/components/onboarding/CardSelect'
import { RiskSlider } from '@/components/onboarding/RiskSlider'
import { TickerSearch } from '@/components/onboarding/TickerSearch'

// ── Option data (shared with OnboardingWizard) ─────────────────────────────

const INVESTMENT_GOALS = ['Growth', 'Income', 'Capital Preservation', 'Speculation', 'Learning']
const TIME_HORIZON_OPTIONS: CardOption[] = [
  { value: 'short_term', label: 'Short-term', subtitle: '< 6 months' },
  { value: 'medium_term', label: 'Medium-term', subtitle: '6 months – 2 years' },
  { value: 'long_term', label: 'Long-term', subtitle: '2+ years' },
]
const CAPITAL_RANGE_OPTIONS = ['Under $1K', '$1K–$10K', '$10K–$50K', '$50K–$100K', '$100K+']
const SECTOR_OPTIONS = [
  'Technology', 'Healthcare', 'Energy', 'Finance', 'Consumer',
  'Real Estate', 'Industrials', 'Materials', 'Utilities', 'Communication Services',
]
const INDUSTRY_OPTIONS = [
  'AI/Machine Learning', 'Electric Vehicles', 'Biotech/Pharma', 'Semiconductors',
  'Cloud Computing', 'Renewable Energy', 'Fintech', 'E-commerce', 'Social Media',
  'Space/Aerospace', 'Cannabis', 'Cybersecurity', 'Gaming', 'Real Estate/REITs',
  'Blockchain/Web3',
]
const STRATEGY_OPTIONS = [
  'Value Investing', 'Growth/Momentum', 'Event-Driven', 'Contrarian',
  'Dividend', 'Index/Passive', 'Swing Trading', 'Buy and Hold',
]
const STRATEGY_DESCRIPTIONS: Record<string, string> = {
  'Value Investing': 'Buying undervalued companies',
  'Growth/Momentum': 'Riding high-growth trends',
  'Event-Driven': 'Earnings, M&A, catalysts',
  'Contrarian': 'Fading crowd sentiment',
  'Dividend': 'Income through distributions',
  'Index/Passive': 'Broad market exposure',
  'Swing Trading': 'Short-term price moves',
  'Buy and Hold': 'Long-term compounding',
}
const FREQUENCY_OPTIONS = ['multiple_daily', 'daily', 'few_times_week', 'weekly', 'monthly_or_less']
const FREQUENCY_LABELS: Record<string, string> = {
  multiple_daily: 'Multiple times a day',
  daily: 'Daily',
  few_times_week: 'A few times a week',
  weekly: 'Weekly',
  monthly_or_less: 'Monthly or less',
}
const EXPERIENCE_OPTIONS: CardOption[] = [
  { value: 'beginner', label: 'Beginner', subtitle: 'Just getting started' },
  { value: 'intermediate', label: 'Intermediate', subtitle: 'Understand basics, made some trades' },
  { value: 'advanced', label: 'Advanced', subtitle: 'Regularly trade, understand technical analysis' },
]
const CONSTRAINT_OPTIONS = [
  'No Options', 'No Short Selling', 'ESG Only', 'No Penny Stocks',
  'Only Large Cap', 'Only Dividend Stocks',
]

// ── Human-readable label helpers ────────────────────────────────────────────

const HORIZON_LABEL: Record<string, string> = {
  short_term: 'Short-term (< 6 months)',
  medium_term: 'Medium-term (6 months – 2 years)',
  long_term: 'Long-term (2+ years)',
}
const EXPERIENCE_LABEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}
const RISK_LABEL: Record<number, string> = {
  1: 'Very Conservative', 2: 'Very Conservative',
  3: 'Conservative', 4: 'Conservative',
  5: 'Moderate', 6: 'Moderate',
  7: 'Growth-oriented', 8: 'Growth-oriented',
  9: 'Aggressive', 10: 'Aggressive',
}

// ── Types ───────────────────────────────────────────────────────────────────

interface ProfileData {
  id: string
  investment_goals: string[]
  time_horizon: string | null
  risk_tolerance: number | null
  capital_range: string | null
  sectors: string[]
  industries: string[]
  strategy_preferences: string[]
  check_frequency: string | null
  experience_level: string | null
  interested_tickers: string[]
  constraints: string[]
  created_at: string
  updated_at: string
}

interface Stats {
  totalIdeas: number
  saves: number
  dismisses: number
  totalActions: number
  topTickers: { ticker: string; count: number }[]
}

interface HistoryEntry {
  id: string
  changed_fields: string[]
  snapshot: Record<string, { from: unknown; to: unknown }>
  created_at: string
}

interface ProfileClientProps {
  profile: ProfileData | null
  email: string
  stats: Stats
  history: HistoryEntry[]
}

type EditableField =
  | 'investment_goals' | 'time_horizon' | 'risk_tolerance' | 'capital_range'
  | 'sectors' | 'industries' | 'strategy_preferences' | 'check_frequency'
  | 'experience_level' | 'interested_tickers' | 'constraints'

const FIELD_LABELS: Record<EditableField, string> = {
  investment_goals: 'Investment Goals',
  time_horizon: 'Time Horizon',
  risk_tolerance: 'Risk Tolerance',
  capital_range: 'Capital Range',
  sectors: 'Sectors',
  industries: 'Industries',
  strategy_preferences: 'Strategy',
  check_frequency: 'Check Frequency',
  experience_level: 'Experience Level',
  interested_tickers: 'Tickers',
  constraints: 'Constraints',
}

// ── Component ───────────────────────────────────────────────────────────────

export function ProfileClient({ profile, email, stats, history }: ProfileClientProps) {
  const router = useRouter()
  const [editingField, setEditingField] = useState<EditableField | null>(null)
  const [editValue, setEditValue] = useState<unknown>(null)
  const [saving, setSaving] = useState(false)
  const [resetConfirm, setResetConfirm] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' })
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)

  const p = profile

  // ── Inline edit handlers ────────────────────────────────────────────────

  const startEdit = useCallback((field: EditableField) => {
    if (!p) return
    setEditingField(field)
    setEditValue(p[field])
  }, [p])

  const cancelEdit = useCallback(() => {
    setEditingField(null)
    setEditValue(null)
  }, [])

  const saveEdit = useCallback(async () => {
    if (!editingField || editValue === null) return
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [editingField]: editValue }),
      })
      if (res.ok) {
        setEditingField(null)
        setEditValue(null)
        router.refresh()
      }
    } catch { /* silent */ } finally {
      setSaving(false)
    }
  }, [editingField, editValue, router])

  // ── Account actions ─────────────────────────────────────────────────────

  const handleChangePassword = useCallback(async () => {
    setPasswordMsg(null)
    if (passwordForm.password.length < 8) {
      setPasswordMsg({ type: 'err', text: 'Password must be at least 8 characters' })
      return
    }
    if (passwordForm.password !== passwordForm.confirm) {
      setPasswordMsg({ type: 'err', text: 'Passwords do not match' })
      return
    }
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordForm.password }),
      })
      if (res.ok) {
        setPasswordMsg({ type: 'ok', text: 'Password updated' })
        setPasswordForm({ password: '', confirm: '' })
      } else {
        const data = await res.json()
        setPasswordMsg({ type: 'err', text: data.error || 'Failed' })
      }
    } catch {
      setPasswordMsg({ type: 'err', text: 'Network error' })
    }
  }, [passwordForm])

  const handleExport = useCallback(async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/profile/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `tickr-export-${new Date().toISOString().split('T')[0]}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch { /* silent */ } finally {
      setExporting(false)
    }
  }, [])

  const handleDeleteAccount = useCallback(async () => {
    setDeleting(true)
    try {
      const res = await fetch('/api/profile/delete-account', { method: 'POST' })
      if (res.ok) {
        window.location.href = '/login'
      }
    } catch { /* silent */ } finally {
      setDeleting(false)
    }
  }, [])

  // ── Render helpers ──────────────────────────────────────────────────────

  function renderChips(items: string[]) {
    if (!items || items.length === 0) return <span className="text-tickr-muted text-[13px]">Not set</span>
    return (
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="px-3 py-1 bg-tickr-bg border border-tickr-border rounded-full text-xs font-medium text-tickr-text"
          >
            {item}
          </span>
        ))}
      </div>
    )
  }

  function renderFieldValue(field: EditableField) {
    if (!p) return null
    const val = p[field]
    switch (field) {
      case 'investment_goals':
      case 'sectors':
      case 'industries':
      case 'strategy_preferences':
      case 'constraints':
        return renderChips(val as string[])
      case 'interested_tickers':
        return (val as string[]).length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {(val as string[]).map((t) => (
              <span key={t} className="px-3 py-1 bg-tickr-bg border border-tickr-border rounded-full text-xs font-semibold font-mono text-tickr-text">
                {t}
              </span>
            ))}
          </div>
        ) : <span className="text-tickr-muted text-[13px]">None</span>
      case 'time_horizon':
        return <span className="text-[13px] text-tickr-text">{HORIZON_LABEL[val as string] || val || 'Not set'}</span>
      case 'experience_level':
        return <span className="text-[13px] text-tickr-text">{EXPERIENCE_LABEL[val as string] || val || 'Not set'}</span>
      case 'risk_tolerance':
        return (
          <span className="text-[13px] text-tickr-text">
            {val !== null ? `${val}/10 — ${RISK_LABEL[val as number] || ''}` : 'Not set'}
          </span>
        )
      case 'capital_range':
        return <span className="text-[13px] text-tickr-text">{(val as string) || 'Not set'}</span>
      case 'check_frequency':
        return <span className="text-[13px] text-tickr-text">{FREQUENCY_LABELS[val as string] || val || 'Not set'}</span>
      default:
        return <span className="text-[13px] text-tickr-text">{String(val) || 'Not set'}</span>
    }
  }

  function renderEditor(field: EditableField) {
    switch (field) {
      case 'investment_goals':
        return <ChipSelect options={INVESTMENT_GOALS} selected={editValue as string[]} onChange={setEditValue} />
      case 'sectors':
        return <ChipSelect options={SECTOR_OPTIONS} selected={editValue as string[]} onChange={setEditValue} />
      case 'industries':
        return <ChipSelect options={INDUSTRY_OPTIONS} selected={editValue as string[]} onChange={setEditValue} />
      case 'strategy_preferences':
        return <ChipSelect options={STRATEGY_OPTIONS} selected={editValue as string[]} onChange={setEditValue} descriptions={STRATEGY_DESCRIPTIONS} />
      case 'constraints':
        return <ChipSelect options={CONSTRAINT_OPTIONS} selected={editValue as string[]} onChange={setEditValue} />
      case 'interested_tickers':
        return <TickerSearch selected={editValue as string[]} onChange={(v) => setEditValue(v)} />
      case 'time_horizon':
        return <CardSelect options={TIME_HORIZON_OPTIONS} selected={editValue as string} onChange={setEditValue} />
      case 'experience_level':
        return <CardSelect options={EXPERIENCE_OPTIONS} selected={editValue as string} onChange={setEditValue} />
      case 'risk_tolerance':
        return <RiskSlider value={editValue as number} onChange={setEditValue} />
      case 'capital_range':
        return <ChipSelect options={CAPITAL_RANGE_OPTIONS} selected={editValue ? [editValue as string] : []} onChange={(v) => setEditValue(v[v.length - 1] ?? '')} singleSelect />
      case 'check_frequency':
        return <ChipSelect options={FREQUENCY_OPTIONS} selected={editValue ? [editValue as string] : []} onChange={(v) => setEditValue(v[v.length - 1] ?? '')} labels={FREQUENCY_LABELS} singleSelect />
      default:
        return null
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatFieldName(field: string): string {
    return FIELD_LABELS[field as EditableField] || field.replace(/_/g, ' ')
  }

  function formatSnapshotValue(val: unknown): string {
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'none'
    if (val === null || val === undefined || val === '') return 'not set'
    return String(val)
  }

  // ── Stat calculations ────────────────────────────────────────────────────

  const acceptDismissTotal = stats.saves + stats.dismisses
  const acceptRate = acceptDismissTotal > 0 ? Math.round((stats.saves / acceptDismissTotal) * 100) : 0

  // ── Render ────────────────────────────────────────────────────────────────

  const thesisFields: EditableField[] = [
    'investment_goals', 'time_horizon', 'risk_tolerance', 'capital_range',
    'sectors', 'industries', 'strategy_preferences', 'check_frequency',
    'experience_level', 'interested_tickers', 'constraints',
  ]

  return (
    <div className="min-h-screen bg-tickr-bg">
      {/* Nav */}
      <div className="sticky top-0 z-40 bg-tickr-surface" style={{ borderBottom: '1px solid #E8E8E8', padding: '0 32px' }}>
        <div className="relative flex items-center justify-center" style={{ padding: '16px 0 14px 0' }}>
          <Link href="/feed" className="no-underline">
            <span className="font-serif italic font-bold text-[22px] text-tickr-text" style={{ letterSpacing: '-0.02em' }}>
              tickr
            </span>
          </Link>
          <div className="absolute right-0 flex gap-4 items-center">
            <Link href="/feed" className="text-tickr-muted text-xs no-underline">Feed</Link>
            <Link href="/watchlist" className="text-tickr-muted text-xs no-underline">Watchlist</Link>
            <span className="text-tickr-text text-xs font-semibold">Profile</span>
            <SignOutButton />
          </div>
        </div>
      </div>

      <div className="max-w-[620px] mx-auto px-5 py-6">

        {/* ── Stats Section ──────────────────────────────────────────── */}
        <div
          className="bg-tickr-surface rounded-[16px] p-7 mb-4"
          style={{ border: '1px solid #E8E8E8', boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)' }}
        >
          <div className="text-tickr-muted text-[11px] font-semibold tracking-wider mb-5">YOUR ACTIVITY</div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-[28px] font-bold text-tickr-text font-serif">{stats.totalIdeas}</div>
              <div className="text-[11px] text-tickr-muted mt-1">Ideas generated</div>
            </div>
            <div className="text-center">
              <div className="text-[28px] font-bold font-serif" style={{ color: '#1B8C5A' }}>{acceptRate}%</div>
              <div className="text-[11px] text-tickr-muted mt-1">Accept rate</div>
            </div>
            <div className="text-center">
              <div className="text-[28px] font-bold text-tickr-text font-serif">{stats.totalActions}</div>
              <div className="text-[11px] text-tickr-muted mt-1">Interactions</div>
            </div>
          </div>

          {stats.saves + stats.dismisses > 0 && (
            <div className="mb-5">
              <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-tickr-bg">
                {stats.saves > 0 && (
                  <div
                    className="rounded-full"
                    style={{ width: `${acceptRate}%`, background: '#1B8C5A' }}
                  />
                )}
                {stats.dismisses > 0 && (
                  <div
                    className="rounded-full"
                    style={{ width: `${100 - acceptRate}%`, background: '#E8E8E8' }}
                  />
                )}
              </div>
              <div className="flex justify-between mt-2 text-[11px]">
                <span style={{ color: '#1B8C5A' }}>{stats.saves} saved</span>
                <span className="text-tickr-muted">{stats.dismisses} dismissed</span>
              </div>
            </div>
          )}

          {stats.topTickers.length > 0 && (
            <div>
              <div className="text-tickr-muted text-[11px] font-semibold tracking-wider mb-2">MOST ACTIVE TICKERS</div>
              <div className="flex flex-wrap gap-2">
                {stats.topTickers.map(({ ticker, count }) => (
                  <span
                    key={ticker}
                    className="px-3 py-1.5 bg-tickr-bg border border-tickr-border rounded-full text-xs font-semibold font-mono text-tickr-text"
                  >
                    {ticker} <span className="text-tickr-muted font-normal ml-1">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {stats.totalActions > 0 && (
            <div className="mt-5 pt-4" style={{ borderTop: '1px solid #F0F0F0' }}>
              <p className="text-[13px] text-tickr-secondary leading-relaxed">
                Your thesis has been refined by <span className="font-semibold text-tickr-text">{stats.totalActions} interactions</span>.
                {' '}Each save, dismiss, and view helps tailor future ideas to your style.
              </p>
            </div>
          )}
        </div>

        {/* ── Thesis Card ────────────────────────────────────────────── */}
        <div
          className="bg-tickr-surface rounded-[16px] p-7 mb-4"
          style={{ border: '1px solid #E8E8E8', boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div className="text-tickr-muted text-[11px] font-semibold tracking-wider">YOUR THESIS</div>
            {p?.updated_at && (
              <span className="text-tickr-muted text-[11px]">Updated {formatDate(p.updated_at)}</span>
            )}
          </div>

          {!p ? (
            <div className="text-center py-10">
              <p className="text-tickr-secondary text-sm mb-4">No thesis set up yet.</p>
              <Link
                href="/onboarding"
                className="inline-block px-6 py-2.5 bg-tickr-text rounded-[10px] text-[13px] font-medium text-white no-underline"
              >
                Set up your thesis
              </Link>
            </div>
          ) : (
            <div className="space-y-0">
              {thesisFields.map((field) => (
                <div key={field} className="py-3.5" style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-tickr-muted text-[11px] font-semibold tracking-wider mb-2">
                        {FIELD_LABELS[field].toUpperCase()}
                      </div>
                      {editingField === field ? (
                        <div>
                          {renderEditor(field)}
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={saveEdit}
                              disabled={saving}
                              className="px-4 py-1.5 bg-tickr-text rounded-lg text-[12px] font-medium text-white cursor-pointer disabled:opacity-50 border-0"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="px-4 py-1.5 bg-transparent rounded-lg text-[12px] text-tickr-secondary cursor-pointer border border-tickr-border"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        renderFieldValue(field)
                      )}
                    </div>
                    {editingField !== field && (
                      <button
                        onClick={() => startEdit(field)}
                        className="text-[11px] text-tickr-muted hover:text-tickr-text cursor-pointer bg-transparent border-0 shrink-0 mt-0.5"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reset thesis */}
          {p && (
            <div className="mt-6">
              {resetConfirm ? (
                <div className="bg-tickr-bg rounded-xl p-4" style={{ border: '1px solid #F0F0F0' }}>
                  <p className="text-[13px] text-tickr-secondary leading-relaxed mb-3">
                    This will replace your current thesis. Your saved ideas and history won&apos;t be affected.
                  </p>
                  <div className="flex gap-2">
                    <Link
                      href="/onboarding"
                      className="px-5 py-2 bg-tickr-text rounded-lg text-[12px] font-medium text-white no-underline"
                    >
                      Reset &amp; start over
                    </Link>
                    <button
                      onClick={() => setResetConfirm(false)}
                      className="px-5 py-2 bg-transparent rounded-lg text-[12px] text-tickr-secondary cursor-pointer border border-tickr-border"
                    >
                      Never mind
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setResetConfirm(true)}
                  className="w-full py-2.5 bg-transparent rounded-[10px] text-[13px] text-tickr-secondary cursor-pointer border border-tickr-border hover:border-tickr-secondary transition-colors"
                >
                  Reset my thesis
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── Thesis Evolution ───────────────────────────────────────── */}
        {history.length > 0 && (
          <div
            className="bg-tickr-surface rounded-[16px] p-7 mb-4"
            style={{ border: '1px solid #E8E8E8', boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)' }}
          >
            <div className="text-tickr-muted text-[11px] font-semibold tracking-wider mb-5">THESIS EVOLUTION</div>

            <div className="space-y-0">
              {history.map((entry, i) => (
                <div key={entry.id} className="relative pl-5 pb-5" style={{ borderLeft: i < history.length - 1 ? '1px solid #E8E8E8' : 'none' }}>
                  {/* timeline dot */}
                  <div className="absolute left-[-4px] top-[2px] w-[9px] h-[9px] rounded-full bg-tickr-border" style={{ border: '2px solid #FAFAFA' }} />

                  <div className="text-tickr-muted text-[11px] mb-1">{formatDate(entry.created_at)}</div>
                  <div className="text-[13px] text-tickr-text leading-relaxed">
                    Changed{' '}
                    <span className="font-semibold">
                      {entry.changed_fields.map(formatFieldName).join(', ')}
                    </span>
                  </div>
                  {Object.entries(entry.snapshot).slice(0, 3).map(([field, change]) => (
                    <div key={field} className="text-[12px] text-tickr-muted mt-1">
                      {formatFieldName(field)}: {formatSnapshotValue(change.from)} → {formatSnapshotValue(change.to)}
                    </div>
                  ))}
                  {Object.keys(entry.snapshot).length > 3 && (
                    <div className="text-[11px] text-tickr-muted mt-1">
                      +{Object.keys(entry.snapshot).length - 3} more fields
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Account Settings ───────────────────────────────────────── */}
        <div
          className="bg-tickr-surface rounded-[16px] p-7 mb-4"
          style={{ border: '1px solid #E8E8E8', boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)' }}
        >
          <div className="text-tickr-muted text-[11px] font-semibold tracking-wider mb-5">ACCOUNT</div>

          {/* Email */}
          <div className="py-3" style={{ borderBottom: '1px solid #F0F0F0' }}>
            <div className="text-tickr-muted text-[11px] font-semibold tracking-wider mb-1">EMAIL</div>
            <div className="text-[13px] text-tickr-text">{email}</div>
          </div>

          {/* Change Password */}
          <div className="py-3" style={{ borderBottom: '1px solid #F0F0F0' }}>
            <div className="text-tickr-muted text-[11px] font-semibold tracking-wider mb-2">CHANGE PASSWORD</div>
            <div className="flex flex-col gap-2 max-w-[300px]">
              <input
                type="password"
                placeholder="New password"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))}
                className="px-3 py-2 bg-tickr-bg border border-tickr-border rounded-lg text-[13px] text-tickr-text placeholder:text-tickr-muted focus:outline-none focus:ring-1 focus:ring-tickr-text"
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                className="px-3 py-2 bg-tickr-bg border border-tickr-border rounded-lg text-[13px] text-tickr-text placeholder:text-tickr-muted focus:outline-none focus:ring-1 focus:ring-tickr-text"
              />
              <button
                onClick={handleChangePassword}
                className="self-start px-4 py-1.5 bg-tickr-text rounded-lg text-[12px] font-medium text-white cursor-pointer border-0"
              >
                Update password
              </button>
              {passwordMsg && (
                <span className={`text-[12px] ${passwordMsg.type === 'ok' ? 'text-[#1B8C5A]' : 'text-[#C4342D]'}`}>
                  {passwordMsg.text}
                </span>
              )}
            </div>
          </div>

          {/* Export Data */}
          <div className="py-3" style={{ borderBottom: '1px solid #F0F0F0' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-tickr-muted text-[11px] font-semibold tracking-wider mb-1">EXPORT MY DATA</div>
                <div className="text-[12px] text-tickr-muted">Download your profile, ideas, and action history as JSON</div>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-4 py-1.5 bg-transparent border border-tickr-border rounded-lg text-[12px] text-tickr-secondary cursor-pointer hover:border-tickr-secondary transition-colors disabled:opacity-50 shrink-0"
              >
                {exporting ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>

          {/* Delete Account */}
          <div className="pt-3">
            {deleteConfirm ? (
              <div className="bg-tickr-bg rounded-xl p-4" style={{ border: '1px solid #F0F0F0' }}>
                <p className="text-[13px] text-tickr-secondary leading-relaxed mb-3">
                  This will permanently delete your account and all your data. This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="px-5 py-2 rounded-lg text-[12px] font-medium text-white cursor-pointer border-0 disabled:opacity-50"
                    style={{ background: '#C4342D' }}
                  >
                    {deleting ? 'Deleting...' : 'Delete permanently'}
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="px-5 py-2 bg-transparent rounded-lg text-[12px] text-tickr-secondary cursor-pointer border border-tickr-border"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="text-[12px] cursor-pointer bg-transparent border-0 p-0"
                style={{ color: '#C4342D' }}
              >
                Delete my account
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
