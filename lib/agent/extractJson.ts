/**
 * Extract JSON from an LLM response that may include markdown fences or surrounding text.
 * Tries: 1) raw parse, 2) strip code fences, 3) find outermost {...} or [...].
 */
export function extractJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
    if (fenceMatch) {
      return JSON.parse(fenceMatch[1])
    }

    const braceIdx = text.indexOf('{')
    const bracketIdx = text.indexOf('[')

    if (braceIdx >= 0 && (bracketIdx < 0 || braceIdx < bracketIdx)) {
      const match = text.match(/\{[\s\S]*\}/)
      if (match) return JSON.parse(match[0])
    }

    if (bracketIdx >= 0) {
      const match = text.match(/\[[\s\S]*\]/)
      if (match) return JSON.parse(match[0])
    }

    throw new Error('Could not extract valid JSON from LLM response')
  }
}
