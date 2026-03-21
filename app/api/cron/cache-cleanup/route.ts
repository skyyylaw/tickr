import { NextRequest, NextResponse } from 'next/server'
import { verifyCronSecret } from '@/lib/cron/auth'
import { cleanup } from '@/lib/cache/client'

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const deleted = await cleanup()
    console.log(`[cron:cache-cleanup] Deleted ${deleted} expired cache entries`)
    return NextResponse.json({ deleted })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[cron:cache-cleanup] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
