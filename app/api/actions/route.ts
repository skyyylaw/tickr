import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const bodySchema = z.object({
  action_type: z.enum([
    'view', 'expand', 'save', 'dismiss',
    'thumbs_up', 'thumbs_down', 'share',
    'digest_thumbs_up', 'digest_thumbs_down',
  ]),
  trade_idea_id: z.string().uuid().optional(),
  digest_id: z.string().uuid().optional(),
  time_spent_ms: z.number().int().nonnegative().optional(),
  feedback_reason: z.string().max(100).optional(),
})

const deleteSchema = z.object({
  action_type: z.enum(['thumbs_up', 'thumbs_down']),
  trade_idea_id: z.string().uuid(),
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const json = await request.json()
  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    // For thumbs_up/thumbs_down, remove the opposite action first (mutual exclusion)
    const { action_type, trade_idea_id } = parsed.data
    if (
      (action_type === 'thumbs_up' || action_type === 'thumbs_down') &&
      trade_idea_id
    ) {
      const opposite = action_type === 'thumbs_up' ? 'thumbs_down' : 'thumbs_up'
      await supabase
        .from('user_actions')
        .delete()
        .eq('user_id', user.id)
        .eq('trade_idea_id', trade_idea_id)
        .eq('action_type', opposite)
    }

    const { error } = await supabase
      .from('user_actions')
      .insert({ user_id: user.id, ...parsed.data })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const json = await request.json()
  const parsed = deleteSchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const { error } = await supabase
      .from('user_actions')
      .delete()
      .eq('user_id', user.id)
      .eq('trade_idea_id', parsed.data.trade_idea_id)
      .eq('action_type', parsed.data.action_type)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
