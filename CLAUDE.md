# Tickr — AI-Native Investment Research Platform

## Project Overview

Tickr is a web app that captures a user's investment thesis (goals, risk profile, sectors, strategy) and uses an AI agent to monitor market events, generate thesis-aligned trade ideas, and present them as a concise TL;DR feed. No trade execution — research and recommendations only.

## Product Scope

- US stocks only (NYSE + NASDAQ). No international, forex, or crypto for MVP.
- Trade ideas are TL;DR format — concise, scannable, max 15-20 seconds to read when expanded. Not research reports.
- Every trade idea must cite its sources with clickable links (news articles, data) that open in a new browser tab. Sources come from Finnhub news and Tavily search results — the LLM only cites sources we actually retrieved, never fabricated URLs.
- Ticker search uses Finnhub's /search endpoint with debounce, filtered to US exchanges only.
- Logo is "tickr" in all lowercase, rendered in math italic serif font (Noto Serif italic or similar).

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL + Auth + Row Level Security)
- **LLM:** Anthropic Claude API (claude-sonnet-4-20250514)
- **Web Search:** Tavily API
- **Market Data & News:** Finnhub API
- **State Management:** React Context + server components where possible
- **Deployment:** Vercel

## Architecture Principles

- Server components by default; client components only when interactivity is needed
- All API keys in environment variables, never hardcoded
- All database access through Supabase client with RLS enabled
- Agent logic lives in /lib/agent/ — separated from UI
- Every agent run is logged to the agent_runs table for future analysis
- User interactions (views, dismissals, saves, feedback) are logged to user_actions table

## Database Schema (Supabase)

Tables: user_profiles, watchlist_items, trade_ideas, agent_runs, user_actions, price_snapshots, digests, api_cache

- All tables have RLS policies scoped to auth.uid()
- user_profiles is 1:1 with auth.users
- trade_ideas references the agent_run that generated it
- user_actions references the trade_idea acted upon

## Code Conventions

- Use named exports, not default exports (except for page components)
- Prefer async/await over .then() chains
- Error handling: try/catch with specific error types, never swallow errors
- API routes in /app/api/ follow RESTful conventions
- Use zod for all input validation on API routes
- Components in /components/ with PascalCase filenames
- Utilities in /lib/ with camelCase filenames
- Types in /types/ with PascalCase filenames

## File Structure

/app
/api          — API routes
/(auth)       — Auth pages (login, signup)
/(dashboard)  — Main app pages (feed, watchlist, profile, settings)
/onboarding   — Thesis capture wizard
/components
/ui           — Reusable primitives (Button, Card, Input, etc.)
/feed         — Trade idea feed components + earnings digest cards
/digest       — Daily briefing components
/onboarding   — Onboarding step components
/watchlist    — Watchlist components
/lib
/agent        — AI agent logic (event detection, idea generation, prompts)
/cache        — API response caching (shared cache backed by api_cache table)
/supabase     — Supabase client and helpers
/finnhub      — Finnhub API wrapper (uses cache)
/tavily       — Tavily API wrapper (uses cache)
/types          — TypeScript type definitions

## Agent Pipeline (Core Logic)

1. Event Detection: Poll Finnhub for news/events matching user's sectors & watchlist
2. Relevance Filtering: Score event relevance against user thesis
3. Data Enrichment: Fetch price data, fundamentals, broader context via Tavily. Collect source metadata (title, url, publisher) for citations.
4. Idea Generation: Pass (event + thesis + data + sources) to Claude for trade idea with cited sources
5. Logging: Store full agent run (inputs, outputs, latency) in agent_runs table
6. Presentation: Display trade idea card in user's feed with clickable source citations

## Digest Pipeline (Daily Briefing)

1. Aggregate latest 15-20 articles from Finnhub for user's sectors & watchlist
2. Collect source metadata from all articles
3. Pass (articles + thesis + sources) to Claude with digest prompt
4. Claude synthesizes into conversational briefing with source citations
5. Save to digests table, log to agent_runs

## Earnings Digest Pipeline

1. Check Finnhub earnings calendar for user's watchlist tickers with recent earnings (past 48 hours)
2. Pull full transcript via Finnhub + analyst data (recommendations, price targets, EPS estimates, upgrades/downgrades)
3. Optionally search Tavily for public analyst commentary
4. Pass everything to Claude with earnings digest prompt — translates all jargon into plain English
5. Save as card_type='earnings_digest' in trade_ideas table
6. Triggered by cron and manual "Generate Ideas" button

## Source Citations

- When user clicks a source citation [1][2], it opens the original article URL in a new browser tab
- Sources come from Finnhub news articles and Tavily search results — the LLM only cites sources we actually retrieved

## Testing

- Use Vitest for unit tests
- Test agent prompts with snapshot tests
- Test API routes with integration tests

## Important Notes

- Never store API keys in code — use .env.local
- Always validate user input with zod before database operations
- The agent should never give specific financial advice — frame everything as "ideas to research further"
- Include disclaimers on trade ideas: "This is not financial advice"


## Design Reference

See /design/wireframes.jsx for visual mockups of all key screens.
Match the exact colors, typography, spacing, and component styles defined there.
Key design tokens are extracted from that file — do not deviate.
