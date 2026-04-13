import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getServiceClient } from '@/lib/supabase/service'
import { runAgentPipeline } from '@/lib/agent/pipeline'

export const maxDuration = 300

const RATE_LIMIT_MS = 5 * 60 * 1000
const STALE_THRESHOLD_MS = 10 * 60 * 1000

export async function POST(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = getServiceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileError } = await (service as any)
    .from('user_profiles')
    .select('generation_status, generation_started_at')
    .eq('id', user.id)
    .single() as { data: { generation_status: string; generation_started_at: string | null } | null; error: Error | null }

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  const now = Date.now()
  const startedAt = profile.generation_started_at ? new Date(profile.generation_started_at).getTime() : 0
  const elapsed = now - startedAt

  if (profile.generation_status === 'running' && elapsed < STALE_THRESHOLD_MS) {
    return NextResponse.json(
      { error: 'Generation already in progress.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((STALE_THRESHOLD_MS - elapsed) / 1000)) } }
    )
  }

  if (profile.generation_status === 'idle' && startedAt > 0 && elapsed < RATE_LIMIT_MS) {
    const retryAfter = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000)
    return NextResponse.json(
      { error: 'Rate limited. Please wait before running again.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  // Set status to running
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (service as any)
    .from('user_profiles')
    .update({ generation_status: 'running', generation_started_at: new Date().toISOString() })
    .eq('id', user.id)

  try {
    const result = await runAgentPipeline(user.id)

    // Set status back to idle (keep generation_started_at for rate limiting)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any)
      .from('user_profiles')
      .update({ generation_status: 'idle' })
      .eq('id', user.id)

    return NextResponse.json(result)
  } catch (err) {
    // Reset status on error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (service as any)
      .from('user_profiles')
      .update({ generation_status: 'idle' })
      .eq('id', user.id)

    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[agent] Pipeline error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
