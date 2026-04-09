# Tickr — Investment Intelligence Platform

## Project Overview

Tickr is a web app that captures a user's investment thesis (goals, risk profile, sectors, strategy) and uses an AI agent to monitor market events, generate thesis-aligned trade ideas, and present them as a concise TL;DR feed. No trade execution — research and recommendations only.

## Product Scope

- US stocks only (NYSE + NASDAQ). No international, forex, or crypto for MVP.
- Trade ideas are TL;DR format — concise, scannable, max 15-20 seconds to read when expanded. Not research reports.
- Every trade idea must cite its sources with clickable links (news articles, data) that open in a new browser tab. Sources come from Finnhub news and Tavily search results — the LLM only cites sources we actually retrieved, never fabricated URLs.
- Ticker search uses Finnhub's /search endpoint with debounce, filtered to US Common Stock only (no dots in symbol, displaySymbol === symbol).
- Logo is "tickr" in all lowercase, rendered in Noto Serif italic bold.

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL + Auth + Row Level Security)
- **LLM:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Web Search:** Tavily API
- **Market Data & News:** Finnhub API (free tier, 60 calls/min rate limit)
- **Fonts:** Inter (body), Noto Serif (logo/headings), JetBrains Mono (monospace)
- **Deployment:** Vercel
- **Cron:** Vercel Cron Jobs (vercel.json)

## Design Direction

Light minimalist theme. Key design tokens (from tailwind.config.ts):

- `tickr-bg: #FAFAFA` — page background
- `tickr-surface: #FFFFFF` — card/surface background
- `tickr-text: #1a1a1a` — primary text
- `tickr-secondary: #6b6b6b` — secondary text
- `tickr-muted: #9a9a9a` — placeholder/muted text
- `tickr-border: #E8E8E8` — borders
- `tickr-border-light: #F0F0F0` — light borders
- Border radius: `rounded-[10px]` on buttons, inputs, and cards
- See `/design/wireframes.jsx` for full visual mockups of all screens. Match exact colors, typography, spacing, and component styles.

## Architecture Principles

- Server components by default; client components only when interactivity is needed
- All API keys in environment variables, never hardcoded
- All database access through Supabase client with RLS enabled
- Agent logic lives in `/lib/agent/` — separated from UI
- Every agent run is logged to the `agent_runs` table for future analysis
- User interactions (views, dismissals, saves, feedback) are logged to `user_actions` table
- All Finnhub and Tavily API calls are cached in `api_cache` table with configurable TTLs
- Finnhub rate limiting via token bucket (60 calls/min)

## Database Schema (Supabase)

Migrations in `/supabase/migrations/`. Tables:

| Table | Purpose |
|---|---|
| `user_profiles` | 1:1 with auth.users. Stores thesis: goals, risk tolerance (1-10), time horizon, sectors, industries, strategies, tickers, experience level, constraints. Auto-created on signup via trigger. |
| `watchlist_items` | User's tracked tickers. Fields: ticker, notes, added_at. |
| `positions` | Manually logged trades. Fields: ticker, shares, entry_price, entry_date, notes. |
| `trade_ideas` | AI-generated ideas + earnings digests. card_type='trade_idea' or 'earnings_digest'. Fields: ticker, direction (buy/sell/hold), headline, event_summary, reasoning (jsonb), risks (jsonb), sources (jsonb), confidence_score, time_horizon, status (active/dismissed/saved/expired), extra_data (jsonb for earnings digest fields). |
| `agent_runs` | Full audit log of every pipeline execution. Stores trigger_type, thesis snapshot, search queries, retrieved data, LLM prompt/response/model/latency/tokens, success/error. |
| `digests` | Daily briefings. Fields: greeting, sections (jsonb), watch_today, sources (jsonb). |
| `user_actions` | Interaction tracking. action_type: view, expand, save, dismiss, thumbs_up, thumbs_down, share, digest_thumbs_up, digest_thumbs_down. |
| `price_snapshots` | Price tracking for outcome analysis. snapshot_type: generation, 1d, 1w, 1m. |
| `api_cache` | Shared cache for Finnhub/Tavily responses. Keyed by cache_key, TTL via expires_at. Service role only (no user RLS). |
| `thesis_history` | Audit trail of profile changes. Stores changed_fields and full snapshot. |

- All tables have RLS policies scoped to `auth.uid()` (except `api_cache` — service role only)
- Auto-created trigger: `on_auth_user_created` inserts a `user_profiles` row
- Auto-updated trigger: `updated_at` on `user_profiles`
- Cleanup function: `cleanup_expired_cache()` for expired `api_cache` rows

## File Structure

```
app/
  page.tsx                              — Landing page (public)
  layout.tsx                            — Root layout (Inter + Noto Serif + JetBrains Mono fonts, Analytics)
  error.tsx, global-error.tsx, not-found.tsx
  (auth)/
    login/page.tsx                      — Login form (client component)
    signup/page.tsx                     — Signup form with password confirmation (client component)
  (dashboard)/
    feed/page.tsx                       — Main trade ideas feed
    watchlist/page.tsx                  — Watchlist management + positions
    profile/page.tsx                    — User profile + thesis editor + outcome stats
    settings/page.tsx                   — App settings
  onboarding/
    page.tsx                            — Onboarding wizard wrapper
    actions.ts                          — Server action: saveThesis (validates, saves, auto-populates watchlist)
  api/
    auth/sign-out/route.ts              — POST: server-side sign out + cookie clearing
    feed/route.ts                       — GET: paginated trade ideas feed
    ideas/[id]/route.ts                 — GET/PATCH: single trade idea (status updates)
    digest/route.ts                     — GET: latest digest
    digest/generate/route.ts            — POST: generate daily digest
    agent/run/route.ts                  — POST: trigger agent pipeline manually
    actions/route.ts                    — POST: log user actions (view, save, dismiss, feedback)
    search/route.ts                     — GET: Finnhub symbol search (debounced from client)
    market/news/route.ts                — GET: market/company news
    market/quote/route.ts               — GET: real-time quote
    market/search/route.ts              — GET: symbol search (alternate route)
    watchlist/route.ts                  — GET/POST: list/add watchlist items
    watchlist/[id]/route.ts             — DELETE: remove watchlist item
    watchlist/[id]/positions/route.ts   — GET/POST: positions for a watchlist ticker
    watchlist/positions/[positionId]/route.ts — PATCH/DELETE: update/remove a position
    watchlist/peers/route.ts            — GET: similar stock suggestions (Finnhub peers)
    profile/route.ts                    — GET/PATCH: user profile + thesis history logging
    profile/change-password/route.ts    — POST: password change
    profile/delete-account/route.ts     — POST: full account deletion (service role)
    profile/export/route.ts             — GET: export user data
    cron/generate-ideas/route.ts        — Cron: run agent pipeline for all users (every 6h)
    cron/generate-digests/route.ts      — Cron: generate daily digests (noon daily)
    cron/price-snapshots/route.ts       — Cron: capture price snapshots for outcome tracking (6pm daily)
    cron/cache-cleanup/route.ts         — Cron: purge expired api_cache rows (every 6h at :30)

components/
  SignOutButton.tsx                     — Sign out with scope:'global' + server-side cleanup
  Analytics.tsx                         — Analytics wrapper
  feed/
    FeedClient.tsx                      — Main feed container (client)
    FeedCard.tsx                        — Card dispatcher (trade idea vs earnings digest)
    TradeIdeaCard.tsx                   — Trade idea card with citations, direction badge, action buttons
    EarningsDigestCard.tsx              — Earnings digest card
    ActionButtons.tsx                   — Save/dismiss/thumbs up/down
    DirectionBadge.tsx                  — Buy/sell/hold badge
    TickerMeta.tsx                      — Ticker + price display
    TopNav.tsx                          — Feed navigation bar
    EmptyState.tsx                      — Empty feed prompt
    FeedSkeleton.tsx                    — Loading skeleton
  digest/
    DigestView.tsx                      — Daily briefing display
  onboarding/
    OnboardingWizard.tsx                — Multi-step thesis capture wizard
    CardSelect.tsx                      — Card-based multi-select
    ChipSelect.tsx                      — Chip-based multi-select
    RiskSlider.tsx                      — Risk tolerance slider (1-10)
    TickerSearch.tsx                    — Debounced Finnhub ticker search
    TickerSuggestions.tsx               — Auto-suggested tickers based on sector/industry
  profile/
    ProfileClient.tsx                   — Profile page with thesis editor + outcome analysis
  watchlist/
    WatchlistClient.tsx                 — Watchlist + positions management

lib/
  agent/
    pipeline.ts                         — Main orchestrator: runs trade ideas + earnings digests in parallel
    eventDetector.ts                    — Fetch news from Finnhub, score relevance, auto-tune threshold, group by ticker
    dataEnricher.ts                     — Fetch quote, profile, candles, Tavily context; compute ticker metrics
    ideaGenerator.ts                    — Call Claude to generate trade idea from enriched data
    earningsTrigger.ts                  — Check earnings calendar, skip already-digested, trigger earningsDigester
    earningsDigester.ts                 — Fetch transcript + analyst data, call Claude for plain-English digest
    digestGenerator.ts                  — Generate daily conversational briefing from market news
    prompts.ts                          — All system prompts + user prompt builders
  analytics/
    outcomes.ts                         — Price outcome analysis: direction correctness, return %, accuracy stats
  cache/
    client.ts                           — get/set/invalidate/cleanup against api_cache table (service role)
    ttl.ts                              — TTL constants (quote: 2min, profile: 24h, news: 15min, search: 1h, etc.)
  cron/
    auth.ts                             — verifyCronSecret: Bearer token auth for cron routes
  data/
    tickerSuggestions.ts                — Static sector→ticker and industry→ticker mappings for onboarding suggestions
  finnhub/
    client.ts                           — Full Finnhub wrapper: searchSymbol, getQuote, getCompanyProfile, getCompanyNews, getMarketNews, getCandles, getEarningsCalendar, getEarningsTranscript, getRecommendationTrends, getPriceTarget, getUpgradeDowngrade, getEpsEstimates, getPeers. All cached.
    rateLimiter.ts                      — Token bucket rate limiter (60 tokens/60s)
  supabase/
    client.ts                           — Browser client (createBrowserClient)
    server.ts                           — Server client (createServerClient with cookies)
    middleware.ts                       — Auth middleware: session validation via getUser(), auth route clearing, onboarding gate, 7-day cookie maxAge
    service.ts                          — Service role client (singleton, for admin/cron operations)
  tavily/
    client.ts                           — Tavily search wrapper with caching
  parseCitations.tsx                    — Parse [1][2] citation markers into clickable <a> links

types/
  Agent.ts                              — DetectedEvent, TickerEventGroup, EnrichedEvent, EnrichedTickerGroup, EnrichedEarningsData, TradeIdeaLLMResponse, EarningsDigestLLMResponse, LLMCallMetadata, PipelineResult
  Feed.ts                               — Feed item types, DigestRow, Source
  Finnhub.ts                            — Raw Finnhub API types + normalized app types (Quote, CompanyProfile, NewsArticle, etc.)
  Tavily.ts                             — TavilySearchResult, TavilySearchResponse, TavilySearchOptions
  Thesis.ts                             — WizardData (onboarding form shape)
  Watchlist.ts                          — WatchlistItem, Position types
```

## Agent Pipeline (Trade Ideas)

1. **Event Detection** (`eventDetector.ts`): Fetch company news for each watchlist ticker + general/merger market news from Finnhub. Dedup by article ID.
2. **Relevance Scoring**: Score each article against user thesis (watchlist match +0.4, sector +0.3, industry +0.2, strategy keywords +0.2, recency +0.1).
3. **Auto-Tuning Threshold**: Start at 0.15 threshold. If fewer than 3 events pass, progressively lower by 0.05 steps down to 0.05 minimum. Ensures the pipeline always has enough signal.
4. **Event Aggregation**: Group passing events by primary ticker (`groupEventsByTicker`). Cap at 10 ticker groups, sorted by max relevance. This ensures one idea per ticker — no contradictory signals.
5. **Data Enrichment** (`dataEnricher.ts`): Per ticker group, fetch quote, company profile, 30-day candles, and Tavily search results in parallel. Compute momentum metrics (week/month change, relative volume, distance from highs/lows). Build deduped source list.
6. **Idea Generation** (`ideaGenerator.ts`): Pass enriched ticker group + thesis to Claude. Prompt requires plain-English metrics (never raw numbers), cited sources, and `has_idea: false` if no actionable signal. Validates JSON response schema.
7. **Logging**: Store agent_run (full audit) + trade_idea in database.

## Earnings Digest Pipeline

1. **Calendar Check** (`earningsTrigger.ts`): Query Finnhub earnings calendar for past 48 hours. Filter to watchlist tickers with actual EPS reported. Skip already-digested tickers.
2. **Data Collection** (`earningsDigester.ts`): Fetch in parallel: earnings transcript, quote, company profile, recommendation trends, price targets, upgrade/downgrades, EPS estimates, Tavily analyst commentary.
3. **Digest Generation**: Claude translates everything into plain English — no jargon, no unexplained acronyms. Includes management tone, analyst consensus, thesis connection.
4. **Storage**: Saved as `card_type='earnings_digest'` in `trade_ideas` table with extra_data for earnings-specific fields.
5. **Triggers**: Runs in parallel with trade ideas pipeline (both via cron every 6h and manual "Generate Ideas" button).

## Daily Digest Pipeline

1. Fetch 10 general market news + up to 3 articles per watchlist ticker (top 5 tickers) from Finnhub.
2. Build source list (max 20 articles, deduped by URL).
3. Pass to Claude with conversational digest prompt — 2nd person, narrative threads, 300-400 words max.
4. Save to `digests` table + log `agent_run`.

## Ticker Suggestions Mapping

`lib/data/tickerSuggestions.ts` maps sectors and industries to popular US tickers for onboarding auto-population:

- **Sectors**: Technology, Healthcare, Energy, Finance, Consumer, Real Estate, Industrials, Materials, Utilities, Communication Services
- **Industries**: AI/Machine Learning, Electric Vehicles, Biotech/Pharma, Semiconductors, Cloud Computing, Renewable Energy, Fintech, E-commerce, Social Media, Space/Aerospace, Cannabis, Cybersecurity, Gaming, Real Estate/REITs, Blockchain/Web3

Used by `getSuggestedTickers()` during onboarding and by `saveThesis()` server action to auto-populate watchlist for new users.

## Cron Jobs (vercel.json)

| Schedule | Route | Purpose |
|---|---|---|
| Daily 6 AM UTC (`0 6 * * *`) | `/api/cron/price-snapshots` | Capture prices for outcome tracking |
| Daily 11 AM UTC / 7 AM ET (`0 11 * * *`) | `/api/cron/generate-digests` | Generate daily briefings |
| Daily 12 PM UTC / 8 AM ET (`0 12 * * *`) | `/api/cron/generate-ideas` | Run agent pipeline for all users |
| Daily midnight UTC (`0 0 * * *`) | `/api/cron/cache-cleanup` | Purge expired api_cache rows |

All cron routes authenticate via `CRON_SECRET` Bearer token.

## Auth Flow

- **Middleware** (`lib/supabase/middleware.ts`): Validates sessions via `supabase.auth.getUser()` (server-side, not just JWT trust). Auth routes (`/login`, `/signup`) always clear cookies and show the form — never auto-redirect to feed. Protected routes redirect to `/` if no valid session. Session cookies have 7-day maxAge.
- **Onboarding gate**: Authenticated users without completed onboarding (no `investment_goals`) are redirected to `/onboarding`.
- **Sign out**: `scope: 'global'` revocation + server-side `/api/auth/sign-out` route for reliable cookie clearing.
- **Landing page** (`/`): Passes through middleware without any Supabase interaction.

## Cache Layer

All external API calls go through `lib/cache/client.ts` backed by the `api_cache` Supabase table (service role only). TTLs in `lib/cache/ttl.ts`:

| Data | TTL |
|---|---|
| Quote | 2 min |
| Company profile | 24h |
| News | 15 min |
| Symbol search | 24h |
| General search | 1h |
| Candles | 1h |
| Analyst data (recommendations, price targets, upgrades, EPS) | 6h |
| Earnings transcript | 24h |
| Peers | 24h |

## Source Citations

- `lib/parseCitations.tsx` converts `[1]` `[2]` markers in LLM output into clickable superscript links.
- Sources are built during data enrichment (Finnhub article URLs + Tavily result URLs), passed to LLM as numbered list, and stored in the `sources` jsonb column.
- LLM prompts explicitly forbid fabricating URLs — only cite provided sources.

## Feed Interaction Behaviors

Card interactions are managed in `FeedClient.tsx` with local state; each action also fires a server-side API call. Rules:

### Save (bookmark)
- **Toggle in-place**: clicking the bookmark toggles the idea between `active` and `saved` status. The card **stays in the For You feed** either way — it does not disappear.
- **Visual state**: bookmark icon is filled red (`#C4342D`) when saved, grey outline when not saved.
- **Saved tab**: cached tab data is invalidated on any toggle so the Saved tab re-fetches on next visit.
- API: `PATCH /api/ideas/[id]` with `{ status: 'saved' | 'active' }`.

### Thumbs Up
- **Toggleable**: first click sets `thumbs_up` (POST to `/api/actions`); second click undoes it (DELETE to `/api/actions`).
- **Visual state**: icon is filled dark (`#1a1a1a`) when active, grey outline when not.
- Setting thumbs-up on a card that has thumbs-down clears the opposite (server handles deduplication via upsert).

### Thumbs Down + Feedback Dropdown
- **First click**: opens a feedback dropdown (options: Wrong sector, Bad timing, Already holding, Too risky, Not enough upside, Other). Clicking outside closes it without action.
- **Selecting a reason**: logs `thumbs_down` action with `feedback_reason`, then immediately dismisses the idea — fades out (300ms opacity transition) and removes from For You feed. Dismissed tab cache is invalidated.
- **After selection**: thumbs-down icon stays filled (persisted in `feedbackMap`); clicking again is a no-op (already dismissed).
- **Z-index layering**: `ActionButtons` wrapper gets `zIndex: 50` when dropdown is open. `FeedClient` tracks `activeFeedbackId` and gives that card's container `zIndex: 50` so the dropdown floats above adjacent cards.

### Dismiss (X button)
- Only shown in **expanded card view** (`showDismiss` prop).
- Removes the idea from the For You feed immediately (no fade). Sets status to `dismissed`.

### Expand / Collapse
- Clicking a collapsed card calls `onExpand`; clicking the headline of an expanded card collapses it.
- Only one card is expanded at a time (`expandedId` state).
- Dismissing or thumbs-downing a card also collapses it if it was expanded.

## Outcome Analysis

`lib/analytics/outcomes.ts` tracks idea accuracy:
- Compares `price_at_generation` with latest `price_snapshot` for each trade idea.
- Calculates return %, direction correctness (buy correct if price went up, sell if down, hold = null).
- Aggregates per-user accuracy stats for the profile page.

## Code Conventions

- Named exports (except page components which use default export)
- `async/await` over `.then()` chains
- `try/catch` with specific error types, never swallow errors
- API routes in `/app/api/` follow RESTful conventions
- Components in `/components/` with PascalCase filenames
- Utilities in `/lib/` with camelCase filenames
- Types in `/types/` with PascalCase filenames
- Supabase service client uses `(supabase as any)` cast for table access (typed externally)
- LLM responses parsed with `extractJson()` helper that handles raw JSON, fenced code blocks, and brace extraction

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL          — Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     — Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY         — Supabase service role key (server-side only)
ANTHROPIC_API_KEY                 — Claude API key
FINNHUB_API_KEY                   — Finnhub API key
TAVILY_API_KEY                    — Tavily search API key
CRON_SECRET                       — Bearer token for cron route auth
```

## Important Notes

- Never store API keys in code — use `.env.local`
- The agent should never give specific financial advice — frame everything as "ideas to research further"
- Include disclaimers on trade ideas: "This is not financial advice"
- LLM prompts require plain-English explanations of all financial metrics — never raw numbers without context
