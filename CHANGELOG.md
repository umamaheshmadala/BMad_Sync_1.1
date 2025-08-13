### Changelog

### v0.1.7 — 2025-08-12

- Platform
  - Zod validation for pricing/runtime configs
  - OpenAPI examples added for config endpoints
- API
  - Completed Zod validations for wishlist, favorites, interests, GPS check-in, redeem, offers generate
  - Response codes normalized; analytics endpoints document RateLimit headers/429
- Docs
  - OpenAPI: requestBody examples for favorites, interests, wishlist, GPS check-in, redeem, offers generate
- CI
  - Hourly scheduled Smoke Tests with `DEPLOYED_BASE_URL` secret fallback
- Tests: green (26/26)

### v0.1.6 — 2025-08-12

- Added
  - OpenAPI: notifications endpoints; platform config (GET/runtime PUT); `sinceDays` for trends/funnel.
  - API: stubs for dashboard, favorites, GPS check-in, business signup/login, targeted coupon issue.
- Changed
  - Trends/Funnel: default window set to 7 days to improve responsiveness; documented clamp 1–365.
  - Handler mapping updated for notifications.
- Tests
  - Mock Supabase enhanced with `.gte()` to support analytics filters; all tests green (26/26).

### v0.1.5 — 2025-08-12

- Added
  - Notifications end-to-end: persist on wishlist matches; GET list; PUT mark-all-read; PUT item read; DELETE clear.
  - Business analytics trends endpoint: `GET /api/business/analytics/trends` with optional `group=business` and `businessId` filtering; corresponding UI "Trends" tab toggle.
- Changed
  - Unified notifications route so GET and DELETE share the same path (`/api/users/:userId/notifications`) to avoid handler conflicts.
  - Fixed unread filtering using `.is('read_at', null)` and added `read_at` to schema (`docs/supabase_schema.sql`).
  - Netlify: publish `apps/web-react/dist`; SPA fallback scoped to `/react/*`.
  - UI: better empty/error states in Notifications; label bump to v0.1.5.
- Tests
  - Extended mock Supabase with `.is()`; updated integration tests to use unified notifications route and trends endpoint. All tests green (25/25).

### v0.1.4 — 2025-08-11

### v0.1.3 — 2025-08-11

- Added
  - `POST /api/business/{businessId}/reviews` → `apps/api/functions/business-reviews-post.ts`.
  - `POST /api/storefronts/{storefrontId}/products` → `apps/api/functions/storefronts-products-post.ts`.
  - `GET /api/users/{userId}/wishlist/matches` → `apps/api/functions/users-wishlist-matches-get.ts`.
- Docs
  - Updated `docs/api/openapi.yaml` and `docs/api/handlers.md` for new endpoints.
- Tests
  - Integration tests for review creation and wishlist matches.

### v0.1.1 — 2025-08-11

- Added
  - Persist platform config to DB via `platform_config` with defaults fallback.
  - Auth hardening: consistent 401/403 checks across user and business endpoints.
  - Simple dev console `index.html` to call local API endpoints from the browser.
- Tests
  - Round-trip config test (PUT then GET).
  - Negative tests for unauthorized/forbidden flows.
- Status
  - All integration tests pass locally.

### v0.1.0 — 2025-08-11

Initial SynC MVP scaffold.

- Added
  - Netlify serverless API functions under `apps/api/functions/*`:
    - `users-profile-interests-put`
    - `users-wishlist-post`
    - `users-coupons-collect-post`
    - `users-coupons-share-post`
    - `users-coupons-shared-cancel-post`
    - `business-redeem-post`
    - `business-analytics-reviews-get`
    - `business-analytics-coupons-get`
    - `business-storefront`
    - `platform-config-get`
    - `platform-config-runtime-put`
    - `platform-revenue-get`
    - `tests-seed-post`
  - Shared helpers in `packages/shared/*` (`supabaseClient.ts`, `auth.ts`, `config.ts`, `notifications.ts`).
  - Integration tests in `tests/integration/*` with a Supabase client mock in `tests/helpers/mock-supabase.ts`.

- Database
  - Supabase schema: `docs/supabase_schema.sql` (tables for users, businesses, coupons, shares, storefronts, reviews, notifications, ads/promotions, wishlist, platform_config, revenue, refs for cities/interests).
  - RLS policies: `docs/rls_policies.sql` (scoped access for users, business owners, and platform owner, helper functions `auth_uid()` and `is_platform_owner()`).

- Developer Experience
  - Windows Quickstart and runbook: `docs/dev-runbook.md`.
  - Local dev via Netlify: `netlify.toml`, script `npm run dev:api`.
  - Tests via `npm test` (Vitest). All green locally.

- CI
  - GitHub Actions enabled on push/PR to `main` (workflow file expected at `.github/workflows/ci.yml`).

Tag: `v0.1.0` (commit `e7132e9`).


