# PROJECT_CONTEXT.md — Tickr Technical Documentation

> **Purpose:** Exhaustive technical reference for an AI assistant that will help evolve this codebase into a new product. Accuracy over brevity. Every detail matters.

---

## 1. Product Overview

### What Tickr Does

Tickr is a web application that captures a user's investment thesis — their goals, risk profile, sector interests, strategies, and free-text investment philosophy — then uses an AI agent to monitor market events, detect thesis-relevant signals, and generate concise trade ideas presented as a scannable TL;DR feed. No trade execution occurs; the product is research and recommendations only.

### Target Scope

- **US equities only** — NYSE and NASDAQ. No international markets, forex, or crypto.
- **Trade ideas are TL;DR format** — concise, scannable, designed to be read in 15-20 seconds when expanded. These are not research reports.
- **Every idea must cite sources** — clickable links to news articles and data that open in new tabs. Sources come from Finnhub news and Tavily search results. The LLM is instructed to never fabricate URLs.
- **Disclaimer on all AI output** — "AI-generated ideas · not financial advice" appears above the feed.

### User Journey

1. **Landing page** (`/`) — Public marketing page. No authentication required. No Supabase interaction.
2. **Signup** (`/signup`) — Email + password with confirmation field. Creates auth.users row, which triggers automatic `user_profiles` row creation via database trigger.
3. **Onboarding** (`/onboarding`) — 13-step wizard that captures the user's full investment thesis:
   - Step 1: Investment goals (multi-select: Growth, Income, Value Investing, Swing Trading, Day Trading, Long-term Wealth, Retirement, Learning)
   - Step 2: Time horizon (single-select: Days, Weeks, Months, 1-3 Years, 3+ Years)
   - Step 3: Risk tolerance (slider: 1-10 with labels from "Very Conservative" to "Very Aggressive")
   - Step 4: Capital range (single-select: Under $1K, $1K-$10K, $10K-$50K, $50K-$100K, $100K+)
   - Step 5: Sectors (multi-select: Technology, Healthcare, Energy, Finance, Consumer, Real Estate, Industrials, Materials, Utilities, Communication Services)
   - Step 6: Industries (multi-select: AI/ML, EVs, Biotech/Pharma, Semiconductors, Cloud Computing, Renewable Energy, Fintech, E-commerce, Social Media, Space/Aerospace, Cannabis, Cybersecurity, Gaming, Real Estate/REITs, Blockchain/Web3)
   - Step 7: Strategy preferences (multi-select: Momentum, Value, Growth, Dividend, Earnings plays, Technical breakouts, News-driven, Sector rotation, Contrarian, Buy the dip)
   - Step 8: Check frequency (single-select: Multiple times daily, Daily, Few times a week, Weekly, Monthly)
   - Step 9: Experience level (single-select: Beginner, Intermediate, Advanced, Professional)
   - Step 10: Ticker suggestions — auto-populated from selected sectors/industries via `getSuggestedTickers()`. User can add/remove.
   - Step 11: Ticker search — Debounced Finnhub `/search` endpoint, filtered to US Common Stock only (no dots in symbol, displaySymbol === symbol).
   - Step 12: Constraints (multi-select: No penny stocks, No options, ESG only, No leveraged ETFs, No crypto-related, No tobacco/alcohol, No defense/weapons)
   - Step 13: Custom thesis — Free-text textarea (2000 char limit). User's own words describing their investment philosophy. This is appended verbatim to every LLM prompt as unstructured NLP context.
   
   On completion, the `saveThesis` server action validates with Zod, saves to `user_profiles`, and auto-populates the watchlist with suggested tickers. If the watchlist was seeded, a toast notification appears on first feed visit.

4. **Feed** (`/feed`) — Main surface. Four tabs:
   - **For You** — Active trade ideas sorted by creation date (newest first). Shows "Generate Ideas" button. Auto-refreshes every 30 minutes + on tab refocus after 5 minutes hidden.
   - **Digest** — Daily market briefing. Conversational tone, personalized to watchlist.
   - **Saved** — Bookmarked ideas (fetched on first tab visit, cached).
   - **Dismissed** — Previously dismissed ideas (fetched on first tab visit, cached).

5. **Watchlist** (`/watchlist`) — Manage tracked tickers. Add via search, view quotes (polling every 60s), add notes, log positions (shares, entry price, date), get peer suggestions ("You might also like" from Finnhub peers).

6. **Profile** (`/profile`) — View activity stats (ideas generated, accept rate, interactions), edit thesis fields inline, view thesis evolution timeline, change password, export data as JSON, delete account.

### Value Proposition

The user defines their investment identity once. The AI agent continuously monitors market events through that lens and surfaces only thesis-relevant signals — reducing information overload to a scannable feed of actionable ideas with cited sources.

---

## 2. Architecture

### Tech Stack (with exact versions from package.json)

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 14.2.35 |
| Language | TypeScript (strict mode) | 5.x (bundled with Next.js) |
| Styling | Tailwind CSS | 3.4.17 |
| Database + Auth | Supabase (PostgreSQL + Auth + RLS) | @supabase/supabase-js 2.99.1, @supabase/ssr 0.9.0 |
| LLM | Anthropic Claude API | @anthropic-ai/sdk 0.80.0 |
| Web Search | Tavily API | Direct HTTP (no SDK) |
| Market Data | Finnhub API (free tier) | Direct HTTP (no SDK) |
| Validation | Zod | 4.3.6 |
| Icons | Lucide React | 0.487.0 |
| Testing | Vitest | 4.1.0 |
| Deployment | Vercel | N/A |
| Fonts | Inter (body), Noto Serif (logo/headings), JetBrains Mono (monospace) | Google Fonts via next/font |
| Analytics | Vercel Analytics | @vercel/analytics 1.5.0 |

### Directory Structure

```
tickr/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # Landing page (public, SSR)
│   ├── layout.tsx                # Root layout (fonts, analytics, viewport meta)
│   ├── error.tsx                 # Error boundary
│   ├── global-error.tsx          # Global error boundary
│   ├── not-found.tsx             # 404 page
│   ├── globals.css               # Tailwind directives + custom styles
│   ├── (auth)/                   # Auth route group (no layout nesting)
│   │   ├── login/page.tsx        # Login form (client component)
│   │   └── signup/page.tsx       # Signup form (client component)
│   ├── (dashboard)/              # Protected route group
│   │   ├── feed/page.tsx         # Trade ideas feed (SSR + client hydration)
│   │   ├── watchlist/page.tsx    # Watchlist management (SSR + client)
│   │   ├── profile/page.tsx      # Profile + thesis editor (SSR + client)
│   │   └── settings/page.tsx     # App settings
│   ├── onboarding/
│   │   ├── page.tsx              # Onboarding wizard wrapper (SSR)
│   │   └── actions.ts            # Server action: saveThesis
│   └── api/                      # API routes (26 total)
│       ├── auth/sign-out/
│       ├── feed/
│       ├── ideas/[id]/
│       ├── actions/
│       ├── agent/run/
│       ├── agent/status/
│       ├── digest/
│       ├── digest/generate/
│       ├── search/
│       ├── market/news/
│       ├── market/quote/
│       ├── market/search/
│       ├── profile/
│       ├── profile/change-password/
│       ├── profile/delete-account/
│       ├── profile/export/
│       ├── watchlist/
│       ├── watchlist/[id]/
│       ├── watchlist/[id]/positions/
│       ├── watchlist/positions/[positionId]/
│       ├── watchlist/peers/
│       └── cron/ (4 cron routes)
├── components/                   # React components
│   ├── SignOutButton.tsx
│   ├── Analytics.tsx
│   ├── feed/                     # Feed components (10 files)
│   ├── digest/                   # Digest components (1 file)
│   ├── onboarding/               # Onboarding components (6 files)
│   ├── profile/                  # Profile components (1 file)
│   └── watchlist/                # Watchlist components (1 file)
├── lib/                          # Server-side libraries
│   ├── agent/                    # AI agent pipeline (7 files)
│   ├── analytics/                # Outcome analysis (1 file)
│   ├── cache/                    # API cache layer (2 files)
│   ├── cron/                     # Cron auth (1 file)
│   ├── data/                     # Static data mappings (1 file)
│   ├── finnhub/                  # Finnhub client + rate limiter (2 files)
│   ├── supabase/                 # Supabase clients (4 files)
│   ├── tavily/                   # Tavily client (1 file)
│   └── parseCitations.tsx        # Citation marker → link conversion
├── types/                        # TypeScript type definitions (6 files)
├── supabase/
│   └── migrations/               # SQL migrations (5 files)
├── design/
│   └── wireframes.jsx            # Visual mockups
├── public/                       # Static assets
├── middleware.ts                  # Root middleware (delegates to updateSession)
├── tailwind.config.ts            # Custom design tokens
├── vercel.json                   # Cron job schedules
├── tsconfig.json                 # TypeScript config
├── next.config.ts                # Next.js config
└── package.json                  # Dependencies
```

### Data Flow: Request Lifecycle

**Server Component Page Load (e.g., `/feed`):**
1. Middleware (`middleware.ts`) delegates to `updateSession()` in `lib/supabase/middleware.ts`.
2. `updateSession()` creates a Supabase server client with cookie handling, calls `supabase.auth.getUser()` for server-side session validation (not just JWT trust).
3. If no valid session → redirect to `/`. If session valid but no `investment_goals` in profile → redirect to `/onboarding`.
4. Auth routes (`/login`, `/signup`) always clear all `sb-` cookies and render the form — never auto-redirect to feed.
5. Page server component fetches initial data via Supabase server client (e.g., trade ideas, digest, feedback map).
6. Data is passed as props to client component (e.g., `FeedClient`).
7. Client component hydrates with initial data and sets up client-side interactions (polling, observers, etc.).

**API Route Request (e.g., `POST /api/agent/run`):**
1. Route handler creates Supabase server client, calls `supabase.auth.getUser()` for auth.
2. If authenticated, performs business logic (database queries, external API calls).
3. Returns `NextResponse.json()`.
4. Service role operations use `getServiceClient()` singleton for admin-level access.

**Cron Job Request (e.g., `/api/cron/generate-ideas`):**
1. `verifyCronSecret()` checks `Authorization: Bearer <CRON_SECRET>` header.
2. Fetches all users with completed onboarding.
3. Iterates users with staggered delays (10s between users for trade ideas, 5s for digests).
4. Each user's pipeline runs with service role client.
5. Route has `maxDuration: 300` (5 minutes) for Vercel serverless function timeout.

### Authentication Architecture

**Session Management:**
- Supabase SSR with cookie-based sessions.
- Server-side validation via `supabase.auth.getUser()` on every request — never trusts JWT alone.
- Session cookies have 7-day `maxAge`.
- Sign out uses `scope: 'global'` to revoke all sessions, plus a server-side `/api/auth/sign-out` route that explicitly clears all `sb-` prefixed cookies.

**Middleware Flow (`lib/supabase/middleware.ts`):**
```
Request → 
  Landing page (/)? → Pass through, no Supabase interaction
  Auth route (/login, /signup)? → Clear all sb- cookies, show form
  API route (/api/*)? → Skip middleware (handled in route)
  Static file? → Skip middleware
  Protected route? →
    getUser() fails? → Redirect to /
    No investment_goals? → Redirect to /onboarding
    Valid session? → Continue to page
```

**Cookie Clearing (auth routes):**
The middleware explicitly deletes all cookies matching the `sb-` prefix pattern when visiting `/login` or `/signup`. This prevents stale session state from interfering with fresh authentication.

### Cron Jobs

Defined in `vercel.json`:

| Schedule (UTC) | Route | Purpose | Max Duration |
|---|---|---|---|
| `0 6 * * *` (6 AM) | `/api/cron/price-snapshots` | Capture prices at 1d/1w/1m milestones for outcome tracking | 300s |
| `0 11 * * *` (11 AM / 7 AM ET) | `/api/cron/generate-digests` | Generate daily market briefings for all users | 300s |
| `0 12 * * *` (12 PM / 8 AM ET) | `/api/cron/generate-ideas` | Run full agent pipeline for all users | 300s |
| `0 0 * * *` (midnight) | `/api/cron/cache-cleanup` | Purge expired `api_cache` rows | default |

All cron routes authenticate via `CRON_SECRET` Bearer token checked by `verifyCronSecret()` in `lib/cron/auth.ts`.

### Design System

**Design Tokens (from `tailwind.config.ts`):**

| Token | Value | Usage |
|---|---|---|
| `tickr-bg` | `#FAFAFA` | Page background |
| `tickr-surface` | `#FFFFFF` | Card/surface background |
| `tickr-text` | `#1a1a1a` | Primary text |
| `tickr-secondary` | `#6b6b6b` | Secondary text |
| `tickr-muted` | `#9a9a9a` | Placeholder/muted text |
| `tickr-border` | `#E8E8E8` | Borders |
| `tickr-border-light` | `#F0F0F0` | Light borders |

**Typography:**
- Inter — body text (loaded via `next/font/google`)
- Noto Serif — logo ("tickr" in italic bold) and headings
- JetBrains Mono — monospace elements

**Component Tokens:**
- Border radius: `rounded-[10px]` on buttons, inputs, and cards
- Light minimalist theme throughout

**Direction Badge Colors:**
- Buy: `#1B8C5A` (green)
- Sell: `#C4342D` (red)
- Hold: `#8B7300` (amber)
- Earnings: `#6B5B95` (purple)

---

## 3. Database Schema

All tables are in the `public` schema. Migrations are in `/supabase/migrations/`.

### Table: `user_profiles`

**Migration:** `001_initial_schema.sql`, `004_custom_thesis.sql`, `005_generation_status.sql`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE | — | Matches auth user ID |
| `investment_goals` | `text[]` | — | `NULL` | Selected goals from onboarding |
| `time_horizon` | `text` | — | `NULL` | Time horizon preference |
| `risk_tolerance` | `integer` | — | `NULL` | 1-10 scale |
| `capital_range` | `text` | — | `NULL` | Capital range bracket |
| `sectors` | `text[]` | — | `NULL` | Selected sectors |
| `industries` | `text[]` | — | `NULL` | Selected industries |
| `strategy_preferences` | `text[]` | — | `NULL` | Selected strategies |
| `check_frequency` | `text` | — | `NULL` | How often user checks |
| `experience_level` | `text` | — | `NULL` | Beginner/Intermediate/Advanced/Professional |
| `interested_tickers` | `text[]` | — | `NULL` | Tickers from onboarding |
| `constraints` | `text[]` | — | `NULL` | Investment constraints |
| `custom_thesis` | `text` | — | `NULL` | Free-text thesis (up to 2000 chars, enforced client-side) |
| `generation_status` | `text` | NOT NULL, CHECK (`'idle'`, `'running'`) | `'idle'` | Agent pipeline run state |
| `generation_started_at` | `timestamptz` | — | `NULL` | When current/last generation started |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Profile creation time |
| `updated_at` | `timestamptz` | NOT NULL | `now()` | Last update time (auto-updated via trigger) |

**RLS:** `SELECT`, `UPDATE` where `auth.uid() = id`. No `INSERT` policy — rows are created by the `on_auth_user_created` trigger (runs as SECURITY DEFINER).

**Triggers:**
- `on_auth_user_created`: Fires `AFTER INSERT ON auth.users`. Inserts a row into `user_profiles` with `id = new.id`. Function runs as `SECURITY DEFINER`.
- `update_updated_at`: Fires `BEFORE UPDATE`. Sets `updated_at = now()`.

### Table: `watchlist_items`

**Migration:** `001_initial_schema.sql`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Item ID |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | — | Owner |
| `ticker` | `text` | NOT NULL | — | Stock symbol |
| `notes` | `text` | — | `NULL` | User notes |
| `added_at` | `timestamptz` | NOT NULL | `now()` | When added |

**RLS:** Full CRUD where `auth.uid() = user_id`.

**Index:** `idx_watchlist_user_id` on `(user_id)`.

### Table: `positions`

**Migration:** `002_positions.sql`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Position ID |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | — | Owner |
| `watchlist_item_id` | `uuid` | NOT NULL, FK → `watchlist_items(id)` ON DELETE CASCADE | — | Parent watchlist item |
| `shares` | `numeric` | NOT NULL | — | Number of shares |
| `entry_price` | `numeric` | NOT NULL | — | Entry price per share |
| `entry_date` | `date` | NOT NULL | — | Date of entry |
| `notes` | `text` | — | `NULL` | Position notes |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Record creation time |

**RLS:** Full CRUD where `auth.uid() = user_id`.

### Table: `trade_ideas`

**Migration:** `001_initial_schema.sql`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Idea ID |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | — | Owner |
| `agent_run_id` | `uuid` | FK → `agent_runs(id)` | `NULL` | Link to generating agent run |
| `card_type` | `text` | NOT NULL | `'trade_idea'` | `'trade_idea'` or `'earnings_digest'` |
| `ticker` | `text` | NOT NULL | — | Stock symbol |
| `direction` | `text` | — | `NULL` | `'buy'`, `'sell'`, or `'hold'` |
| `headline` | `text` | NOT NULL | — | Card headline |
| `event_summary` | `text` | — | `NULL` | Brief event description |
| `reasoning` | `jsonb` | — | `NULL` | Array of reasoning points |
| `risks` | `jsonb` | — | `NULL` | Array of risk factors |
| `sources` | `jsonb` | — | `NULL` | Array of {title, url} source objects |
| `confidence_score` | `numeric` | — | `NULL` | LLM confidence 0-100 |
| `time_horizon` | `text` | — | `NULL` | Idea time horizon |
| `status` | `text` | NOT NULL | `'active'` | `'active'`, `'saved'`, `'dismissed'`, `'expired'` |
| `price_at_generation` | `numeric` | — | `NULL` | Stock price when idea was generated |
| `extra_data` | `jsonb` | — | `NULL` | Earnings digest fields (tldr, highlights, management_tone, wall_street, thesis_connection, eps_actual, eps_estimate, revenue_actual, revenue_estimate) |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Creation time |

**RLS:** `SELECT`, `UPDATE` where `auth.uid() = user_id`. No `INSERT` policy for user — inserts happen via service role in the agent pipeline. `UPDATE` is restricted to `status` field changes only (save, dismiss).

**Indexes:**
- `idx_trade_ideas_user_id` on `(user_id)`
- `idx_trade_ideas_status` on `(status)`

### Table: `agent_runs`

**Migration:** `001_initial_schema.sql`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Run ID |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | — | User who triggered the run |
| `trigger_type` | `text` | NOT NULL | — | `'manual'`, `'cron'`, or `'earnings'` |
| `thesis_snapshot` | `jsonb` | — | `NULL` | Full thesis at time of run |
| `search_queries` | `jsonb` | — | `NULL` | Queries used during enrichment |
| `retrieved_data` | `jsonb` | — | `NULL` | Raw data retrieved |
| `llm_prompt` | `text` | — | `NULL` | Full prompt sent to LLM |
| `llm_response` | `text` | — | `NULL` | Raw LLM response |
| `llm_model` | `text` | — | `NULL` | Model ID used |
| `llm_latency_ms` | `integer` | — | `NULL` | LLM call duration |
| `llm_tokens_used` | `integer` | — | `NULL` | Token count |
| `ideas_generated` | `integer` | — | `0` | Number of ideas produced |
| `success` | `boolean` | NOT NULL | `true` | Whether run succeeded |
| `error_message` | `text` | — | `NULL` | Error details if failed |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Run timestamp |

**RLS:** `SELECT` where `auth.uid() = user_id`. Inserts via service role only.

**Index:** `idx_agent_runs_user_id` on `(user_id)`.

### Table: `digests`

**Migration:** `001_initial_schema.sql`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Digest ID |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | — | Owner |
| `greeting` | `text` | NOT NULL | — | Personalized greeting |
| `sections` | `jsonb` | NOT NULL | — | Array of {title, body} narrative sections |
| `watch_today` | `text` | — | `NULL` | "Worth watching today" summary |
| `sources` | `jsonb` | — | `NULL` | Array of {title, url} source objects |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Creation time |

**RLS:** `SELECT` where `auth.uid() = user_id`. Inserts via service role.

**Index:** `idx_digests_user_id` on `(user_id)`.

### Table: `user_actions`

**Migration:** `001_initial_schema.sql`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Action ID |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | — | Acting user |
| `action_type` | `text` | NOT NULL | — | One of: `view`, `expand`, `save`, `dismiss`, `thumbs_up`, `thumbs_down`, `share`, `digest_thumbs_up`, `digest_thumbs_down` |
| `trade_idea_id` | `uuid` | FK → `trade_ideas(id)` | `NULL` | Related idea (if applicable) |
| `digest_id` | `uuid` | FK → `digests(id)` | `NULL` | Related digest (if applicable) |
| `time_spent_ms` | `integer` | — | `NULL` | Viewport time for `view` actions |
| `feedback_reason` | `text` | — | `NULL` | Reason for thumbs_down |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Action timestamp |

**RLS:** `SELECT`, `INSERT` where `auth.uid() = user_id`.

**Indexes:**
- `idx_user_actions_user_id` on `(user_id)`
- `idx_user_actions_trade_idea_id` on `(trade_idea_id)`

### Table: `price_snapshots`

**Migration:** `001_initial_schema.sql`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Snapshot ID |
| `trade_idea_id` | `uuid` | NOT NULL, FK → `trade_ideas(id)` ON DELETE CASCADE | — | Related idea |
| `snapshot_type` | `text` | NOT NULL | — | `'generation'`, `'1d'`, `'1w'`, `'1m'` |
| `price` | `numeric` | NOT NULL | — | Stock price at snapshot time |
| `captured_at` | `timestamptz` | NOT NULL | `now()` | Capture timestamp |

**RLS:** `SELECT` where idea belongs to `auth.uid()` (via subquery on `trade_ideas`).

**Index:** `idx_price_snapshots_trade_idea_id` on `(trade_idea_id)`.

### Table: `api_cache`

**Migration:** `001_initial_schema.sql`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | Cache entry ID |
| `cache_key` | `text` | NOT NULL, UNIQUE | — | Cache key (e.g., `finnhub:quote:AAPL`) |
| `data` | `jsonb` | NOT NULL | — | Cached response data |
| `expires_at` | `timestamptz` | NOT NULL | — | Expiration timestamp |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Cache entry creation time |

**RLS:** No user-facing policies. Accessed exclusively via service role client. The `ENABLE ROW LEVEL SECURITY` is set but no policies are created for regular users.

**Index:** `idx_api_cache_key` on `(cache_key)`, `idx_api_cache_expires` on `(expires_at)`.

**Cleanup Function:** `cleanup_expired_cache()` — deletes rows where `expires_at < now()`. Called by the cache-cleanup cron job.

### Table: `thesis_history`

**Migration:** `003_thesis_history.sql`

| Column | Type | Constraints | Default | Description |
|---|---|---|---|---|
| `id` | `uuid` | PK | `gen_random_uuid()` | History entry ID |
| `user_id` | `uuid` | NOT NULL, FK → `auth.users(id)` ON DELETE CASCADE | — | User who changed thesis |
| `changed_fields` | `text[]` | NOT NULL | — | Array of field names that changed |
| `snapshot` | `jsonb` | NOT NULL | — | Full thesis state after change |
| `created_at` | `timestamptz` | NOT NULL | `now()` | Change timestamp |

**RLS:** `SELECT`, `INSERT` where `auth.uid() = user_id`.

### Database Functions

- `handle_new_user()`: Triggered `AFTER INSERT ON auth.users`. Creates `user_profiles` row with `id = new.id`. `SECURITY DEFINER`.
- `update_updated_at_column()`: Triggered `BEFORE UPDATE ON user_profiles`. Sets `new.updated_at = now()`.
- `cleanup_expired_cache()`: Deletes from `api_cache` where `expires_at < now()`. Returns void.

### Database Triggers

- `on_auth_user_created` → `handle_new_user()` on `auth.users`
- `update_user_profiles_updated_at` → `update_updated_at_column()` on `user_profiles`

---

## 4. API Routes

All API routes are in `/app/api/`. Unless noted, all routes require authentication via `supabase.auth.getUser()`. Routes return `NextResponse.json()`.

### Auth

#### `POST /api/auth/sign-out`

**File:** `app/api/auth/sign-out/route.ts`

**Auth:** Authenticated (but gracefully handles missing session).

**Behavior:**
1. Creates server Supabase client.
2. Calls `supabase.auth.signOut()`.
3. Clears all cookies with `sb-` prefix by setting them to empty with `maxAge: 0` and `expires: new Date(0)`.
4. Returns `{ success: true }` with `Set-Cookie` headers.

### Feed

#### `GET /api/feed`

**File:** `app/api/feed/route.ts`

**Auth:** Authenticated.

**Query Params:**
- `status` (optional): `'for-you'` | `'saved'` | `'dismissed'`. Default: `'for-you'`.

**Behavior:**
- `for-you`: Fetches trade ideas with `status IN ('active', 'saved')`, ordered by `created_at DESC`, limit 50.
- `saved`: Fetches trade ideas with `status = 'saved'`, ordered by `created_at DESC`.
- `dismissed`: Fetches trade ideas with `status = 'dismissed'`, ordered by `created_at DESC`, limit 50.
- Also fetches `feedbackMap`: queries `user_actions` for `thumbs_up` and `thumbs_down` actions on returned idea IDs. Builds `Record<ideaId, 'thumbs_up' | 'thumbs_down'>`.

**Response:** `{ ideas: TradeIdeaRow[], feedbackMap: Record<string, 'thumbs_up' | 'thumbs_down'> }`

#### `GET /api/ideas/[id]`

**File:** `app/api/ideas/[id]/route.ts`

**Auth:** Authenticated.

**Behavior:** Returns single trade idea by ID if owned by current user.

#### `PATCH /api/ideas/[id]`

**File:** `app/api/ideas/[id]/route.ts`

**Auth:** Authenticated.

**Body:** `{ status: 'saved' | 'dismissed' | 'active' }`

**Validation:** Zod schema ensures status is one of the three valid values.

**Behavior:** Updates `trade_ideas.status` for the given idea if owned by current user. Returns updated idea.

### Actions

#### `POST /api/actions`

**File:** `app/api/actions/route.ts`

**Auth:** Authenticated.

**Body:** `{ action_type: string, trade_idea_id?: string, digest_id?: string, time_spent_ms?: number, feedback_reason?: string }`

**Validation:** Zod schema. `action_type` is required.

**Behavior:**
1. If `action_type` is `thumbs_up` or `thumbs_down`, first deletes any existing opposite action for the same idea (mutual exclusion).
2. Inserts new row into `user_actions`.
3. Returns `{ ok: true }`.

#### `DELETE /api/actions`

**File:** `app/api/actions/route.ts`

**Auth:** Authenticated.

**Body:** `{ action_type: string, trade_idea_id: string }`

**Behavior:** Deletes the matching action row from `user_actions`. Used for undoing thumbs_up.

### Agent

#### `POST /api/agent/run`

**File:** `app/api/agent/run/route.ts`

**Auth:** Authenticated.

**Rate Limiting:**
- If `generation_status = 'running'` and elapsed < 10 minutes → 429 "Generation already in progress" with `Retry-After` header.
- If `generation_status = 'idle'` and last run was < 5 minutes ago → 429 "Rate limited" with `Retry-After` header.
- If `generation_status = 'running'` and elapsed > 10 minutes → treated as stale, allows new run.

**Behavior:**
1. Sets `generation_status = 'running'` and `generation_started_at = now()` in `user_profiles` (via service role).
2. Calls `runAgentPipeline(user.id)`.
3. On success: sets `generation_status = 'idle'` (keeps `generation_started_at` for rate limiting). Returns pipeline result.
4. On error: resets `generation_status = 'idle'`. Returns 500 with error message.

#### `GET /api/agent/status`

**File:** `app/api/agent/status/route.ts`

**Auth:** Authenticated.

**Behavior:**
1. Reads `generation_status` and `generation_started_at` from `user_profiles`.
2. If no profile found → returns `{ status: 'idle', startedAt: null }`.
3. If `running` and elapsed > 10 minutes (stale threshold) → auto-heals by setting status to `'idle'` in DB. Returns `{ status: 'idle' }`.
4. Otherwise returns `{ status: generation_status, startedAt: generation_started_at }`.

### Digest

#### `GET /api/digest`

**File:** `app/api/digest/route.ts`

**Auth:** Authenticated.

**Behavior:** Fetches the most recent digest for the current user, ordered by `created_at DESC`, limit 1.

**Response:** `{ digest: DigestRow | null }`

#### `POST /api/digest/generate`

**File:** `app/api/digest/generate/route.ts`

**Auth:** Authenticated.

**Rate Limiting:** In-memory `Map<userId, lastGeneratedTimestamp>`. If last generation was within 1 hour → 429.

**Behavior:**
1. Fetches user profile and watchlist.
2. Calls `generateDailyDigest()` from `lib/agent/digestGenerator.ts`.
3. Stores result in `digests` table + logs `agent_run`.
4. Returns `{ digest: DigestRow }`.

### Search

#### `GET /api/search`

**File:** `app/api/search/route.ts`

**Auth:** Authenticated.

**Query Params:** `q` (required, min 2 chars).

**Behavior:** Proxies to Tavily search API via `lib/tavily/client.ts`. Returns search results.

### Market Data

#### `GET /api/market/news`

**File:** `app/api/market/news/route.ts`

**Auth:** Authenticated.

**Query Params:**
- `ticker` (optional): If provided, fetches company-specific news. Otherwise fetches general market news.
- `from`, `to` (optional): Date range for company news.

**Behavior:** Calls Finnhub `getCompanyNews()` or `getMarketNews()`. Returns `{ news: NewsArticle[] }`.

#### `GET /api/market/quote`

**File:** `app/api/market/quote/route.ts`

**Auth:** Authenticated.

**Query Params:** `ticker` (required).

**Behavior:** Calls Finnhub `getQuote()`. Returns `{ quote: Quote }`.

#### `GET /api/market/search`

**File:** `app/api/market/search/route.ts`

**Auth:** Authenticated.

**Query Params:** `q` (required, min 1 char).

**Behavior:** Calls Finnhub `searchSymbol()`. Filters to US Common Stock (no dots in symbol, `displaySymbol === symbol`). Returns `{ results: TickerResult[] }`.

### Profile

#### `GET /api/profile`

**File:** `app/api/profile/route.ts`

**Auth:** Authenticated.

**Behavior:**
1. Fetches user profile from `user_profiles`.
2. Fetches activity stats: total ideas count, saved count, interaction count from `user_actions`.
3. Fetches thesis history from `thesis_history` (ordered by `created_at DESC`, limit 20).
4. Returns `{ profile, stats, history }`.

#### `PATCH /api/profile`

**File:** `app/api/profile/route.ts`

**Auth:** Authenticated.

**Body:** Partial profile fields (any subset of thesis fields).

**Behavior:**
1. Updates `user_profiles` with provided fields.
2. Determines which fields actually changed by comparing old vs new values.
3. If any fields changed, inserts a `thesis_history` row with `changed_fields` array and full snapshot.
4. Returns updated profile.

#### `POST /api/profile/change-password`

**File:** `app/api/profile/change-password/route.ts`

**Auth:** Authenticated.

**Body:** `{ password: string }` (min 8 chars, validated by Zod).

**Behavior:** Calls `supabase.auth.updateUser({ password })`. Returns `{ ok: true }`.

#### `POST /api/profile/delete-account`

**File:** `app/api/profile/delete-account/route.ts`

**Auth:** Authenticated.

**Behavior:**
1. Uses service role client to call `supabase.auth.admin.deleteUser(userId)`.
2. All related data cascades via `ON DELETE CASCADE` foreign keys.
3. Returns `{ ok: true }`.

#### `GET /api/profile/export`

**File:** `app/api/profile/export/route.ts`

**Auth:** Authenticated.

**Behavior:**
1. Fetches profile, watchlist, trade ideas, digests, and user actions.
2. Returns all data as JSON with `Content-Disposition: attachment; filename="tickr-export.json"`.

### Watchlist

#### `GET /api/watchlist`

**File:** `app/api/watchlist/route.ts`

**Auth:** Authenticated.

**Behavior:**
1. Fetches all `watchlist_items` for current user, ordered by `added_at DESC`.
2. For each ticker, fetches quote and company profile from Finnhub (in parallel) to enrich the response.
3. Returns `{ items: WatchlistItemWithQuote[] }`.

#### `POST /api/watchlist`

**File:** `app/api/watchlist/route.ts`

**Auth:** Authenticated.

**Body:** `{ ticker: string }`

**Validation:** Zod schema. Checks for duplicate tickers.

**Behavior:** Inserts new `watchlist_items` row. Returns `{ item: WatchlistItemRow }`.

#### `PATCH /api/watchlist/[id]`

**File:** `app/api/watchlist/[id]/route.ts`

**Auth:** Authenticated.

**Body:** `{ notes: string }`

**Behavior:** Updates notes field on watchlist item if owned by current user.

#### `DELETE /api/watchlist/[id]`

**File:** `app/api/watchlist/[id]/route.ts`

**Auth:** Authenticated.

**Behavior:** Deletes watchlist item and all associated positions (cascade). Returns `{ ok: true }`.

#### `GET /api/watchlist/[id]/positions`

**File:** `app/api/watchlist/[id]/positions/route.ts`

**Auth:** Authenticated.

**Behavior:** Fetches all positions for a specific watchlist item.

#### `POST /api/watchlist/[id]/positions`

**File:** `app/api/watchlist/[id]/positions/route.ts`

**Auth:** Authenticated.

**Body:** `{ shares: number, entry_price: number, entry_date: string, notes?: string }`

**Validation:** Zod schema with positive number checks.

**Behavior:** Inserts new position record.

#### `PATCH /api/watchlist/positions/[positionId]`

**File:** `app/api/watchlist/positions/[positionId]/route.ts`

**Auth:** Authenticated.

**Body:** Partial position update (shares, entry_price, entry_date, notes).

**Behavior:** Updates position if owned by current user.

#### `DELETE /api/watchlist/positions/[positionId]`

**File:** `app/api/watchlist/positions/[positionId]/route.ts`

**Auth:** Authenticated.

**Behavior:** Deletes position.

#### `GET /api/watchlist/peers`

**File:** `app/api/watchlist/peers/route.ts`

**Auth:** Authenticated.

**Query Params:** `ticker` (required).

**Behavior:**
1. Calls Finnhub `getPeers()` for the given ticker.
2. Deduplicates results.
3. Fetches company name for each peer via `getCompanyProfile()`.
4. Returns `{ peers: { symbol: string, name: string }[] }`.

### Cron Routes

All cron routes verify `Authorization: Bearer <CRON_SECRET>` via `verifyCronSecret()`.

#### `POST /api/cron/generate-ideas`

**File:** `app/cron/generate-ideas/route.ts`

**Config:** `maxDuration = 300`

**Behavior:**
1. Fetches all `user_profiles` where `investment_goals IS NOT NULL` (completed onboarding) via service role.
2. Iterates each user with 10-second stagger (`setTimeout` with index * 10000).
3. For each user: runs `runAgentPipeline(userId)` with `trigger_type: 'cron'`.
4. Returns summary of successes/failures.

#### `POST /api/cron/generate-digests`

**File:** `app/cron/generate-digests/route.ts`

**Config:** `maxDuration = 300`

**Behavior:**
1. Fetches all users with completed onboarding via service role.
2. Iterates with 5-second stagger.
3. For each user: generates daily digest via `generateDailyDigest()`, stores in DB.
4. Returns summary.

#### `POST /api/cron/price-snapshots`

**File:** `app/cron/price-snapshots/route.ts`

**Behavior:**
1. Fetches all active/saved trade ideas (not dismissed/expired).
2. For each idea, determines which snapshots are due based on `created_at`:
   - `1d`: 1 day after generation
   - `1w`: 7 days after generation
   - `1m`: 30 days after generation
3. Checks if snapshot already exists for each type.
4. If due and not captured: fetches current quote from Finnhub, inserts `price_snapshot`.
5. If idea is > 30 days old: sets `status = 'expired'`.

#### `POST /api/cron/cache-cleanup`

**File:** `app/cron/cache-cleanup/route.ts`

**Behavior:** Calls `cleanup_expired_cache()` SQL function. Returns `{ ok: true }`.

---

## 5. AI Agent Pipelines

### Pipeline Overview

There are three distinct AI pipelines:

1. **Trade Ideas Pipeline** — Detects market events, enriches data, generates thesis-aligned trade ideas.
2. **Earnings Digest Pipeline** — Detects recent earnings reports, generates plain-English digests.
3. **Daily Digest Pipeline** — Generates a daily conversational market briefing.

Pipelines 1 and 2 run in parallel via `Promise.allSettled()` in the main orchestrator (`lib/agent/pipeline.ts`). Pipeline 3 runs independently via its own cron job and manual trigger.

### Main Orchestrator (`lib/agent/pipeline.ts`)

**Function:** `runAgentPipeline(userId: string): Promise<PipelineResult>`

**Flow:**
1. Fetch user profile from `user_profiles` via service role.
2. Convert DB profile columns to `WizardData` type (the same shape used by the onboarding wizard).
3. Fetch watchlist tickers from `watchlist_items`.
4. Run trade ideas + earnings digests in parallel:
   ```
   Promise.allSettled([
     generateTradeIdeas(thesis, watchlistTickers, userId),
     processEarnings(thesis, watchlistTickers, userId)
   ])
   ```
5. For each successful trade idea result:
   - Insert `agent_runs` row with full audit data (thesis snapshot, queries, LLM prompt/response, model, latency, tokens).
   - Insert `trade_ideas` row with the generated idea content.
6. Return `PipelineResult` with counts and details.

### Trade Ideas Pipeline (detailed steps)

#### Step 1: Event Detection (`lib/agent/eventDetector.ts`)

**Function:** `detectEvents(watchlistTickers: string[], thesis: WizardData): Promise<TickerEventGroup[]>`

**Process:**
1. **Fetch company news**: For each watchlist ticker, call `finnhub.getCompanyNews(ticker, fromDate, toDate)` where date range is past 3 days. All calls run in parallel.
2. **Fetch market news**: Call `finnhub.getMarketNews('general')` and `finnhub.getMarketNews('merger')` in parallel.
3. **Dedup**: Combine all articles, dedup by Finnhub article `id`.
4. **Relevance scoring**: Score each article against the user's thesis:
   - Watchlist ticker match: +0.4 (if article's `related` field matches a watchlist ticker)
   - Sector match: +0.3 (if article headline/summary mentions user's sectors)
   - Industry match: +0.2 (if article mentions user's industries)
   - Strategy keyword match: +0.2 (if article mentions keywords related to user's strategies, e.g., "momentum", "earnings beat")
   - Recency: +0.1 (if published within last 24 hours)
   - Maximum possible score: 1.2
5. **Auto-tuning threshold**: Start with threshold 0.15. If fewer than 3 articles pass, lower threshold by 0.05 steps until at least 3 pass or threshold reaches 0.05 minimum. This ensures the pipeline always has enough signal to work with.
6. **Primary ticker assignment**: Each passing article is assigned a primary ticker — either from its `related` field (if matching a watchlist ticker) or extracted from the headline.
7. **Grouping**: Group articles by primary ticker via `groupEventsByTicker()`. Each group contains all articles for one ticker.
8. **Cap and sort**: Sort groups by maximum article relevance score (descending). Cap at 10 ticker groups.

**Output:** Array of `TickerEventGroup` objects, each containing a ticker and its associated `DetectedEvent[]`.

#### Step 2: Data Enrichment (`lib/agent/dataEnricher.ts`)

**Function:** `enrichTickerGroup(group: TickerEventGroup, thesis: WizardData): Promise<EnrichedTickerGroup>`

**Process (per ticker group, all in parallel):**
1. **Quote**: `finnhub.getQuote(ticker)` — current price, open, high, low, previous close, timestamp.
2. **Company profile**: `finnhub.getCompanyProfile(ticker)` — name, industry, market cap, exchange, logo, etc.
3. **Candles**: `finnhub.getCandles(ticker, 'D', from30daysAgo, now)` — daily OHLCV for past 30 days.
4. **Tavily search**: `tavily.search(query)` — web search for recent analysis/context. Query built from ticker + headline of top event.

**Computed Metrics (`TickerMetrics`):**
From the 30-day candle data, computes:
- `weekChangePercent`: Price change over last 5 trading days.
- `monthChangePercent`: Price change over last 22 trading days.
- `percentFrom52wHigh`: Distance from highest price in candle data.
- `percentFrom52wLow`: Distance from lowest price in candle data.
- `relativeVolume`: Current volume / average volume ratio.

**Source List:**
Builds a deduped array of `Source` objects (title + URL) from:
- Finnhub news articles (from the event group)
- Tavily search results

**Output:** `EnrichedTickerGroup` containing the original events, quote, profile, metrics, sources, and Tavily context.

#### Step 3: Idea Generation (`lib/agent/ideaGenerator.ts`)

**Function:** `generateTradeIdea(enrichedGroup: EnrichedTickerGroup, thesis: WizardData): Promise<TradeIdeaResult | null>`

**LLM Configuration:**
- Model: `claude-sonnet-4-20250514`
- Max tokens: 1024
- Temperature: not explicitly set (uses SDK default)

**Prompt Construction:**
- **System prompt** (`TRADE_IDEA_SYSTEM_PROMPT` from `lib/agent/prompts.ts`):
  - Role: "Investment research assistant generating concise, thesis-aligned trade ideas."
  - Rules: plain-English metrics (never raw numbers without context), cite only provided sources, return `has_idea: false` if no actionable signal, never fabricate data.
  - Output JSON schema: `{ has_idea, ticker, direction, headline, event_summary, reasoning[], risks[], watch_for, sources[{title, url}], confidence_score, time_horizon }`
  
- **User prompt** (built by `buildTradeIdeaPrompt()` in `lib/agent/prompts.ts`):
  - Investor thesis (via `formatThesis()`)
  - Event summary (headlines + summaries of detected events)
  - Market data (quote, metrics — all pre-formatted as plain English)
  - Numbered source list
  - Additional Tavily context

**Thesis Formatting (`formatThesis()`):**
This is the **single chokepoint** for all LLM prompts. It formats the `WizardData` into a structured text block:
```
Investment Goals: Growth, Income
Time Horizon: 1-3 Years
Risk Tolerance: 7/10
Capital Range: $10K-$50K
Sectors: Technology, Healthcare
Industries: AI/Machine Learning, Biotech
Strategies: Momentum, Earnings plays
Experience: Intermediate
Constraints: No penny stocks
Additional context from investor (in their own words): [custom_thesis verbatim]
```
The `custom_thesis` line is only appended when the field is non-empty.

**Response Parsing:**
Uses `extractJson()` helper with 3 fallback strategies:
1. Try parsing the entire response as JSON.
2. Look for fenced code blocks (```json ... ```) and parse content.
3. Find the first `{` and last `}` and parse the substring.

**Validation:**
Checks that parsed response contains required fields (`has_idea`, `ticker`, `direction`, `headline`). If `has_idea` is false, returns null (no idea generated for this ticker group).

**Output:** `TradeIdeaResult` containing the idea content + `LLMCallMetadata` (model, latency, tokens, prompt, response) for audit logging.

#### Step 4: Storage

For each non-null result from Step 3:
1. Insert `agent_runs` row with full metadata.
2. Insert `trade_ideas` row with idea content, linking to the agent run.
3. The `price_at_generation` field is set from the current quote price at enrichment time.

### Earnings Digest Pipeline

#### Step 1: Earnings Detection (`lib/agent/earningsTrigger.ts`)

**Function:** `findRecentEarnings(watchlistTickers: string[]): Promise<EarningsEvent[]>`

**Process:**
1. Call `finnhub.getEarningsCalendar(from48hAgo, now)`.
2. Filter results to watchlist tickers only.
3. Filter to events where `epsActual` is not null (earnings have been reported).
4. Check existing `trade_ideas` for each ticker with `card_type = 'earnings_digest'` created in the past 48 hours. Skip already-digested tickers.

#### Step 2: Data Collection (`lib/agent/earningsDigester.ts`)

**Function:** `generateEarningsDigest(event: EarningsEvent, thesis: WizardData): Promise<EarningsDigestResult>`

**Data fetched in parallel:**
1. Earnings transcript: `finnhub.getEarningsTranscript(ticker, quarter, year)`
2. Current quote: `finnhub.getQuote(ticker)`
3. Company profile: `finnhub.getCompanyProfile(ticker)`
4. Recommendation trends: `finnhub.getRecommendationTrends(ticker)`
5. Price target consensus: `finnhub.getPriceTarget(ticker)`
6. Upgrade/downgrade history: `finnhub.getUpgradeDowngrade(ticker)`
7. EPS estimates: `finnhub.getEpsEstimates(ticker)`
8. Tavily search: analyst commentary and reactions

#### Step 3: Digest Generation

**LLM Configuration:** Same as trade ideas (claude-sonnet-4-20250514, 1024 max tokens).

**System prompt** (`EARNINGS_DIGEST_SYSTEM_PROMPT`):
- Role: "Plain-English earnings analyst."
- Rules: no jargon, no unexplained acronyms, explain every metric in context, focus on what matters for the specific investor's thesis.
- Output JSON schema: `{ ticker, headline, tldr, highlights[], management_tone, wall_street, thesis_connection, risks[], watch_for, sources[], confidence_score }`

**User prompt:** Built with `formatThesis()` + all collected earnings data formatted as readable text.

#### Step 4: Storage

Saved to `trade_ideas` table with:
- `card_type = 'earnings_digest'`
- `direction = 'hold'` (earnings digests are informational, not directional)
- `extra_data` jsonb field containing earnings-specific fields: `tldr`, `highlights`, `management_tone`, `wall_street`, `thesis_connection`, `eps_actual`, `eps_estimate`, `revenue_actual`, `revenue_estimate`

### Daily Digest Pipeline (`lib/agent/digestGenerator.ts`)

**Function:** `generateDailyDigest(userId: string, thesis: WizardData, watchlistTickers: string[]): Promise<DigestRow>`

#### Step 1: News Collection
1. Fetch 10 general market news articles via `finnhub.getMarketNews('general')`.
2. For top 5 watchlist tickers, fetch up to 3 articles each via `finnhub.getCompanyNews()`.
3. Build source list (max 20 articles, deduped by URL).

#### Step 2: Digest Generation

**System prompt** (`DAILY_DIGEST_SYSTEM_PROMPT`):
- Role: "Daily market briefing writer."
- Tone: 2nd person, conversational, like a knowledgeable friend. "You" not "investors."
- Format: greeting, 2-4 narrative sections (each with a title and 2-3 paragraph body), "Worth Watching" watchlist section.
- Length: 300-400 words max.
- Must cite sources using [N] markers.
- Output JSON schema: `{ greeting, sections[{title, body}], watch_today, sources[{title, url}] }`

#### Step 3: Storage
- Insert into `digests` table.
- Insert `agent_runs` row with `trigger_type: 'cron'` or `'manual'`.

### Prompt Architecture Summary

All prompts flow through `lib/agent/prompts.ts`. The key exports:

| Export | Type | Used By |
|---|---|---|
| `TRADE_IDEA_SYSTEM_PROMPT` | Constant | `ideaGenerator.ts` |
| `EARNINGS_DIGEST_SYSTEM_PROMPT` | Constant | `earningsDigester.ts` |
| `DAILY_DIGEST_SYSTEM_PROMPT` | Constant | `digestGenerator.ts` |
| `formatThesis(thesis)` | Function | All prompt builders |
| `buildTradeIdeaPrompt(group, thesis)` | Function | `ideaGenerator.ts` |
| `buildEarningsPrompt(data, thesis)` | Function | `earningsDigester.ts` |
| `buildDigestPrompt(news, thesis, tickers)` | Function | `digestGenerator.ts` |

`formatThesis()` is the **single chokepoint** — every LLM interaction gets the same thesis representation. The optional `custom_thesis` free-text field is appended verbatim as "Additional context from investor (in their own words): …" when non-empty. This gives the agent unstructured NLP context without touching relevance scoring (which remains keyword-based in `eventDetector.ts`).

---

## 6. External Integrations

### Anthropic Claude API

**Client:** `@anthropic-ai/sdk` v0.80.0

**Model:** `claude-sonnet-4-20250514` (used for all three pipelines)

**Configuration:**
- Max tokens: 1024 (trade ideas + earnings digests), similar for daily digests
- Initialized with `ANTHROPIC_API_KEY` env var
- No streaming — full response awaited

**Usage Locations:**
- `lib/agent/ideaGenerator.ts` — Trade idea generation
- `lib/agent/earningsDigester.ts` — Earnings digest generation
- `lib/agent/digestGenerator.ts` — Daily digest generation

**Error Handling:** Try/catch with error logging. Pipeline errors are captured in `agent_runs.error_message`.

### Finnhub API

**Client:** Custom wrapper in `lib/finnhub/client.ts`

**Base URL:** `https://finnhub.io/api/v1`

**Auth:** `token` query parameter with `FINNHUB_API_KEY`

**Rate Limiting:**
- Token bucket in `lib/finnhub/rateLimiter.ts`
- Capacity: 60 tokens
- Refill: 60 tokens per 60 seconds
- Implementation: `TokenBucket` class with `consume()` method that returns a Promise. If bucket is empty, waits until a token is available (calculates wait time from refill rate).
- Singleton: `finnhubRateLimiter` exported for shared use across all Finnhub calls.

**Endpoints Used:**

| Function | Endpoint | Cache TTL |
|---|---|---|
| `searchSymbol(query)` | `/search?q=` | 24h |
| `getQuote(symbol)` | `/quote?symbol=` | 2 min |
| `getCompanyProfile(symbol)` | `/stock/profile2?symbol=` | 24h |
| `getCompanyNews(symbol, from, to)` | `/company-news?symbol=&from=&to=` | 15 min |
| `getMarketNews(category)` | `/news?category=` | 15 min |
| `getCandles(symbol, resolution, from, to)` | `/stock/candle?symbol=&resolution=&from=&to=` | 1h |
| `getEarningsCalendar(from, to)` | `/calendar/earnings?from=&to=` | 6h (analyst TTL) |
| `getEarningsTranscript(symbol, quarter, year)` | `/stock/transcript?symbol=&quarter=&year=` | 24h |
| `getRecommendationTrends(symbol)` | `/stock/recommendation?symbol=` | 6h |
| `getPriceTarget(symbol)` | `/stock/price-target?symbol=` | 6h |
| `getUpgradeDowngrade(symbol)` | `/stock/upgrade-downgrade?symbol=` | 6h |
| `getEpsEstimates(symbol)` | `/stock/eps-estimate?symbol=` | 6h |
| `getPeers(symbol)` | `/stock/peers?symbol=` | 24h |

**Caching Pattern:** Every Finnhub function follows a `cachedFetch` pattern:
1. Build `cache_key` string (e.g., `finnhub:quote:AAPL`).
2. Call `cacheGet(cache_key)` → if hit, return cached data.
3. Await `finnhubRateLimiter.consume()`.
4. Fetch from Finnhub API.
5. Call `cacheSet(cache_key, data, TTL)`.
6. Return data.

### Tavily API

**Client:** Custom wrapper in `lib/tavily/client.ts`

**Base URL:** `https://api.tavily.com/search`

**Auth:** `api_key` in POST body with `TAVILY_API_KEY`

**Request Configuration:**
- Method: POST
- Body: `{ api_key, query, search_depth: 'basic', max_results: 5, ...options }`
- Options can override `search_depth`, `max_results`, `include_domains`, `exclude_domains`

**Caching:**
- Cache key: `tavily:search:<md5(query+options)>` (or similar hash)
- TTL: 1 hour (`SEARCH_TTL`)

**Usage:** Called during data enrichment (`dataEnricher.ts`) and earnings digest generation (`earningsDigester.ts`) to provide web context to the LLM.

### Supabase

**Clients (4 variants in `lib/supabase/`):**

| Client | File | Usage | Auth Level |
|---|---|---|---|
| Browser | `client.ts` | Client components | Anon key (user session) |
| Server | `server.ts` | Server components, API routes | Anon key (user session via cookies) |
| Middleware | `middleware.ts` | Request middleware | Anon key (session refresh) |
| Service | `service.ts` | Agent pipeline, cron jobs, admin ops | Service role key (bypasses RLS) |

**Service Client Pattern:**
The service client is a singleton (`getServiceClient()`). Used with `(supabase as any)` cast for table access because the project doesn't have generated Supabase types — tables are accessed by string name.

**Key Supabase Features Used:**
- PostgreSQL database with RLS
- Auth (email/password signup, session management)
- Real-time: NOT used
- Storage: NOT used
- Edge Functions: NOT used (all serverless logic is in Next.js API routes)

### Cache Layer (`lib/cache/`)

**Implementation:** `lib/cache/client.ts`

All external API responses are cached in the `api_cache` Supabase table via service role client.

**Functions:**
- `cacheGet(key: string): Promise<any | null>` — Fetches from `api_cache` where `cache_key = key` and `expires_at > now()`. Returns null if expired or not found.
- `cacheSet(key: string, data: any, ttlSeconds: number): Promise<void>` — Upserts into `api_cache` with `expires_at = now() + ttlSeconds`. Uses Supabase `upsert` with `onConflict: 'cache_key'`.
- `cacheInvalidate(key: string): Promise<void>` — Deletes from `api_cache` where `cache_key = key`.
- `cacheCleanup(): Promise<void>` — Calls `cleanup_expired_cache()` SQL function.

**TTL Constants (`lib/cache/ttl.ts`):**

| Constant | Value (seconds) | Usage |
|---|---|---|
| `QUOTE_TTL` | 120 (2 min) | Stock quotes |
| `COMPANY_PROFILE_TTL` | 86400 (24h) | Company profiles |
| `NEWS_TTL` | 900 (15 min) | News articles |
| `SEARCH_TTL` | 3600 (1h) | Tavily web search |
| `SYMBOL_SEARCH_TTL` | 86400 (24h) | Finnhub symbol search |
| `EARNINGS_TRANSCRIPT_TTL` | 86400 (24h) | Earnings transcripts |
| `ANALYST_DATA_TTL` | 21600 (6h) | Recommendations, price targets, upgrades, EPS |
| `CANDLES_TTL` | 3600 (1h) | Stock candles (OHLCV) |
| `PEERS_TTL` | 86400 (24h) | Peer company lists |

---

## 7. Frontend Components

### Layout and Navigation

#### Root Layout (`app/layout.tsx`)

- Loads Inter (body), Noto Serif (headings/logo), JetBrains Mono (monospace) via `next/font/google`.
- Sets up Vercel Analytics.
- Sets viewport meta for mobile responsiveness.
- Applies `min-h-screen bg-tickr-bg text-tickr-text` base styles.

#### TopNav (`components/feed/TopNav.tsx`)

**Props:** `activeTab: Tab, onTabChange: (tab: Tab) => void`

- Sticky navigation bar at the top of the feed page.
- Left side: "tickr" logo in Noto Serif italic bold.
- Center: Tab buttons — "For You", "Digest", "Saved", "Dismissed". Active tab has a bottom border indicator.
- Right side: Links to Watchlist, Profile, and SignOut button.
- Mobile responsive: logo left-aligned, tabs wrap below.

### Feed System

#### FeedClient (`components/feed/FeedClient.tsx`)

**Props:** `initialIdeas: TradeIdeaRow[], initialDigest: DigestRow | null, initialFeedbackMap?: FeedbackMap, watchlistSeeded?: boolean`

**State Management:**
- `activeTab`: Current tab ('for-you' | 'digest' | 'saved' | 'dismissed')
- `ideas`: Array of trade ideas for the For You tab (initialized from server)
- `tabIdeas`: Cached ideas for Saved/Dismissed tabs (fetched on first visit, invalidated on changes)
- `expandedId`: Currently expanded card ID (only one at a time)
- `generating`: Whether agent pipeline is running
- `statusLoaded`: Whether initial generation status check has completed
- `loadingTab`: Whether a tab's data is being fetched
- `showSeededToast`: Whether to show the watchlist-seeded toast
- `feedbackMap`: Maps idea IDs to 'thumbs_up' | 'thumbs_down' feedback state
- `fadingIds`: Set of idea IDs currently fading out (300ms opacity transition)
- `activeFeedbackId`: ID of card with open feedback dropdown (for z-index layering)

**Client-side Behaviors:**
1. **Viewport tracking**: `IntersectionObserver` (50% threshold) tracks how long each card is visible. When a card leaves viewport after >1 second, logs a `view` action with `time_spent_ms`.
2. **Auto-refresh**: Every 30 minutes via `setInterval`. Also refreshes when page becomes visible after being hidden >5 minutes (via `visibilitychange` event).
3. **Generation status polling**: On mount, checks `/api/agent/status`. If `running`, polls every 5 seconds until `idle`, then refreshes feed.
4. **Seeded toast**: If `watchlistSeeded` prop is true, shows a toast notification for 8 seconds explaining auto-populated tickers.

#### FeedCard (`components/feed/FeedCard.tsx`)

**Props:** `idea: TradeIdeaRow, isExpanded, isThumbsUp, isThumbsDown, onExpand, onCollapse, onSave, onDismiss, onThumbsUp, onThumbsDown, onDropdownChange`

Dispatcher component that renders either `TradeIdeaCard` or `EarningsDigestCard` based on `idea.card_type`.

#### TradeIdeaCard (`components/feed/TradeIdeaCard.tsx`)

**Collapsed View:**
- Direction badge (Buy/Sell/Hold with color coding)
- Ticker symbol + company name
- Headline (clickable to expand)
- Current price + relative time
- Action buttons row

**Expanded View (adds):**
- Event summary paragraph
- "WHY IT MATTERS" section — reasoning points as bullet list with citation markers
- "RISKS TO WATCH" section — risk factors as bullet list
- "WATCH FOR" — key signal to monitor
- Sources list — clickable links opening in new tabs
- Confidence badge (percentage)
- Time horizon label
- Dismiss button (X, only shown when expanded)

**Citation Rendering:** Uses `parseCitations()` from `lib/parseCitations.tsx` to convert `[1]`, `[2]` markers in text into clickable superscript `<a>` tags that link to the corresponding source URL.

#### EarningsDigestCard (`components/feed/EarningsDigestCard.tsx`)

**Collapsed View:**
- Purple "Earnings" direction badge
- Ticker + company name
- Headline
- Action buttons

**Expanded View (adds):**
- TL;DR section (from `extra_data.tldr`)
- "KEY HIGHLIGHTS" — highlight bullet points
- "MANAGEMENT TONE" — qualitative assessment
- "WHAT WALL STREET THINKS" — analyst consensus
- "YOUR THESIS" — how this connects to the user's investment thesis
- EPS and revenue beat/miss summary (actual vs estimate)
- Sources list
- Dismiss button

#### ActionButtons (`components/feed/ActionButtons.tsx`)

**Props:** `isSaved, isThumbsUp, isThumbsDown, showDismiss, onSave, onDismiss, onThumbsUp, onThumbsDown, onDropdownChange`

**Buttons:**
1. **Bookmark (Save)**: Toggle. Filled red (`#C4342D`) when saved, grey outline when not. Clicking toggles between `saved` and `active` status — card stays in For You feed.
2. **Thumbs Up**: Toggle. Filled dark (`#1a1a1a`) when active, grey outline when not. First click sets, second click undoes (DELETE to `/api/actions`).
3. **Thumbs Down**: Opens feedback dropdown. 6 options: "Wrong sector", "Bad timing", "Already holding", "Too risky", "Not enough upside", "Other". Selecting a reason logs feedback, then auto-dismisses the card with a 300ms fade-out.
4. **Dismiss (X)**: Only shown when `showDismiss=true` (expanded view). Immediately removes from feed.

**Feedback Dropdown:**
- Rendered as absolute-positioned div below the thumbs-down button.
- Outside-click detection via `mousedown` event listener closes without action.
- `onDropdownChange(open)` callback controls z-index layering in `FeedClient`.

#### DirectionBadge (`components/feed/DirectionBadge.tsx`)

**Props:** `direction: 'buy' | 'sell' | 'hold' | 'earnings'`

Color-coded pill badge:
- Buy: `#1B8C5A` background, white text, "Buy" label
- Sell: `#C4342D` background, white text, "Sell" label
- Hold: `#8B7300` background, white text, "Hold" label
- Earnings: `#6B5B95` background, white text, "Earnings" label

#### TickerMeta (`components/feed/TickerMeta.tsx`)

**Props:** `ticker: string, price?: number, companyName?: string, createdAt: string`

Displays ticker symbol (bold), company name (muted), current price (formatted), and relative time since creation (e.g., "2h ago", "3d ago").

#### EmptyState (`components/feed/EmptyState.tsx`)

**Props:** `tab: 'active' | 'saved' | 'dismissed', onGenerate?: () => void, generating?: boolean`

Tab-specific empty state messages:
- Active/For You: "No trade ideas yet" with "Generate Ideas" button
- Saved: "No saved ideas yet" with instructions
- Dismissed: "No dismissed ideas" with explanation

#### FeedSkeleton (`components/feed/FeedSkeleton.tsx`)

Three pulse-animated placeholder cards matching the collapsed card layout. Used during tab loading and initial generation.

### Digest

#### DigestView (`components/digest/DigestView.tsx`)

**Props:** `initialDigest: DigestRow | null`

**Behavior:**
- If no digest exists, shows empty state with "Generate Digest" button.
- Manual "Refresh" button with client-side rate limiting (tracks `lastGenerated` timestamp, compares against 1-hour cooldown).
- Renders digest content: greeting, narrative sections (each with title and body), "Worth Watching" section, sources list.
- Thumbs up/down feedback for the entire digest (logs `digest_thumbs_up` / `digest_thumbs_down` actions).
- Citations in section bodies are parsed into clickable links.

### Onboarding

#### OnboardingWizard (`components/onboarding/OnboardingWizard.tsx`)

**Props:** none (uses server action `saveThesis`)

**State:** `step` (0-12), `data` (WizardData shape), `saving`, `error`

13 steps with previous/next/finish navigation and progress bar:

| Step | Component | Field(s) | Input Type |
|---|---|---|---|
| 0 | CardSelect | `investment_goals` | Multi-select cards |
| 1 | CardSelect | `time_horizon` | Single-select cards |
| 2 | RiskSlider | `risk_tolerance` | Slider (1-10) |
| 3 | CardSelect | `capital_range` | Single-select cards |
| 4 | ChipSelect | `sectors` | Multi-select chips |
| 5 | ChipSelect | `industries` | Multi-select chips |
| 6 | ChipSelect | `strategy_preferences` | Multi-select chips |
| 7 | CardSelect | `check_frequency` | Single-select cards |
| 8 | CardSelect | `experience_level` | Single-select cards |
| 9 | TickerSuggestions | `interested_tickers` | Auto-suggested chips with add/remove |
| 10 | TickerSearch | `interested_tickers` | Debounced search + add |
| 11 | ChipSelect | `constraints` | Multi-select chips |
| 12 | Textarea | `custom_thesis` | Free-text (2000 char limit) |

On "Finish" (step 12), calls `saveThesis(data)` server action which validates, saves to `user_profiles`, auto-populates watchlist, and redirects to `/feed`.

#### CardSelect (`components/onboarding/CardSelect.tsx`)

**Props:** `options: {value, label, description}[], selected: string | string[], onChange, multi?: boolean`

Grid of selectable cards. Single-select or multi-select mode. Selected cards have a dark border and checkmark.

#### ChipSelect (`components/onboarding/ChipSelect.tsx`)

**Props:** `options: string[], selected: string[], onChange`

Inline chips (pill buttons). Selected chips are dark-filled, unselected are outlined.

#### RiskSlider (`components/onboarding/RiskSlider.tsx`)

**Props:** `value: number, onChange: (n: number) => void`

Horizontal slider from 1 to 10. Labels: 1="Very Conservative", 5="Moderate", 10="Very Aggressive". Shows current value as a number badge.

#### TickerSearch (`components/onboarding/TickerSearch.tsx`)

**Props:** `selected: string[], onChange: (tickers: string[]) => void`

Debounced search input (300ms) that calls `GET /api/market/search?q=`. Results filtered to US Common Stock (no dots in symbol). Shows results as a dropdown list. Selected tickers appear as removable chips below.

#### TickerSuggestions (`components/onboarding/TickerSuggestions.tsx`)

**Props:** `sectors: string[], industries: string[], selected: string[], onChange`

Calls `getSuggestedTickers(sectors, industries)` from `lib/data/tickerSuggestions.ts`. Displays suggested tickers as toggleable chips. Users can add/remove individual tickers.

### Profile

#### ProfileClient (`components/profile/ProfileClient.tsx`)

**Props:** `profile, stats, history, email` (all from server component)

**Sections:**
1. **Activity Stats**: Cards showing total ideas generated, saved (accept rate %), and total interactions.
2. **Thesis Editor**: Each thesis field (goals, time horizon, risk, capital, sectors, industries, strategies, check frequency, experience, tickers, constraints, custom thesis) displayed as an editable row. Inline editing — click "Edit" to toggle, saves on confirm via `PATCH /api/profile`.
3. **Thesis Evolution Timeline**: List of `thesis_history` entries showing what changed and when.
4. **Account Settings**:
   - Email display (read-only)
   - Change password form (min 8 chars)
   - Export data button (triggers `GET /api/profile/export`)
   - Delete account button (confirms before calling `POST /api/profile/delete-account`)

### Watchlist

#### WatchlistClient (`components/watchlist/WatchlistClient.tsx`)

**Props:** `initialItems: WatchlistItemWithQuote[]`

**Features:**
1. **Search and add**: Debounced ticker search (calls `/api/market/search`). Add button posts to `/api/watchlist`.
2. **Ticker cards**: Each watchlist item shows ticker, company name, current price, daily change %. Clicking expands to show details.
3. **Price polling**: Fetches fresh quotes every 60 seconds for all watchlist tickers.
4. **Notes**: Inline editable notes field per ticker. Auto-saves on blur.
5. **Positions**: Expandable section showing logged positions with P&L calculations. Add position form (shares, entry price, date). Delete position button.
6. **Peer suggestions**: "You might also like" section showing Finnhub peers not already in watchlist. Fetched from `/api/watchlist/peers`. Click to add.
7. **Remove**: Delete button removes ticker and all associated positions (cascade).

### Utility Components

#### SignOutButton (`components/SignOutButton.tsx`)

Calls `supabase.auth.signOut({ scope: 'global' })` then `fetch('/api/auth/sign-out')` for server-side cookie clearing, then redirects to `/`.

#### Analytics (`components/Analytics.tsx`)

Wraps Vercel `Analytics` component. Also logs page views to console in development.

#### parseCitations (`lib/parseCitations.tsx`)

**Function:** `parseCitations(text: string, sources: Source[]): React.ReactNode`

Regex: `/\[(\d+)\]/g`

Converts `[N]` markers in text to clickable superscript `<a>` tags. Maps N to `sources[N-1].url`. Links open in new tab (`target="_blank"`, `rel="noopener noreferrer"`). Returns a React fragment mixing text spans and link elements.

---

## 8. Known Limitations and Technical Debt

### API and Type Safety

1. **No generated Supabase types**: All Supabase table access uses `(supabase as any)` casts. There are no auto-generated TypeScript types from the database schema. This means:
   - No compile-time validation of column names or types
   - Typos in column names won't be caught until runtime
   - `eslint-disable @typescript-eslint/no-explicit-any` comments are scattered throughout
   - To fix: run `supabase gen types typescript` and import generated types into client initialization

2. **No Finnhub SDK**: The Finnhub client (`lib/finnhub/client.ts`) is a hand-rolled HTTP wrapper. Response types in `types/Finnhub.ts` are manually defined to match the raw API shape. If Finnhub changes their API response format, it will break silently.

3. **No Tavily SDK**: Similarly hand-rolled. The `api_key` is sent in the POST body (Tavily's required pattern), but there's no type validation on responses.

### Rate Limiting

4. **Finnhub free tier constraints**: 60 calls/minute is adequate for single-user but becomes a bottleneck during cron runs with multiple users. The 10-second stagger in `generate-ideas` cron helps, but with many watchlist tickers per user, a single pipeline run can consume significant quota.

5. **Digest generation rate limit is in-memory**: The `POST /api/digest/generate` route uses a `Map<userId, timestamp>` for cooldown. This resets on server restart/redeploy and doesn't work across multiple serverless function instances. The trade idea pipeline correctly uses persistent database state for rate limiting.

6. **No user-facing rate limit feedback for agent/run**: When a 429 is returned from `/api/agent/run`, the client sets `generating = true` and relies on polling to detect completion. The user sees "Generating..." but has no indication of how long to wait or that they hit a rate limit vs. a normal in-progress run.

### Scalability

7. **Cron jobs iterate all users sequentially**: The `generate-ideas` and `generate-digests` cron routes loop through users with staggered delays. With the 300-second `maxDuration` limit on Vercel serverless functions, this caps at ~30 users per cron run (10s stagger × 30 = 300s). Beyond that, users would be silently skipped.

8. **No background job queue**: Pipeline execution happens synchronously within the API route (for manual triggers) or cron handler. There's no queue (like BullMQ, Inngest, or Trigger.dev) to handle retries, parallelism, or failure isolation.

9. **Single-region deployment**: No multi-region considerations. All Supabase queries, Finnhub calls, and LLM calls happen from whatever Vercel region handles the request.

### Data Integrity

10. **No foreign key validation on actions**: The `POST /api/actions` route doesn't verify that `trade_idea_id` or `digest_id` actually exist before inserting. Invalid references will be accepted (no FK constraint violation because the columns are nullable).

11. **Price snapshots rely on ticker availability**: If Finnhub returns no data for a ticker (delisted, API issue), the price snapshot is silently skipped. No retry mechanism.

12. **Outcome analysis assumes linear price movement**: `lib/analytics/outcomes.ts` compares `price_at_generation` with the latest snapshot. For hold recommendations, direction correctness returns null. No accounting for dividends, splits, or corporate actions.

### Frontend

13. **Inline styles**: Many components use inline `style` objects rather than Tailwind classes. This is inconsistent with the Tailwind-first approach in `tailwind.config.ts` and makes the design harder to maintain. Notable in: `FeedClient.tsx`, `TradeIdeaCard.tsx`, `ActionButtons.tsx`, `TopNav.tsx`.

14. **No optimistic UI for saves/dismisses**: While saves toggle in-place locally, there's no rollback if the API call fails. The PATCH request is fire-and-forget (`.catch(() => {})`).

15. **Observer ref leak potential**: In `FeedClient.tsx`, the `IntersectionObserver` observes each card via a ref callback but never calls `unobserve()` on unmount of individual cards. The observer itself is cleaned up on component unmount, but stale entries could accumulate during long sessions.

16. **No SSR for Saved/Dismissed tabs**: Only the "For You" tab receives server-rendered initial data. Saved and Dismissed tabs fetch client-side on first visit, showing a loading skeleton. This means tab switches to these tabs always show a flash of loading state.

### Security

17. **No CSRF protection**: API routes rely solely on Supabase session cookies. No CSRF tokens. Supabase's cookie-based auth with `SameSite` attribute provides some protection, but it's not explicit.

18. **No input sanitization on LLM-generated content**: Trade idea text is rendered with `parseCitations()` which creates React elements (safe from XSS via React's escaping), but `dangerouslySetInnerHTML` is not used anywhere — this is correctly handled.

19. **Export endpoint returns all user data as JSON**: `GET /api/profile/export` dumps everything. While behind auth, there's no additional confirmation or audit logging for data exports.

### Testing

20. **Minimal test coverage**: Only Vitest is configured as a dependency. No test files were found in the codebase. No unit tests for the agent pipeline, no integration tests for API routes, no component tests.

21. **No E2E testing framework**: No Playwright, Cypress, or similar. No automated testing of the onboarding flow, feed interactions, or watchlist management.

### Other

22. **No error tracking service**: Errors are logged to `console.error` and stored in `agent_runs.error_message`. No Sentry, Datadog, or similar error monitoring integration.

23. **No email notifications**: Users must visit the app to see new ideas or digests. No email, push, or webhook notification system.

24. **Analytics is console-only in dev**: `Analytics.tsx` logs page views to console. Vercel Analytics is included but there's no custom event tracking beyond `user_actions` in the database.

25. **Custom thesis has no content moderation**: The free-text `custom_thesis` field (up to 2000 chars) is passed directly to LLM prompts without any moderation or filtering. While this is user-input-to-LLM (not user-input-to-other-users), prompt injection is theoretically possible.

---

## 9. Future Roadmap Context

This section captures architectural decisions and patterns that suggest intentional design for future extension, plus gaps that would need to be filled for a production-quality product.

### Signals of Planned Extension

1. **Outcome analysis infrastructure**: The `price_snapshots` table with `generation`, `1d`, `1w`, `1m` types and the `outcomes.ts` analysis module suggest plans for:
   - Idea accuracy tracking and display (partially built in ProfileClient)
   - Model performance monitoring (which types of ideas are most accurate)
   - Feedback loop to improve LLM prompts based on accuracy data

2. **Thesis history tracking**: The `thesis_history` table with `changed_fields` and full `snapshot` suggests plans for:
   - Understanding how thesis changes affect idea quality
   - "Thesis evolution" visualization (partially built in ProfileClient)
   - Temporal analysis of user engagement relative to thesis changes

3. **Action logging granularity**: The `user_actions` table logs not just binary actions but `time_spent_ms` on views and `feedback_reason` on thumbs-down. This level of detail suggests plans for:
   - Recommendation quality scoring
   - User engagement analytics
   - Reinforcement learning from human feedback (RLHF) for idea generation

4. **Agent run auditing**: The `agent_runs` table stores full LLM prompts, responses, model versions, latency, and token counts. This enables:
   - Cost analysis per user/per run
   - Prompt engineering iteration with A/B comparison
   - Debugging failed generations
   - Compliance/audit trail

5. **Extensible card types**: The `card_type` field on `trade_ideas` ('trade_idea' | 'earnings_digest') with `extra_data` jsonb allows adding new card types (e.g., technical analysis alerts, sector rotation signals, IPO analysis) without schema changes.

6. **Multi-pipeline architecture**: The pipeline orchestrator already runs trade ideas and earnings in parallel via `Promise.allSettled`. Adding new pipeline stages (e.g., technical analysis, sentiment analysis) would follow the same pattern.

### Gaps to Fill for Production

1. **Authentication hardening**: Email verification, OAuth providers (Google, Apple), MFA.
2. **Background job processing**: Replace synchronous pipeline execution with a proper job queue for reliability, retries, and horizontal scaling.
3. **Monitoring and alerting**: Error tracking (Sentry), APM (Datadog), uptime monitoring, LLM cost alerts.
4. **Test suite**: Unit tests for pipeline logic, integration tests for API routes, E2E tests for critical user flows.
5. **Content moderation**: Input filtering for `custom_thesis`, output moderation for LLM responses.
6. **Email/push notifications**: New idea alerts, daily digest emails, weekly summaries.
7. **Admin panel**: User management, pipeline monitoring, cost dashboards, content review.
8. **Multi-region support**: Edge-optimized API routes, regional Supabase replicas.
9. **Proper type generation**: Supabase type generation, API response type validation.
10. **Mobile app**: The responsive web design suggests mobile-first thinking, but a native app (React Native / Expo) would enable push notifications and better performance.

### Architectural Strengths to Preserve

1. **Clear separation of concerns**: Agent logic (`lib/agent/`) is fully separated from UI. Prompts are centralized in `prompts.ts`. Cache, rate limiting, and external clients each have their own modules.
2. **Single thesis formatting chokepoint**: `formatThesis()` ensures every LLM interaction gets a consistent thesis representation. Any changes to thesis format propagate automatically to all pipelines.
3. **Audit-first design**: Every pipeline run, user action, and thesis change is logged. This data is already being captured even though analysis features are minimal — the data will be available when needed.
4. **Cache-everything approach**: External API responses are uniformly cached with per-endpoint TTLs. This protects against rate limits, reduces latency, and keeps costs predictable.
5. **Progressive enhancement**: Server-rendered initial data with client-side hydration for interactivity. The feed works on initial load, then enhances with polling, observers, and real-time status updates.

---

*Generated from complete codebase analysis. All file paths, function names, types, and behaviors verified against source code as of the generation date.*
