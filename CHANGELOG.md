### Changelog

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


