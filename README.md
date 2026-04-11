# tickr

AI-native investment research platform. Set your investment thesis, and tickr's AI agent monitors the market, spots opportunities, and delivers personalized trade ideas with cited sources.

**US stocks only (NYSE + NASDAQ). Research and recommendations only — no trade execution.**

## Features

- **Guided thesis capture** — a 13-step onboarding wizard collects goals, risk tolerance, sectors, industries, strategies, constraints, and tickers.
- **Custom thesis in your own words** — the final onboarding step is a free-text box where you tell tickr anything else it should know (themes you're watching, stories you believe in, what to avoid). This context is threaded verbatim into every LLM call, so trade ideas and digests reflect your actual thinking — not just checkboxes. You can edit it anytime from your Profile.
- **For You feed** — AI-generated trade ideas as scannable TL;DR cards with cited sources.
- **Earnings digests** — plain-English summaries of earnings reports for tickers on your watchlist.
- **Daily briefing** — a conversational morning digest of what matters for your thesis.
- **Watchlist + positions** — track tickers and log manual trades for outcome analysis.
- **Thesis evolution** — every edit to your thesis is logged so you can see how your thinking has changed.

## Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS
- **Database/Auth:** Supabase (PostgreSQL + Auth + RLS)
- **LLM:** Anthropic Claude API
- **Market Data:** Finnhub API
- **Web Search:** Tavily API
- **Deployment:** Vercel

## Local Development

### Prerequisites

- Node.js 18+
- npm
- A Supabase project with the schema applied (see `CLAUDE.md` for table details)
- API keys for Anthropic, Finnhub, and Tavily

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in your API keys in .env.local

# Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only, used by the agent pipeline and cron jobs) |
| `ANTHROPIC_API_KEY` | Anthropic API key (for Claude) |
| `FINNHUB_API_KEY` | Finnhub API key (market data + news) |
| `TAVILY_API_KEY` | Tavily API key (web search for enrichment) |
| `CRON_SECRET` | Bearer token that authenticates Vercel cron route calls |

### Scripts

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint
```

## Architecture

```
/app
  /api              API routes (RESTful)
  /(auth)           Login, signup pages
  /(dashboard)      Feed, watchlist, profile, settings
  /onboarding       Thesis capture wizard
/components
  /feed             Trade idea cards, feed UI
  /digest           Daily briefing components
  /onboarding       Wizard step components
  /watchlist         Watchlist management
/lib
  /agent            AI agent pipeline (event detection, idea generation)
  /cache            API response caching (backed by Supabase api_cache table)
  /supabase         Supabase client helpers
  /finnhub          Finnhub API wrapper
  /tavily           Tavily API wrapper
/types              TypeScript type definitions
```

### Core Pipelines

**Agent Pipeline:** Event detection (Finnhub news) -> Relevance filtering -> Data enrichment (Tavily) -> Idea generation (Claude) -> Trade idea cards in feed

**Digest Pipeline:** Aggregate Finnhub articles for user's sectors/watchlist -> Claude synthesizes into conversational daily briefing

**Earnings Digest:** Check earnings calendar -> Pull transcripts + analyst data -> Claude translates into plain-English earnings digest

### Cron Jobs (Vercel)

| Schedule | Endpoint | Purpose |
|---|---|---|
| Daily 6 AM UTC | `/api/cron/price-snapshots` | Snapshot watchlist prices for outcome tracking |
| Daily 11 AM UTC / 7 AM ET | `/api/cron/generate-digests` | Generate daily digest briefings |
| Daily 12 PM UTC / 8 AM ET | `/api/cron/generate-ideas` | Run the agent pipeline for all users |
| Daily midnight UTC | `/api/cron/cache-cleanup` | Purge expired `api_cache` rows |

All cron endpoints authenticate via the `CRON_SECRET` Bearer token.

## Deployment

The app is configured for Vercel deployment:

1. Connect your GitHub repo to Vercel
2. Add all environment variables from `.env.local.example` to Vercel project settings
3. Cron jobs are configured in `vercel.json`
4. Deploy

## Disclaimer

tickr is a research tool, not a financial advisor. All trade ideas are AI-generated and for informational purposes only. Always do your own research before making investment decisions.
