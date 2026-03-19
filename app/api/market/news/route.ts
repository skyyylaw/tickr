import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { getCompanyNews, getMarketNews } from '@/lib/finnhub/client'

const querySchema = z.object({
  ticker: z.string().min(1).max(10).optional(),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  category: z.enum(['general', 'forex', 'crypto', 'merger']).optional(),
})

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    ticker: searchParams.get('ticker') ?? undefined,
    from: searchParams.get('from') ?? undefined,
    to: searchParams.get('to') ?? undefined,
    category: searchParams.get('category') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 })
  }

  try {
    if (parsed.data.ticker) {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 86400_000).toISOString().split('T')[0]
      const articles = await getCompanyNews(
        parsed.data.ticker,
        parsed.data.from ?? weekAgo,
        parsed.data.to ?? today
      )
      return NextResponse.json({ articles })
    }

    const articles = await getMarketNews(parsed.data.category ?? 'general')
    return NextResponse.json({ articles })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
