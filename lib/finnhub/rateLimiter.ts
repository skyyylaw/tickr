export class TokenBucket {
  private tokens: number
  private lastRefill: number
  private readonly maxTokens: number
  private readonly refillRate: number // tokens per ms

  constructor(maxTokens: number, refillIntervalMs: number) {
    this.maxTokens = maxTokens
    this.tokens = maxTokens
    this.lastRefill = Date.now()
    this.refillRate = maxTokens / refillIntervalMs
  }

  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate)
    this.lastRefill = now
  }

  canConsume(): boolean {
    this.refill()
    return this.tokens >= 1
  }

  consume(): boolean {
    this.refill()
    if (this.tokens < 1) return false
    this.tokens -= 1
    return true
  }

  async waitForToken(): Promise<void> {
    while (!this.consume()) {
      const waitMs = Math.ceil((1 - this.tokens) / this.refillRate)
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }

  getTokens(): number {
    this.refill()
    return this.tokens
  }
}

// Finnhub free tier: 60 calls/minute
export const finnhubRateLimiter = new TokenBucket(60, 60_000)
