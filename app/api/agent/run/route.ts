import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAgentPipeline } from '@/lib/agent/pipeline'

const RATE_LIMIT_MS = 5 * 60 * 1000
const userLastRun = new Map<string, number>()

function checkRateLimit(userId: string): { allowed: boolean; retryAfterSeconds: number } {
  const last = userLastRun.get(userId) ?? 0
  const elapsed = Date.now() - last
  if (elapsed < RATE_LIMIT_MS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((RATE_LIMIT_MS - elapsed) / 1000) }
  }
  userLastRun.set(userId, Date.now())
  return { allowed: true, retryAfterSeconds: 0 }
}

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { allowed, retryAfterSeconds } = checkRateLimit(user.id)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Rate limited. Please wait before running again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      }
    )
  }

  try {
    const result = await runAgentPipeline(user.id)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[agent] Pipeline error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
