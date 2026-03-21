import { TradeIdeaCard } from './TradeIdeaCard'
import { EarningsDigestCard } from './EarningsDigestCard'
import type { TradeIdeaRow } from '@/types/Feed'

interface FeedCardProps {
  idea: TradeIdeaRow
  isExpanded: boolean
  onExpand: () => void
  onCollapse: () => void
  onSave: () => void
  onDismiss: () => void
  onThumbsUp: () => void
  onThumbsDown: (reason: string) => void
}

export function FeedCard(props: FeedCardProps) {
  if (props.idea.card_type === 'trade_idea') {
    return <TradeIdeaCard {...props} />
  }
  return <EarningsDigestCard {...props} />
}
