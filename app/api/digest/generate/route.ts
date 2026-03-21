import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateDailyDigest } from '@/lib/agent/digestGenerator'
import type { WizardData } from '@/types/Thesis'

const RATE_LIMIT_MS = 60 * 60 * 1000
const userLastGenerate = new Map<string, number>()

function checkRateLimit(userId: string): { allowed: boolean; retryAfterSeconds: number } {
  const last = userLastGenerate.get(userId) ?? 0
  const elapsed = Date.now() - last
  if (elapsed < RATE_LIMIT_MS) {
    return { allowed: false, retryAfterSeconds: Math.ceil((RATE_LIMIT_MS - elapsed) / 1000) }
  }
  userLastGenerate.set(userId, Date.now())
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
      { error: 'Rate limited. Please wait before generating again.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds) },
      }
    )
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const digest = await generateDailyDigest(user.id, profile as WizardData)
    return NextResponse.json({ digest })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[digest] Generation error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
