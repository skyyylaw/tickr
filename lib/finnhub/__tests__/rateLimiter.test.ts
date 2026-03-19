import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TokenBucket } from '../rateLimiter'

describe('TokenBucket', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with full tokens', () => {
    const bucket = new TokenBucket(60, 60_000)
    expect(bucket.getTokens()).toBe(60)
  })

  it('consumes a token', () => {
    const bucket = new TokenBucket(60, 60_000)
    expect(bucket.consume()).toBe(true)
    expect(bucket.getTokens()).toBeCloseTo(59, 0)
  })

  it('rejects when empty', () => {
    const bucket = new TokenBucket(3, 60_000)
    expect(bucket.consume()).toBe(true)
    expect(bucket.consume()).toBe(true)
    expect(bucket.consume()).toBe(true)
    expect(bucket.consume()).toBe(false)
    expect(bucket.canConsume()).toBe(false)
  })

  it('refills over time', () => {
    const bucket = new TokenBucket(60, 60_000)

    // Consume all tokens
    for (let i = 0; i < 60; i++) {
      bucket.consume()
    }
    expect(bucket.canConsume()).toBe(false)

    // Advance 1 second → should refill 1 token (60 tokens / 60,000 ms * 1,000 ms = 1)
    vi.advanceTimersByTime(1_000)
    expect(bucket.getTokens()).toBeCloseTo(1, 0)
    expect(bucket.canConsume()).toBe(true)
  })

  it('does not exceed max tokens', () => {
    const bucket = new TokenBucket(10, 60_000)
    // Already full, advance time
    vi.advanceTimersByTime(120_000)
    expect(bucket.getTokens()).toBe(10)
  })

  it('refills partially', () => {
    const bucket = new TokenBucket(60, 60_000)
    // Consume 30 tokens
    for (let i = 0; i < 30; i++) {
      bucket.consume()
    }
    // Advance 15 seconds → should refill 15 tokens
    vi.advanceTimersByTime(15_000)
    expect(bucket.getTokens()).toBeCloseTo(45, 0)
  })

  it('waitForToken resolves immediately when tokens available', async () => {
    vi.useRealTimers()
    const bucket = new TokenBucket(60, 60_000)
    const start = Date.now()
    await bucket.waitForToken()
    expect(Date.now() - start).toBeLessThan(50)
  })

  it('waitForToken waits when no tokens available', async () => {
    vi.useRealTimers()
    // 10 tokens refilling over 1 second (fast for testing)
    const bucket = new TokenBucket(2, 1_000)
    bucket.consume()
    bucket.consume()

    const start = Date.now()
    await bucket.waitForToken()
    const elapsed = Date.now() - start
    // Should have waited roughly 500ms for 1 token to refill (2 tokens / 1000ms)
    expect(elapsed).toBeGreaterThan(100)
    expect(elapsed).toBeLessThan(2_000)
  })

  it('handles rapid sequential consume calls', () => {
    const bucket = new TokenBucket(5, 60_000)
    const results: boolean[] = []
    for (let i = 0; i < 7; i++) {
      results.push(bucket.consume())
    }
    expect(results).toEqual([true, true, true, true, true, false, false])
  })
})
