import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ProfileClient } from '@/components/profile/ProfileClient'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, ideasResult, actionsResult, historyResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
    supabase
      .from('trade_ideas')
      .select('id, ticker, status, card_type', { count: 'exact' })
      .eq('user_id', user.id),
    supabase
      .from('user_actions')
      .select('action_type', { count: 'exact' })
      .eq('user_id', user.id),
    supabase
      .from('thesis_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const profile = profileResult.data
  const ideas = ideasResult.data ?? []
  const actions = actionsResult.data ?? []
  const totalIdeas = ideasResult.count ?? 0
  const totalActions = actionsResult.count ?? 0

  const saves = actions.filter((a) => a.action_type === 'save').length
  const dismisses = actions.filter((a) => a.action_type === 'dismiss').length

  const tickerCounts: Record<string, number> = {}
  for (const idea of ideas) {
    if (idea.ticker) {
      tickerCounts[idea.ticker] = (tickerCounts[idea.ticker] || 0) + 1
    }
  }
  const topTickers = Object.entries(tickerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ticker, count]) => ({ ticker, count }))

  return (
    <ProfileClient
      profile={profile}
      email={user.email ?? ''}
      stats={{ totalIdeas, saves, dismisses, totalActions, topTickers }}
      history={historyResult.data ?? []}
    />
  )
}
