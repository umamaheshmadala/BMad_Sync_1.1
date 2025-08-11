# Test Plan — SynC MVP

Version: 1.0  
Date: 2025-08-11

## Scope
Covers unit, integration, and E2E tests for MVP features per PRD. Emphasis on determinism, fast feedback, and flake-free runs (<1% permitted).

## Test Types
- Unit (fast, <2s):
  - Utility functions (interest selection validation, category inference stubs)
  - Config loader (platform_config), throttling/caps logic
  - Coupon lifecycle helpers (share cap enforcement, code generation)
- Integration (API + DB, mocked externals):
  - Auth proxy endpoints (Supabase mocked)
  - User profile update (city/interests)
  - Wishlist add → category fields populated
  - Favorites add/remove
  - Storefront create/update; products add (category fields)
  - Offer create → coupons generate → collect → share → cancel share
  - Redeem flow (marks redeemed; writes activity)
  - Notifications enqueue with throttling (mock queue)
  - Platform config read/write; pricing update
  - Revenue tracking writes in billing dummy mode
  - RLS denial cases (unauthorized updates/reads)
- E2E (critical happy paths only):
  - User: signup → onboarding (city+interests) → dashboard → collect coupon → share → simulated redeem
  - Business: signup → storefront → products → offer → coupons
  - Owner: revenue summary (dummy) → update pricing → confirm readback

## Data & Determinism
- Use fixed IDs in seed where possible; avoid time randomness (clock freeze per test).
- Reset DB schema or use transaction rollbacks between integration/E2E tests.

## Mocks
- Billing: dummy sink (no external calls). Mode="dummy" asserts no network.
- Notifications: in-memory queue honoring caps/throttles from platform_config.
- Auth: Supabase client mocked for signup/login.

## Pass/Fail Criteria
- Unit: 95%+ branch coverage on utils/config; < 1s per package
- Integration: All routes respond with expected schemas; RLS negative tests enforced
- E2E: All three flows pass reliably on two consecutive CI runs; runtime < 5 min

## Reporting
- JUnit XML + coverage (lcov) artifacts
- Flake detector reruns once (max) on failure; if passes on rerun, flagged but non-blocking

## Risks & Mitigations
- Realtime flakiness → mock channels; do not depend on live sockets in CI
- Clock skew → inject clock; freeze per test
- Data races → serialize write-heavy tests; use per-test schemas if needed
