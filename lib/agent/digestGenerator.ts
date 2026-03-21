import Anthropic from '@anthropic-ai/sdk'
import { getMarketNews, getCompanyNews } from '@/lib/finnhub/client'
import { getServiceClient } from '@/lib/supabase/service'
import { DAILY_DIGEST_SYSTEM_PROMPT, buildDailyDigestUserPrompt } from './prompts'
import type { WizardData } from '@/types/Thesis'
import type { Source } from '@/types/Agent'
import type { NewsArticle } from '@/types/Finnhub'
import type { DigestRow } from '@/types/Feed'

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

function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export async function generateDailyDigest(
  userId: string,
  userProfile: WizardData
): Promise<DigestRow> {
  const start = Date.now()

  // Fetch general market news + company news for watchlist tickers
  const today = new Date()
  const weekAgo = new Date(Date.now() - 7 * 86400_000)
  const from = toDateString(weekAgo)
  const to = toDateString(today)

  const allArticles: NewsArticle[] = []
  const seenUrls = new Set<string>()

  // General market news
  const marketNews = await getMarketNews('general')
  for (const a of marketNews.slice(0, 10)) {
    if (!seenUrls.has(a.url)) {
      seenUrls.add(a.url)
      allArticles.push(a)
    }
  }

  // Company news for watchlist tickers
  const watchlistTickers = userProfile.interested_tickers.slice(0, 5)
  const tickerNewsPromises = watchlistTickers.map((ticker) =>
    getCompanyNews(ticker, from, to).catch(() => [] as NewsArticle[])
  )
  const tickerNewsResults = await Promise.all(tickerNewsPromises)
  for (const articles of tickerNewsResults) {
    for (const a of articles.slice(0, 3)) {
      if (!seenUrls.has(a.url)) {
        seenUrls.add(a.url)
        allArticles.push(a)
      }
    }
  }

  // Build source list (max 20, deduped by url, sequential IDs)
  const sources: Source[] = allArticles.slice(0, 20).map((a, i) => ({
    id: i + 1,
    title: a.headline,
    url: a.url,
    publisher: a.source,
  }))

  const userPrompt = buildDailyDigestUserPrompt(allArticles.slice(0, 20), userProfile, sources)

  // Call Claude
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const llmStart = Date.now()

  const message = await anthropic.messages.create({
    model: LLM_MODEL,
    max_tokens: 1024,
    system: DAILY_DIGEST_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const llmLatency = Date.now() - llmStart
  const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

  type DigestLLMResponse = {
    greeting: string
    sections: { label: string; body: string }[]
    watch_today: string
    sources: Source[]
  }

  const parsed = extractJson(rawText) as DigestLLMResponse

  // Normalize: handle 'topic' field from LLM if it uses that instead of 'label'
  const sections = (parsed.sections || []).map((s: { label?: string; topic?: string; body: string }) => ({
    label: s.label || s.topic || '',
    body: s.body || '',
  }))

  const totalLatency = Date.now() - start
  const supabase = getServiceClient()

  // Save agent_run
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: agentRun } = await (supabase as any)
    .from('agent_runs')
    .insert({
      user_id: userId,
      trigger_type: 'manual',
      triggering_event_data: { type: 'daily_digest' },
      user_thesis_snapshot: userProfile,
      search_queries: [],
      retrieved_data: { article_count: allArticles.length },
      llm_prompt: userPrompt,
      llm_response: rawText,
      llm_model: LLM_MODEL,
      llm_latency_ms: llmLatency,
      total_latency_ms: totalLatency,
      tokens_used: {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
      },
      success: true,
      error_message: null,
    })
    .select('id')
    .single() as { data: { id: string } | null }

  // Save digest
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: digestData, error } = await (supabase as any)
    .from('digests')
    .insert({
      user_id: userId,
      greeting: parsed.greeting || '',
      sections,
      watch_today: parsed.watch_today || null,
      sources: parsed.sources || sources,
      agent_run_id: agentRun?.id || null,
    })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to save digest: ${error.message}`)

  return digestData as DigestRow
}
