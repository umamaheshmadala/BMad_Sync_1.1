# CI Gates — SynC MVP

Version: 1.0  
Date: 2025-08-11

## Pipeline Stages
1. Lint & Typecheck
2. Unit tests (parallel shards)
3. Integration tests (mocked Supabase client)
4. OpenAPI lint (Redocly)
5. Build web
6. Advisors and EXPLAIN (best-effort)
7. Scheduled smoke (hourly) and light load (daily)
8. Artifacts: coverage, JUnit XML, screenshots/logs for E2E (future)

## Policies
- Fail on lint/type errors
- Coverage thresholds: lines 80%, branches 70% overall; critical utils/config 95%
- E2E runtime budget: < 5 min; total CI < 10 min
- Flake rerun: once only; track flake rate < 1%

## Secrets & Env
- Use dummy billing mode; no Razorpay keys in CI
- Supabase: test project/branch or local container; service role for tests only
- Notifications: use mock queue
- Advisors (optional, recommended):
  - SUPABASE_PAT: Personal access token with access to project
  - SUPABASE_PROJECT_ID: Project ref/id (abcd1234)
  - STRICT_ADVISORS=true to fail CI on findings (optional)
- EXPLAIN baselines (optional):
  - SUPABASE_URL: Project URL
  - SUPABASE_SERVICE_ROLE_KEY: Service role for EXPLAIN RPC
  - Note: EXPLAIN step is non-blocking by default; enable thresholds separately
  - EXPLAIN_MAX_ROWS: number (e.g., 100000); when STRICT enabled, fail if any plan exceeds rows
  - EXPLAIN_STRICT: true|false to enforce thresholds

## Caching
- Node modules cache by lockfile hash
- Test DB snapshot where supported
