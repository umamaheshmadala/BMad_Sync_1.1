### Ops Runbook — BMad SynC

#### Overview
- Hosting: Netlify (functions + static UI)
- Auth: Supabase JWT (persisted in localStorage)
- DB: Supabase Postgres
- API Docs: /api-docs (Swagger UI)

#### Env and feature flags
- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
- FEATURE_SUPABASE_AUTH=true
- FEATURE_DEV_AUTH=false
- FEATURE_SHARED_RATELIMIT=true (optional; uses table public.rate_limits)
- UI env (build-time): VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY

#### Health and smoke
- Health: GET /api/platform/health (returns ok, features, version)
- Manual smoke (PowerShell):
  - $env:BASE_URL="https://<site>.netlify.app"; node scripts/smoke.mjs
- CI: hourly Smoke Tests (uses DEPLOYED_BASE_URL secret)
- /api-docs should return 200

#### Cache/CDN
- Analytics endpoints respond with Cache-Control: s-maxage=60, stale-while-revalidate=120
- Use /react2 to bypass path-level CDN cache during troubleshooting

#### Rate limiting
- Headers: RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset, Retry-After
- Shared limiter (optional):
  - public.rate_limits(key text pk, window_start int, count int)
  - Enable via FEATURE_SHARED_RATELIMIT=true
  - Keep in-memory fallback if disabled
  - Diagnostics (owner-only): GET /api/platform/ratelimit (shows top 50 counters when shared limiter enabled)

#### Logging & tracing
- x-request-id header added to all responses from wrapped handlers
- Server logs include reqId, method, path, status, latency
 - CI surfaces Supabase Advisors findings in a GitHub issue labeled `advisors`
 - EXPLAIN baselines: thresholds via EXPLAIN_MAX_ROWS and EXPLAIN_STRICT (CI env)

#### Common runbooks
1) Elevated error rates (429/5xx)
   - Check Netlify logs for specific endpoint + reqId
   - Verify RateLimit headers; increase window/limit if needed, or enable shared limiter
   - Confirm Supabase availability on status page
2) Auth failures
   - Validate SUPABASE_URL/keys; test login via UI Auth tab
   - JWT role for owner endpoints: app_metadata.claims_role="owner"
3) Analytics stale data
   - CDN working as designed; reduce s-maxage if needed
   - Validate sinceDays query param and businessId ownership checks
4) Notifications inconsistencies
   - Re-run wishlist matches to repopulate
   - Verify RLS policies (docs/rls_policies.sql) and permissions

#### DB migrations
- Apply in order:
  - docs/supabase_schema.sql
  - docs/rls_policies.sql
  - supabase/migrations/* (e.g., perf indexes)
- Shared limiter table: ensure public.rate_limits exists (see docs/supabase_schema.sql)

#### Release process
1) Merge to main
2) CI: build/test/OpenAPI validate
3) Netlify deploy auto-triggers
4) Run Smoke Tests workflow with base_url=<site>
5) Tag release (npm version already in package.json)

#### Quick checks
- GET /api/platform/health -> 200 ok
- GET /api/business/analytics/trends?sinceDays=1 -> 200 + RateLimit-* headers
- /api-docs -> 200

#### Contacts
- Project repo: https://github.com/umamaheshmadala/BMad_Sync_1.1
- Netlify project: tiny-bombolone-8f8acf


