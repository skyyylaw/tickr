import { NextResponse } from 'next/server'
import { z } from 'zod'

const querySchema = z.object({
  q: z.string().min(1).max(50),
})

interface FinnhubSearchResult {
  description: string
  displaySymbol: string
  symbol: string
  type: string
}

interface FinnhubSearchResponse {
  count: number
  result: FinnhubSearchResult[]
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)

  const parsed = querySchema.safeParse({ q: searchParams.get('q') })
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid query' }, { status: 400 })
  }

  const apiKey = process.env.FINNHUB_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  try {
    const url = `https://finnhub.io/api/v1/search?q=${encodeURIComponent(parsed.data.q)}&token=${apiKey}`
    const res = await fetch(url, { next: { revalidate: 60 } })

    if (!res.ok) {
      return NextResponse.json({ error: 'Upstream error' }, { status: 502 })
    }

    const data: FinnhubSearchResponse = await res.json()

    const results = (data.result ?? [])
      .filter(
        (item) =>
          item.type === 'Common Stock' &&
          !item.symbol.includes('.') &&
          item.displaySymbol === item.symbol
      )
      .slice(0, 10)
      .map((item) => ({ symbol: item.symbol, description: item.description }))

    return NextResponse.json({ results })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
