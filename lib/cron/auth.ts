import { NextRequest } from 'next/server'

export function verifyCronSecret(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[cron] CRON_SECRET is not set')
    return false
  }
  const authHeader = request.headers.get('authorization')
  return authHeader === `Bearer ${secret}`
}
