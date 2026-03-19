export interface TavilySearchResult {
  title: string
  url: string
  content: string
  score: number
  raw_content?: string
}

export interface TavilySearchResponse {
  query: string
  results: TavilySearchResult[]
  answer?: string
}

export interface TavilySearchOptions {
  maxResults?: number
  searchDepth?: 'basic' | 'advanced'
  includeAnswer?: boolean
  includeDomains?: string[]
  excludeDomains?: string[]
}
