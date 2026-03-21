// Static mapping of sectors and industries to popular US tickers.
// Used to suggest tickers during onboarding based on user selections.

export const SECTOR_TICKERS: Record<string, string[]> = {
  'Technology': ['AAPL', 'MSFT', 'GOOG', 'META', 'AMZN', 'ORCL', 'CRM'],
  'Healthcare': ['JNJ', 'UNH', 'PFE', 'ABBV', 'LLY', 'TMO'],
  'Energy': ['XOM', 'CVX', 'COP', 'SLB', 'EOG'],
  'Finance': ['JPM', 'BAC', 'GS', 'MS', 'V', 'MA'],
  'Consumer': ['WMT', 'COST', 'PG', 'KO', 'PEP', 'NKE', 'MCD'],
  'Real Estate': ['AMT', 'PLD', 'SPG', 'O', 'WELL'],
  'Industrials': ['CAT', 'UNP', 'HON', 'GE', 'BA', 'RTX'],
  'Materials': ['LIN', 'APD', 'SHW', 'FCX', 'NEM'],
  'Utilities': ['NEE', 'DUK', 'SO', 'AEP', 'D'],
  'Communication Services': ['GOOG', 'META', 'DIS', 'NFLX', 'CMCSA', 'T'],
}

export const INDUSTRY_TICKERS: Record<string, string[]> = {
  'AI/Machine Learning': ['NVDA', 'AMD', 'AVGO', 'PLTR', 'AI', 'MSFT'],
  'Electric Vehicles': ['TSLA', 'RIVN', 'LCID', 'NIO', 'LI'],
  'Biotech/Pharma': ['MRNA', 'GILD', 'REGN', 'VRTX', 'BIIB'],
  'Semiconductors': ['NVDA', 'AMD', 'INTC', 'AVGO', 'TSM', 'MRVL'],
  'Cloud Computing': ['AMZN', 'MSFT', 'GOOG', 'CRM', 'SNOW', 'NET'],
  'Renewable Energy': ['ENPH', 'SEDG', 'FSLR', 'NEE', 'RUN'],
  'Fintech': ['SQ', 'PYPL', 'SOFI', 'AFRM', 'COIN'],
  'E-commerce': ['AMZN', 'SHOP', 'MELI', 'ETSY', 'PDD'],
  'Social Media': ['META', 'SNAP', 'PINS', 'RDDT'],
  'Space/Aerospace': ['BA', 'LMT', 'NOC', 'RTX', 'RKLB'],
  'Cannabis': ['TLRY', 'CGC', 'MO', 'STZ'],
  'Cybersecurity': ['CRWD', 'PANW', 'ZS', 'FTNT', 'S'],
  'Gaming': ['RBLX', 'EA', 'TTWO', 'ATVI', 'U'],
  'Real Estate/REITs': ['AMT', 'PLD', 'SPG', 'O', 'WELL'],
  'Blockchain/Web3': ['COIN', 'MARA', 'RIOT', 'MSTR'],
}

/** Given selected sectors and industries, return a deduped list of suggested tickers. */
export function getSuggestedTickers(
  sectors: string[],
  industries: string[]
): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const sector of sectors) {
    for (const ticker of SECTOR_TICKERS[sector] ?? []) {
      if (!seen.has(ticker)) {
        seen.add(ticker)
        result.push(ticker)
      }
    }
  }

  for (const industry of industries) {
    for (const ticker of INDUSTRY_TICKERS[industry] ?? []) {
      if (!seen.has(ticker)) {
        seen.add(ticker)
        result.push(ticker)
      }
    }
  }

  return result
}
