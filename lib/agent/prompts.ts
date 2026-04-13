import type { EnrichedEvent, EnrichedTickerGroup, EnrichedEarningsData, Source } from '@/types/Agent'
import type { WizardData } from '@/types/Thesis'
import type { NewsArticle } from '@/types/Finnhub'

export const TRADE_IDEA_SYSTEM_PROMPT = `You are a concise AI investment research analyst for Tickr. Your job is to analyze market events through the lens of a specific investor's thesis and generate TL;DR trade ideas backed by cited sources.

IMPORTANT RULES:
- You are NOT giving financial advice. Frame as "worth researching" or "potential opportunity to investigate"
- Be concise. Users want a TL;DR, not a research report. The entire expanded idea should be readable in 15 seconds.
- Be specific about WHY this event matters for THIS investor's thesis
- If the event doesn't meaningfully connect to the investor's thesis, say so — don't force a trade idea
- US stocks only
- EVERY claim in your reasoning must be traceable to a source provided in the context. Include source references in your reasoning bullets using [1], [2], etc. that correspond to the sources array.
- Only cite sources that were provided to you in the enriched data context. Never fabricate URLs or source names.
- You will receive ticker metrics (momentum, volume, 52-week range). Use these to strengthen or temper your reasoning, but ALWAYS translate them into plain, intuitive language. Your users are not finance experts.
  GOOD: "Stock has been climbing steadily — up 15% this month"
  GOOD: "Trading near its lowest point in a year, which could mean opportunity or deeper trouble"
  GOOD: "Unusually heavy trading today — the market is clearly reacting"
  BAD: "1M momentum: +15.2%, relative volume: 2.3x, 8% above 200-day SMA"
  NEVER show raw numbers, percentages, or indicator names without context. Always explain what the number means for someone who doesn't trade daily.

OUTPUT FORMAT (respond in valid JSON only, no markdown):
{
  "has_idea": boolean,
  "ticker": "string (US stock only)",
  "direction": "buy" | "sell" | "hold",
  "headline": "One-line elevator pitch (max 80 chars, punchy, like a senior analyst's Slack message)",
  "event_summary": "What happened, in one sentence (max 120 chars) [1]",
  "reasoning": ["Bullet with source ref [1] (max 100 chars)", "Bullet with source ref [2] (max 100 chars)", "Bullet with source ref (max 100 chars)"],
  "risks": ["One-line risk 1", "One-line risk 2"],
  "confidence": 0.0-1.0,
  "time_horizon": "days" | "weeks" | "months",
  "watch_for": "One sentence: the key metric or event to monitor next (max 100 chars)",
  "sources": [
    {"id": 1, "title": "Article or source title", "url": "https://...", "publisher": "Reuters"},
    {"id": 2, "title": "Article or source title", "url": "https://...", "publisher": "Bloomberg"}
  ]
}`

export const EARNINGS_DIGEST_SYSTEM_PROMPT = `You are translating an earnings call and analyst data into plain English for someone who doesn't speak finance. Your job is to make this completely intuitive — no jargon, no acronyms, no assumed knowledge.

RULES:
- Write like you're explaining to a smart friend who doesn't work in finance
- NEVER use unexplained jargon. If you must reference a financial term, immediately explain it in parentheses.
  GOOD: "Revenue grew 8% (the total money the company brought in)"
  GOOD: "Earnings beat expectations (they made more profit than Wall Street predicted)"
  BAD: "EPS of $1.52 beat consensus by $0.08"
  BAD: "Gross margins expanded 120bps YoY"
- Highlight what the CEO/CFO seemed most excited about and most cautious about
- Connect to the user's thesis where relevant
- Include what analysts think (price targets, buy/sell consensus) translated into plain language
- Cite sources using [1] [2] notation
- Keep it concise — scannable in 20 seconds
- This is NOT financial advice — frame as informational summary

OUTPUT FORMAT (respond in valid JSON only, no markdown):
{
  "card_type": "earnings_digest",
  "ticker": "string",
  "quarter_label": "Q1 2026",
  "headline": "One-line summary of the earnings story (max 80 chars)",
  "tldr": "2-3 sentence plain-English summary of what happened and why it matters",
  "highlights": ["Plain-English bullet 1 (max 100 chars)", "Plain-English bullet 2", "Plain-English bullet 3"],
  "management_tone": "What leadership seemed excited or worried about (1-2 sentences)",
  "analyst_view": "What Wall Street thinks, in plain language (1-2 sentences, e.g. '35 out of 40 analysts say buy, with an average target of $210 — about 12% above today\\'s price')",
  "thesis_connection": "How this connects to the user's investment thesis (1 sentence, or null if not relevant)",
  "sources": [
    {"id": 1, "title": "Source title", "url": "https://...", "publisher": "Finnhub Transcript"}
  ]
}`

function formatThesis(profile: WizardData): string {
  const lines: string[] = []
  if (profile.investment_goals.length > 0) {
    lines.push(`Goals: ${profile.investment_goals.join(', ')}`)
  }
  lines.push(`Time horizon: ${profile.time_horizon.replace('_', ' ')}`)
  lines.push(`Risk tolerance: ${profile.risk_tolerance}/10`)
  if (profile.sectors.length > 0) {
    lines.push(`Sectors of interest: ${profile.sectors.join(', ')}`)
  }
  if (profile.industries.length > 0) {
    lines.push(`Industries: ${profile.industries.join(', ')}`)
  }
  if (profile.strategy_preferences.length > 0) {
    lines.push(`Strategy preferences: ${profile.strategy_preferences.join(', ')}`)
  }
  if (profile.interested_tickers.length > 0) {
    lines.push(`Watchlist tickers: ${profile.interested_tickers.join(', ')}`)
  }
  lines.push(`Experience level: ${profile.experience_level}`)
  if (profile.constraints.length > 0) {
    lines.push(`Constraints: ${profile.constraints.join(', ')}`)
  }
  if (profile.custom_thesis && profile.custom_thesis.trim()) {
    lines.push(`Additional context from investor (in their own words): ${profile.custom_thesis.trim()}`)
  }
  return lines.join('\n')
}

function formatSources(sources: { id: number; title: string; url: string; publisher: string }[]): string {
  return sources.map((s) => `[${s.id}] ${s.title} — ${s.publisher} (${s.url})`).join('\n')
}

export function buildTradeIdeaUserPrompt(enriched: EnrichedEvent, userProfile: WizardData): string {
  const sections: string[] = []

  sections.push(`## Your Investor Profile\n${formatThesis(userProfile)}`)

  const eventTime = new Date(enriched.event.datetime * 1000).toISOString()
  sections.push(`## Triggering Event\nHeadline: ${enriched.event.headline}\nSummary: ${enriched.event.summary}\nSource: ${enriched.event.source}\nTime: ${eventTime}\nTickers mentioned: ${enriched.event.tickers.join(', ')}`)

  const ticker = enriched.event.tickers[0] || 'Unknown'

  if (enriched.quote || enriched.profile || enriched.metrics) {
    const dataLines: string[] = [`## Ticker Data: ${ticker}`]

    if (enriched.profile) {
      dataLines.push(`Company: ${enriched.profile.name} (${enriched.profile.exchange})`)
      dataLines.push(`Industry: ${enriched.profile.industry}`)
      dataLines.push(`Market cap: $${(enriched.profile.marketCap * 1_000_000).toLocaleString()}`)
    }

    if (enriched.quote) {
      dataLines.push(`Current price: $${enriched.quote.price.toFixed(2)}`)
      dataLines.push(`Today's change: ${enriched.quote.changePercent >= 0 ? '+' : ''}${enriched.quote.changePercent.toFixed(2)}%`)
    }

    if (enriched.metrics) {
      dataLines.push(`\n### Momentum Metrics (for your analysis — translate to plain language for the user)`)
      dataLines.push(`1-week price change: ${enriched.metrics.weekChangePercent >= 0 ? '+' : ''}${enriched.metrics.weekChangePercent.toFixed(1)}%`)
      dataLines.push(`1-month price change: ${enriched.metrics.monthChangePercent >= 0 ? '+' : ''}${enriched.metrics.monthChangePercent.toFixed(1)}%`)
      dataLines.push(`Distance from 30-day high: ${enriched.metrics.percentFrom52wHigh.toFixed(1)}% below`)
      dataLines.push(`Distance from 30-day low: ${enriched.metrics.percentFrom52wLow.toFixed(1)}% above`)
      dataLines.push(`Relative volume (today vs 30-day avg): ${enriched.metrics.relativeVolume.toFixed(1)}x`)
    }

    sections.push(dataLines.join('\n'))
  }

  if (enriched.tavilyContext.length > 0) {
    const contextLines = enriched.tavilyContext
      .slice(0, 5)
      .map((r) => `- ${r.title}: ${r.content.slice(0, 300)}`)
    sections.push(`## Additional Context\n${contextLines.join('\n')}`)
  }

  if (enriched.sources.length > 0) {
    sections.push(`## Sources\n${formatSources(enriched.sources)}`)
  }

  return sections.join('\n\n')
}

export interface ExistingIdea {
  headline: string
  direction: string
}

export function buildTickerGroupUserPrompt(
  enriched: EnrichedTickerGroup,
  userProfile: WizardData,
  existingIdeas?: ExistingIdea[]
): string {
  const sections: string[] = []

  sections.push(`## Your Investor Profile\n${formatThesis(userProfile)}`)

  // All events for this ticker
  sections.push(`## Events for ${enriched.ticker} (${enriched.events.length} event${enriched.events.length > 1 ? 's' : ''})`)
  for (let i = 0; i < enriched.events.length; i++) {
    const event = enriched.events[i]
    const eventTime = new Date(event.datetime * 1000).toISOString()
    sections.push(`### Event ${i + 1}\nHeadline: ${event.headline}\nSummary: ${event.summary}\nSource: ${event.source}\nTime: ${eventTime}\nRelevance: ${event.relevanceScore.toFixed(2)} (${event.matchReason})`)
  }

  if (enriched.events.length > 1) {
    sections.push(`IMPORTANT: You have multiple events for ${enriched.ticker}. Weigh all bullish and bearish signals against each other and produce ONE directional call (buy, sell, or hold). Do NOT ignore conflicting signals — acknowledge them in your reasoning.`)
  }

  if (existingIdeas && existingIdeas.length > 0) {
    const ideaLines = existingIdeas.map((i) => `- [${i.direction.toUpperCase()}] ${i.headline}`)
    sections.push(`## EXISTING IDEAS (do not repeat):\n${ideaLines.join('\n')}\n\nYou must not generate an idea that covers the same thesis or signal as the above. If there is no genuinely new and distinct signal for this ticker, return has_idea: false.`)
  }

  if (enriched.quote || enriched.profile || enriched.metrics) {
    const dataLines: string[] = [`## Ticker Data: ${enriched.ticker}`]

    if (enriched.profile) {
      dataLines.push(`Company: ${enriched.profile.name} (${enriched.profile.exchange})`)
      dataLines.push(`Industry: ${enriched.profile.industry}`)
      dataLines.push(`Market cap: $${(enriched.profile.marketCap * 1_000_000).toLocaleString()}`)
    }

    if (enriched.quote) {
      dataLines.push(`Current price: $${enriched.quote.price.toFixed(2)}`)
      dataLines.push(`Today's change: ${enriched.quote.changePercent >= 0 ? '+' : ''}${enriched.quote.changePercent.toFixed(2)}%`)
    }

    if (enriched.metrics) {
      dataLines.push(`\n### Momentum Metrics (for your analysis — translate to plain language for the user)`)
      dataLines.push(`1-week price change: ${enriched.metrics.weekChangePercent >= 0 ? '+' : ''}${enriched.metrics.weekChangePercent.toFixed(1)}%`)
      dataLines.push(`1-month price change: ${enriched.metrics.monthChangePercent >= 0 ? '+' : ''}${enriched.metrics.monthChangePercent.toFixed(1)}%`)
      dataLines.push(`Distance from 30-day high: ${enriched.metrics.percentFrom52wHigh.toFixed(1)}% below`)
      dataLines.push(`Distance from 30-day low: ${enriched.metrics.percentFrom52wLow.toFixed(1)}% above`)
      dataLines.push(`Relative volume (today vs 30-day avg): ${enriched.metrics.relativeVolume.toFixed(1)}x`)
    }

    sections.push(dataLines.join('\n'))
  }

  if (enriched.tavilyContext.length > 0) {
    const contextLines = enriched.tavilyContext
      .slice(0, 5)
      .map((r) => `- ${r.title}: ${r.content.slice(0, 300)}`)
    sections.push(`## Additional Context\n${contextLines.join('\n')}`)
  }

  if (enriched.sources.length > 0) {
    sections.push(`## Sources\n${formatSources(enriched.sources)}`)
  }

  return sections.join('\n\n')
}

export function buildEarningsDigestUserPrompt(
  data: EnrichedEarningsData,
  userProfile: WizardData
): string {
  const sections: string[] = []

  sections.push(`## Your Investor Profile\n${formatThesis(userProfile)}`)

  sections.push(`## Earnings Report: ${data.ticker} Q${data.quarter} ${data.year}`)

  if (data.transcript) {
    const transcriptText = data.transcript.transcript
      .map((section) => `${section.name}:\n${section.speech.join(' ')}`)
      .join('\n\n')
    const truncated = transcriptText.length > 8000
      ? transcriptText.slice(0, 8000) + '\n\n[Transcript truncated]'
      : transcriptText
    sections.push(`## Earnings Call Transcript (Key Excerpts)\n${truncated}`)
  }

  if (data.quote) {
    sections.push(`## Current Stock Data\nPrice: $${data.quote.price.toFixed(2)} (${data.quote.changePercent >= 0 ? '+' : ''}${data.quote.changePercent.toFixed(2)}% today)`)
  }

  if (data.epsEstimates.length > 0) {
    const latest = data.epsEstimates[0]
    const epsLines = [`## EPS Data`]
    if (latest.epsActual !== null && latest.epsEstimate !== null) {
      epsLines.push(`Actual EPS: $${latest.epsActual} vs Expected: $${latest.epsEstimate}`)
      if (latest.surprisePercent !== null) {
        epsLines.push(`Surprise: ${latest.surprisePercent >= 0 ? '+' : ''}${latest.surprisePercent.toFixed(1)}%`)
      }
    }
    sections.push(epsLines.join('\n'))
  }

  if (data.recommendations.length > 0) {
    const latest = data.recommendations[0]
    const total = latest.strongBuy + latest.buy + latest.hold + latest.sell + latest.strongSell
    sections.push(`## Analyst Recommendations (${latest.period})\nStrong Buy: ${latest.strongBuy}, Buy: ${latest.buy}, Hold: ${latest.hold}, Sell: ${latest.sell}, Strong Sell: ${latest.strongSell}\nTotal analysts: ${total}`)
  }

  if (data.priceTarget) {
    sections.push(`## Price Targets\nHigh: $${data.priceTarget.targetHigh}, Low: $${data.priceTarget.targetLow}, Mean: $${data.priceTarget.targetMean}, Median: $${data.priceTarget.targetMedian}`)
  }

  if (data.upgrades.length > 0) {
    const upgradeLines = data.upgrades.slice(0, 5).map(
      (u) => `- ${u.company}: ${u.action} (${u.fromGrade} → ${u.toGrade}) on ${u.date}`
    )
    sections.push(`## Recent Upgrades/Downgrades\n${upgradeLines.join('\n')}`)
  }

  if (data.tavilyContext.length > 0) {
    const contextLines = data.tavilyContext
      .slice(0, 5)
      .map((r) => `- ${r.title}: ${r.content.slice(0, 300)}`)
    sections.push(`## Analyst Commentary\n${contextLines.join('\n')}`)
  }

  if (data.sources.length > 0) {
    sections.push(`## Sources\n${formatSources(data.sources)}`)
  }

  return sections.join('\n\n')
}

export const DAILY_DIGEST_SYSTEM_PROMPT = `You are writing a personalized daily market briefing for a Tickr user. Your tone is conversational but knowledgeable — like a smart friend in finance catching them up over coffee.

RULES:
- Write in 2nd person ("Your tech watchlist had a busy day...")
- Group related events into narrative threads, don't just list headlines
- Connect events to the user's thesis where relevant
- Keep the entire briefing to 300-400 words max
- Use natural transitions between topics
- End with a "Worth watching today" line about upcoming events (earnings, Fed meetings, etc.)
- Cite sources using [1] [2] notation — only cite sources provided in context
- US stocks only

OUTPUT FORMAT (valid JSON only, no markdown):
{
  "greeting": "Short personalized opener (e.g., 'Big moves in energy today — here's what matters for you.')",
  "sections": [
    {
      "label": "Short topic label (e.g., 'YOUR EV WATCHLIST')",
      "body": "2-4 sentences of conversational narrative with [1] [2] source refs"
    }
  ],
  "watch_today": "One line about what to keep an eye on next",
  "sources": [
    {"id": 1, "title": "Article title", "url": "https://...", "publisher": "Reuters"}
  ]
}`

export function buildDailyDigestUserPrompt(
  articles: NewsArticle[],
  userProfile: WizardData,
  sources: Source[]
): string {
  const sections: string[] = []

  sections.push(`## Your Investor Profile\n${formatThesis(userProfile)}`)

  if (articles.length > 0) {
    const articleLines = articles
      .slice(0, 20)
      .map((a, i) => `[${i + 1}] ${a.headline}\n${a.summary.slice(0, 300)}`)
    sections.push(`## Today's News Articles\n${articleLines.join('\n\n')}`)
  }

  if (sources.length > 0) {
    sections.push(`## Sources\n${formatSources(sources)}`)
  }

  return sections.join('\n\n')
}
