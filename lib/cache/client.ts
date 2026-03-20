import { getServiceClient } from '@/lib/supabase/service'

interface ApiCacheRow {
  id: string
  cache_key: string
  value: unknown
  source: string
  expires_at: string
  created_at: string
}

function cacheTable() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return getServiceClient().from('api_cache') as any
}

export async function get<T = unknown>(key: string): Promise<T | null> {
  const { data, error } = await cacheTable()
    .select('value')
    .eq('cache_key', key)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !data) return null
  return (data as ApiCacheRow).value as T
}

export async function set(
  key: string,
  value: unknown,
  source: string,
  ttlSeconds: number
): Promise<void> {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()

  const { error } = await cacheTable()
    .upsert(
      { cache_key: key, value, source, expires_at: expiresAt },
      { onConflict: 'cache_key' }
    )

  if (error) {
    console.error(`[cache] Failed to set key "${key}":`, error.message)
  }
}

export async function invalidate(key: string): Promise<void> {
  const { error } = await cacheTable()
    .delete()
    .eq('cache_key', key)

  if (error) {
    console.error(`[cache] Failed to invalidate key "${key}":`, error.message)
  }
}

export async function cleanup(): Promise<number> {
  const { data, error } = await cacheTable()
    .delete()
    .lt('expires_at', new Date().toISOString())
    .select('id')

  if (error) {
    console.error('[cache] Failed to cleanup expired entries:', error.message)
    return 0
  }

  return (data as unknown[])?.length ?? 0
}
