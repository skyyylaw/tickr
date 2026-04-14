import type { Source } from '@/types/Agent'

/** Lowercase, strip punctuation, keep only significant words (4+ chars). */
function normalizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((word) => word.length >= 4)
}

function isFinnhubUrl(url: string): boolean {
  return url.includes('finnhub.io')
}

/**
 * Fraction of shared significant words relative to the shorter title.
 * Returns 0 if either title has no significant words.
 */
function computeOverlap(wordsA: string[], wordsB: string[]): number {
  if (wordsA.length === 0 || wordsB.length === 0) return 0
  const setA = new Set(wordsA)
  const shared = wordsB.filter((w) => setA.has(w)).length
  const shorter = Math.min(wordsA.length, wordsB.length)
  return shared / shorter
}

/**
 * Remove duplicate sources that refer to the same article via different URLs
 * (e.g. Finnhub proxy URL vs. original publisher URL).
 *
 * Two sources are considered duplicates when ≥60% of their significant title
 * words overlap. When a duplicate pair is found, the source with the real
 * publisher URL (non-finnhub.io) is kept. IDs are re-numbered sequentially.
 */
export function deduplicateSources(sources: Source[]): Source[] {
  const kept: { source: Source; words: string[] }[] = []

  for (const source of sources) {
    const words = normalizeTitle(source.title)
    let isDuplicate = false

    for (let i = 0; i < kept.length; i++) {
      if (computeOverlap(words, kept[i].words) >= 0.6) {
        isDuplicate = true
        // Replace with the real publisher URL when available
        if (isFinnhubUrl(kept[i].source.url) && !isFinnhubUrl(source.url)) {
          kept[i] = { source, words }
        }
        break
      }
    }

    if (!isDuplicate) {
      kept.push({ source, words })
    }
  }

  return kept.map((entry, index) => ({
    ...entry.source,
    id: index + 1,
  }))
}
