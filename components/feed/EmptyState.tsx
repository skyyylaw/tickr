interface EmptyStateProps {
  tab: 'active' | 'saved' | 'dismissed'
  onGenerate?: () => void
  generating?: boolean
}

export function EmptyState({ tab, onGenerate, generating }: EmptyStateProps) {
  if (tab === 'saved') {
    return (
      <div style={{ textAlign: 'center' as const, padding: '48px 0', color: '#6b6b6b', fontSize: '14px' }}>
        You haven&apos;t saved any ideas yet.
      </div>
    )
  }

  if (tab === 'dismissed') {
    return (
      <div style={{ textAlign: 'center' as const, padding: '48px 0', color: '#6b6b6b', fontSize: '14px' }}>
        No dismissed ideas.
      </div>
    )
  }

  return (
    <div style={{ textAlign: 'center' as const, padding: '64px 0' }}>
      <div style={{ fontSize: '32px', marginBottom: '16px' }}>📈</div>
      <p style={{ color: '#1a1a1a', fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
        No ideas yet
      </p>
      <p style={{ color: '#6b6b6b', fontSize: '14px', marginBottom: '24px', maxWidth: '320px', margin: '0 auto 24px' }}>
        Run the agent to analyze the market against your investment thesis and generate personalized trade ideas.
      </p>
      {onGenerate && (
        <button
          onClick={onGenerate}
          disabled={generating}
          style={{
            padding: '10px 24px',
            background: generating ? '#9a9a9a' : '#1a1a1a',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            cursor: generating ? 'not-allowed' : 'pointer',
          }}
        >
          {generating ? 'Generating...' : 'Generate Ideas'}
        </button>
      )}
    </div>
  )
}
