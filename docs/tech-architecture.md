# Amis Language Learning Platform — Technical Architecture (Mobile-First)

## Tech Stack Recommendation

- iPhone-first Client:
  - Primary: React Native (Expo) — best touch UX, offline-ready, haptics, gesture handling; easy OTA updates via EAS. PWA on iOS still limits push and background tasks.
  - Alternative Web: Next.js + PWA (App Router) — for quick distribution via Safari; pair with Capacitor if you need native bridges (Haptics, FileSystem, Background fetch).
- Backend:
  - NestJS (TypeScript) — modular, testable, DI-friendly; exposes REST + WebSocket for live sessions.
  - Authentication: NextAuth (if web) or JWT w/ Refresh tokens (mobile).
- Database:
  - PostgreSQL + Prisma ORM — strong relational modeling; pg_trgm extension for fuzzy matching; GIN/GIST indexes for search performance.
  - Redis — caching hot queries (priority queues, dictionary lexicon), rate limiting.
- Observability:
  - OpenTelemetry + pino logs; Sentry for crash/error; PostHog for product analytics.
- Deployment:
  - Supabase/Railway/Fly.io for Postgres; Vercel/Render for API; Expo EAS for iOS builds.

## Architecture Overview

- Mobile App (Expo RN):
  - Screens: Study, Test (Choice/Spell/Mixed), Dictionary, CMS, Dashboard.
  - Offline-first: local queue; background sync to server when online.
- API (NestJS):
  - Modules: Users, Dialects, Flashcards, Sentences, Reviews, SmartLinker, Dashboard.
  - SM-2 service — applies per-user per-card SRS state.
  - SmartLinker service — tokenization + fuzzy matching against dialect lexicon.
- Data Model highlights:
  - Per-user SRS state (`UserCardStat`) stores EF, interval, reps, next_review_at, priority.
  - `Review` records each attempt with mode and score.
  - `SentenceWordLink` maps sentences to flashcards with token spans.

## Why RN (Expo) over PWA on iPhone

- Native gestures + haptics for card flip and rating.
- Offline persistence and background tasks more reliable.
- Push notifications and background reminders feasible.

## Performance & Indexing

- Trigram indexes on `flashcards.lemma` and `sentences.text` for fuzzy match.
- B-tree indexes on `user_card_stats.next_review_at`, `ef`, `(user_id, current_priority)`.
- Cache dialect lexicons in Redis; warm up on boot.
