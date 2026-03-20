import Anthropic from '@anthropic-ai/sdk'
import { TRADE_IDEA_SYSTEM_PROMPT, buildTradeIdeaUserPrompt } from './prompts'
import type { EnrichedEvent, TradeIdeaLLMResponse, TradeIdeaResult } from '@/types/Agent'
import type { WizardData } from '@/types/Thesis'

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

function validateResponse(parsed: unknown): TradeIdeaLLMResponse {
  const obj = parsed as Record<string, unknown>

  if (typeof obj.has_idea !== 'boolean') {
    throw new Error('Missing or invalid has_idea field')
  }

  if (!obj.has_idea) {
    return obj as unknown as TradeIdeaLLMResponse
  }

  const required = ['ticker', 'direction', 'headline', 'event_summary', 'reasoning', 'risks', 'confidence', 'time_horizon', 'watch_for', 'sources']
  for (const field of required) {
    if (obj[field] === undefined) {
      throw new Error(`Missing required field: ${field}`)
    }
  }

  const validDirections = ['buy', 'sell', 'hold']
  if (!validDirections.includes(obj.direction as string)) {
    throw new Error(`Invalid direction: ${obj.direction}`)
  }

  const validHorizons = ['days', 'weeks', 'months']
  if (!validHorizons.includes(obj.time_horizon as string)) {
    throw new Error(`Invalid time_horizon: ${obj.time_horizon}`)
  }

  const confidence = obj.confidence as number
  if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
    throw new Error(`Invalid confidence: ${confidence}`)
  }

  return obj as unknown as TradeIdeaLLMResponse
}

export async function generateTradeIdea(
  enrichedEvent: EnrichedEvent,
  userProfile: WizardData
): Promise<TradeIdeaResult | null> {
  const client = new Anthropic()

  const userPrompt = buildTradeIdeaUserPrompt(enrichedEvent, userProfile)
  const startTime = Date.now()

  const response = await client.messages.create({
    model: LLM_MODEL,
    max_tokens: 1024,
    system: TRADE_IDEA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const latencyMs = Date.now() - startTime

  const textBlock = response.content.find((block) => block.type === 'text')
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text content in LLM response')
  }

  const parsed = extractJson(textBlock.text)
  const idea = validateResponse(parsed)

  if (!idea.has_idea) {
    return null
  }

  return {
    idea,
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
