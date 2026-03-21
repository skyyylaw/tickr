import React from 'react'
import type { Source } from '@/types/Feed'

export function parseCitations(text: string, sources: Source[]): React.ReactNode {
  const sourceMap = new Map<number, Source>()
  for (const s of sources) {
    sourceMap.set(s.id, s)
  }

  const parts = text.split(/(\[\d+\])/g)
  const nodes: React.ReactNode[] = []

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const match = part.match(/^\[(\d+)\]$/)
    if (match) {
      const id = parseInt(match[1], 10)
      const source = sourceMap.get(id)
      if (source) {
        nodes.push(
          <a
            key={`cite-${i}`}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#2563EB',
              fontSize: '10px',
              verticalAlign: 'super',
              marginLeft: '2px',
              textDecoration: 'none',
            }}
          >
            [{id}]
          </a>
        )
      } else {
        nodes.push(part)
      }
    } else if (part) {
      nodes.push(part)
    }
  }

  return <>{nodes}</>
}
