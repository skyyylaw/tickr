const DOMAIN_TO_PUBLISHER: Record<string, string> = {
  'finance.yahoo.com': 'Yahoo Finance',
  'reuters.com': 'Reuters',
  'cnbc.com': 'CNBC',
  'bloomberg.com': 'Bloomberg',
  'seekingalpha.com': 'Seeking Alpha',
  'marketwatch.com': 'MarketWatch',
  'wsj.com': 'Wall Street Journal',
  'fool.com': 'Motley Fool',
  'barrons.com': "Barron's",
  'investopedia.com': 'Investopedia',
  'benzinga.com': 'Benzinga',
  'thestreet.com': 'TheStreet',
  'ft.com': 'Financial Times',
  'forbes.com': 'Forbes',
  'businessinsider.com': 'Business Insider',
  'investors.com': "Investor's Business Daily",
  'zacks.com': 'Zacks',
  'tipranks.com': 'TipRanks',
  'gurufocus.com': 'GuruFocus',
  'morningstar.com': 'Morningstar',
  'nasdaq.com': 'Nasdaq',
  'nypost.com': 'New York Post',
  'nytimes.com': 'New York Times',
  'washingtonpost.com': 'Washington Post',
  'apnews.com': 'AP News',
  'bbc.com': 'BBC',
  'cnn.com': 'CNN',
  'axios.com': 'Axios',
  'techcrunch.com': 'TechCrunch',
  'theverge.com': 'The Verge',
  'arstechnica.com': 'Ars Technica',
  'wired.com': 'Wired',
}

export function publisherFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase()

    // Check full hostname first (catches subdomains like finance.yahoo.com)
    if (DOMAIN_TO_PUBLISHER[hostname]) {
      return DOMAIN_TO_PUBLISHER[hostname]
    }

    // Check if any mapped domain is a suffix of the hostname
    for (const [domain, publisher] of Object.entries(DOMAIN_TO_PUBLISHER)) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return publisher
      }
    }

    // Fallback: extract domain name, strip www/TLD, capitalize first letter
    const parts = hostname.replace(/^www\./, '').split('.')
    const name = parts.length >= 2 ? parts[parts.length - 2] : parts[0]
    return name.charAt(0).toUpperCase() + name.slice(1)
  } catch {
    return 'Web'
  }
}
