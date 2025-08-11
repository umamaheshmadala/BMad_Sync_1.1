# SynC — Full-Stack Architecture (First Pass)

Version: 1.0  
Date: 2025-08-11  
Owner: Architect

## Summary
- Monorepo: `apps/web` (React/Vite), `apps/api` (Netlify/Supabase Edge Functions), `packages/shared` (types/utils)
- Core services: Supabase (Postgres, Auth, Storage, Realtime); Netlify functions for custom APIs/cron
- Realtime: Supabase Realtime channels; future queue for scale bursts
- Notifications: In-app (phase 1); Web Push via service worker (phase 2)

## Data Model (initial entities)
Users, Businesses, Storefronts, StorefrontProducts, BusinessFollows, Friends, Coupons, UserCoupons,
CouponShares, UserActivities, BusinessReviews, Notifications, Ads, Promotions, PlatformConfig,
RevenueTracking, WishlistItems, WishlistMatches

Relationships (high level):
- Users 1–N UserActivities, UserCoupons, BusinessFollows, Friends
- Businesses 1–N Storefronts, Coupons, Ads, Promotions
- Coupons 1–N UserCoupons; UserCoupons 1–N CouponShares (lineage)

## Security & Access
- Auth: Supabase Auth (role-based UI)
- RLS: Per-table policies (owner can read/write own rows; public read where appropriate; admin/service role for elevated ops)
- Secrets: Env vars in Netlify/Supabase; no secrets in repo

## API Design
- REST-ish endpoints via Netlify/Supabase Edge Functions
- JWT validation middleware; role checks
- OpenAPI spec generated for core endpoints

## Jobs & Scheduling
- Driver score recalculation: owner‑triggered on demand and scheduled cron; city‑scoped top 10%; weights configurable
- Analytics summarization (daily/weekly)
- Coupon expiry sweeps & reminders

## Realtime Flows
- Channels: `offers:{city}`, `notifications:{userId}`, `storefront:{businessId}`
- Debounce/throttle to avoid notification floods

## Search & Discovery
- Postgres FTS/trigram on businesses/products/offers
- Geo index on business locations; nearest-city mapping

## Storage & Media
- Supabase Storage for avatars/logos/banners; signed URLs; size limits
- Optional image optimization/CDN

## Observability & Ops
- Structured JSON logging; Sentry FE/BE
- Metrics: Netlify/Supabase dashboards; custom events table
- Alerts: thresholds on error rates/latency

## Performance & Scale
- Connection pooling; compact payloads
- Caching: CDN for static; client query caching
- Abuse controls: rate limits on share/redeem; fraud checks

## Compliance & Privacy
- MVP: compliance deferred to Phase 2 (keep simple); basic privacy policy only
- Data retention windows; user export/delete (phase 2)
- PII minimization; purpose‑limited analytics

## Environments & CI/CD
- Envs: dev, staging, prod; separate Supabase projects or branches
- CI: lint/test/build; deploy previews; DB migrations gated and audited

## Open Decisions
- Final RLS per table (draft next)
- In-app only vs. Web Push for MVP
- Exact interests/cities vocab and storage design
- Billing: Razorpay integration (monthly postpaid; ₹20k threshold freeze); show available credit

---
Next: Draft ERD and initial SQL schema; define RLS policies; enumerate endpoints; estimate monthly costs under target load.
