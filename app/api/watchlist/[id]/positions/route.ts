import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const positionSchema = z.object({
  shares: z.number().positive(),
  entry_price: z.number().positive(),
  entry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().max(500).nullable().optional(),
})

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: watchlistItemId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify ownership of watchlist item and get ticker
  const { data: watchlistItem } = await supabase
    .from('watchlist_items')
    .select('ticker')
    .eq('id', watchlistItemId)
    .eq('user_id', user.id)
    .single()

  if (!watchlistItem) {
    return NextResponse.json({ error: 'Watchlist item not found' }, { status: 404 })
  }

  const body = await request.json()
  const parsed = positionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid position data' }, { status: 400 })
  }

  const { data: position, error } = await supabase
    .from('positions')
    .insert({
      user_id: user.id,
      ticker: watchlistItem.ticker,
      shares: parsed.data.shares,
      entry_price: parsed.data.entry_price,
      entry_date: parsed.data.entry_date,
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ position }, { status: 201 })
}
