import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const STALE_THRESHOLD_MS = 10 * 60 * 1000

export async function GET(): Promise<NextResponse> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('generation_status, generation_started_at')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return NextResponse.json({ status: 'idle', startedAt: null })
  }

  // Auto-heal stale runs
  if (
    profile.generation_status === 'running' &&
    profile.generation_started_at &&
    Date.now() - new Date(profile.generation_started_at).getTime() > STALE_THRESHOLD_MS
  ) {
    await supabase
      .from('user_profiles')
      .update({ generation_status: 'idle' })
      .eq('id', user.id)

    return NextResponse.json({ status: 'idle', startedAt: profile.generation_started_at })
  }

  return NextResponse.json({
    status: profile.generation_status,
    startedAt: profile.generation_started_at,
  })
}
