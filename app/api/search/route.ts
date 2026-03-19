import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { search } from '@/lib/tavily/client'

const querySchema = z.object({
  q: z.string().min(1).max(500),
  maxResults: z.coerce.number().min(1).max(20).optional(),
  searchDepth: z.enum(['basic', 'advanced']).optional(),
})

export async function GET(request: Request): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = querySchema.safeParse({
    q: searchParams.get('q'),
    maxResults: searchParams.get('maxResults') ?? undefined,
    searchDepth: searchParams.get('searchDepth') ?? undefined,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }

  try {
    const results = await search(parsed.data.q, {
      maxResults: parsed.data.maxResults,
      searchDepth: parsed.data.searchDepth,
    })
    return NextResponse.json({ results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
