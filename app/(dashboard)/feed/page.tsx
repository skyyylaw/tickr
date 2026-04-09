import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FeedClient } from '@/components/feed/FeedClient'
import type { TradeIdeaRow, DigestRow } from '@/types/Feed'

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ seeded?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const params = await searchParams
  const watchlistSeeded = params.seeded === '1'

  const [ideasResult, digestResult] = await Promise.allSettled([
    supabase
      .from('trade_ideas')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('digests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
  ])

  const initialIdeas: TradeIdeaRow[] =
    ideasResult.status === 'fulfilled' ? (ideasResult.value.data ?? []) : []

  const initialDigest: DigestRow | null =
    digestResult.status === 'fulfilled' ? (digestResult.value.data ?? null) : null

  // Fetch existing thumbs_up/thumbs_down actions for initial ideas
  const initialFeedbackMap: Record<string, 'thumbs_up' | 'thumbs_down'> = {}
  if (initialIdeas.length > 0) {
    const ideaIds = initialIdeas.map((i) => i.id)
    const { data: actions } = await supabase
      .from('user_actions')
      .select('trade_idea_id, action_type')
      .eq('user_id', user.id)
      .in('trade_idea_id', ideaIds)
      .in('action_type', ['thumbs_up', 'thumbs_down'])

    for (const action of actions ?? []) {
      initialFeedbackMap[action.trade_idea_id] = action.action_type as 'thumbs_up' | 'thumbs_down'
    }
  }

  return (
    <FeedClient
      initialIdeas={initialIdeas}
      initialDigest={initialDigest}
      initialFeedbackMap={initialFeedbackMap}
      watchlistSeeded={watchlistSeeded}
    />
  )
}
