import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const querySchema = z.object({
  status: z.enum(['active', 'saved', 'dismissed']).optional().default('active'),
})

export async function GET(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({ status: searchParams.get('status') ?? undefined })
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { status } = parsed.data

  try {
    const { data, error } = await supabase
      .from('trade_ideas')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    const ideas = data ?? []

    // Fetch thumbs_up/thumbs_down actions for these ideas
    const ideaIds = ideas.map((i: { id: string }) => i.id)
    const feedbackMap: Record<string, 'thumbs_up' | 'thumbs_down'> = {}

    if (ideaIds.length > 0) {
      const { data: actions } = await supabase
        .from('user_actions')
        .select('trade_idea_id, action_type')
        .eq('user_id', user.id)
        .in('trade_idea_id', ideaIds)
        .in('action_type', ['thumbs_up', 'thumbs_down'])

      for (const action of actions ?? []) {
        // Last one wins if duplicates exist
        feedbackMap[action.trade_idea_id] = action.action_type as 'thumbs_up' | 'thumbs_down'
      }
    }

    return NextResponse.json({ ideas, feedbackMap })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
