const colorMap = {
  buy: '#1B8C5A',
  sell: '#C4342D',
  hold: '#8B7300',
  earnings: '#6B5B95',
} as const

type Direction = keyof typeof colorMap

interface DirectionBadgeProps {
  direction: Direction
}

export function DirectionBadge({ direction }: DirectionBadgeProps) {
  const color = colorMap[direction]
  const label = direction === 'earnings' ? 'EARNINGS' : direction.toUpperCase()

  return (
    <span
      style={{
        color,
        fontSize: '10px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        padding: '4px 8px',
        background: `${color}08`,
        border: `1px solid ${color}20`,
        borderRadius: '6px',
        flexShrink: 0,
        marginTop: '2px',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  )
}
