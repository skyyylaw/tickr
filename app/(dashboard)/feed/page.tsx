import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FeedClient } from '@/components/feed/FeedClient'
import type { TradeIdeaRow, DigestRow } from '@/types/Feed'

export default async function FeedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

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

  return <FeedClient initialIdeas={initialIdeas} initialDigest={initialDigest} />
}
