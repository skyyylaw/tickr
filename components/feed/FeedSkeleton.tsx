export function FeedSkeleton() {
  return (
    <div>
      <p style={{ color: '#9a9a9a', fontSize: '13px', marginBottom: '20px', textAlign: 'center' as const }}>
        Analyzing markets against your thesis...
      </p>
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse"
          style={{
            background: '#F0F0F0',
            borderRadius: '14px',
            height: '120px',
            marginBottom: '12px',
          }}
        />
      ))}
    </div>
  )
}
