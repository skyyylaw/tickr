import Anthropic from '@anthropic-ai/sdk'
import {
  getEarningsTranscript,
  getQuote,
  getCompanyProfile,
  getRecommendationTrends,
  getPriceTarget,
  getUpgradeDowngrade,
  getEpsEstimates,
} from '@/lib/finnhub/client'
import { search as tavilySearch } from '@/lib/tavily/client'
import { EARNINGS_DIGEST_SYSTEM_PROMPT, buildEarningsDigestUserPrompt } from './prompts'
import type { WizardData } from '@/types/Thesis'
import type { EnrichedEarningsData, EarningsDigestLLMResponse, EarningsDigestResult, Source } from '@/types/Agent'

const LLM_MODEL = 'claude-sonnet-4-20250514'

function extractJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1])
    }
    const braceMatch = text.match(/\{[\s\S]*\}/)
    if (braceMatch) {
      return JSON.parse(braceMatch[0])
    }
    throw new Error('Could not extract valid JSON from LLM response')
  }
}

export async function generateEarningsDigest(
  ticker: string,
  year: number,
  quarter: number,
  userProfile: WizardData
): Promise<EarningsDigestResult> {
  const searchQuery = `${ticker} Q${quarter} ${year} earnings analyst reaction`
  const searchQueries = [
    `transcript:${ticker}:${year}:Q${quarter}`,
    `quote:${ticker}`,
    `profile:${ticker}`,
    `recommendations:${ticker}`,
    `priceTarget:${ticker}`,
    `upgrades:${ticker}`,
    `epsEstimates:${ticker}`,
    `tavily:${searchQuery}`,
  ]

  const results = await Promise.allSettled([
    getEarningsTranscript(ticker, year, quarter),
    getQuote(ticker),
    getCompanyProfile(ticker),
    getRecommendationTrends(ticker),
    getPriceTarget(ticker),
    getUpgradeDowngrade(ticker),
    getEpsEstimates(ticker),
    tavilySearch(searchQuery, { maxResults: 5 }),
  ])

  const transcript = results[0].status === 'fulfilled' ? results[0].value : null
  const quote = results[1].status === 'fulfilled' ? results[1].value : null
  const profile = results[2].status === 'fulfilled' ? results[2].value : null
  const recommendations = results[3].status === 'fulfilled' ? results[3].value : []
  const priceTarget = results[4].status === 'fulfilled' ? results[4].value : null
  const upgrades = results[5].status === 'fulfilled' ? results[5].value : []
  const epsEstimates = results[6].status === 'fulfilled' ? results[6].value : []
  const tavilyResults = results[7].status === 'fulfilled' ? results[7].value : []

  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') {
      console.error(`[agent] Earnings data fetch failed (${searchQueries[i]}):`, (results[i] as PromiseRejectedResult).reason)
    }
  }

  const sources: Source[] = []
  let nextId = 1
  const seenUrls = new Set<string>()

  if (transcript) {
    sources.push({
      id: nextId++,
      title: `${ticker} Q${quarter} ${year} Earnings Call Transcript`,
      url: `https://finnhub.io/stock/${ticker}`,
      publisher: 'Finnhub Transcript',
    })
  }

  for (const result of tavilyResults) {
    if (!seenUrls.has(result.url)) {
      sources.push({
        id: nextId++,
        title: result.title,
        url: result.url,
        publisher: 'Tavily',
      })
      seenUrls.add(result.url)
    }
  }

  const enrichedData: EnrichedEarningsData = {
    ticker,
    year,
    quarter,
    transcript,
    quote,
    profile,
    recommendations,
    priceTarget,
    upgrades,
    epsEstimates,
    tavilyContext: tavilyResults,
    sources,
    searchQueries,
  }

  const client = new Anthropic()
  const userPrompt = buildEarningsDigestUserPrompt(enrichedData, userProfile)
  const startTime = Date.now()

  const response = await client.messages.create({
    model: LLM_MODEL,
    max_tokens: 1024,
    system: EARNINGS_DIGEST_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const latencyMs = Date.now() - startTime

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in LLM response')
  }

  const parsed = extractJson(textBlock.text) as EarningsDigestLLMResponse

  return {
    digest: parsed,
    metadata: {
      prompt: userPrompt,
      response: textBlock.text,
      model: LLM_MODEL,
      latencyMs,
      tokens: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    },
  }
}
