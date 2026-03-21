import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [profileResult, ideasResult, actionsResult, watchlistResult, positionsResult, digestsResult, historyResult] =
    await Promise.all([
      supabase.from('user_profiles').select('*').eq('id', user.id).single(),
      supabase.from('trade_ideas').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('user_actions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('watchlist_items').select('*').eq('user_id', user.id),
      supabase.from('positions').select('*').eq('user_id', user.id),
      supabase.from('digests').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('thesis_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])

  const exportData = {
    exported_at: new Date().toISOString(),
    profile: profileResult.data,
    trade_ideas: ideasResult.data ?? [],
    user_actions: actionsResult.data ?? [],
    watchlist: watchlistResult.data ?? [],
    positions: positionsResult.data ?? [],
    digests: digestsResult.data ?? [],
    thesis_history: historyResult.data ?? [],
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="tickr-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
