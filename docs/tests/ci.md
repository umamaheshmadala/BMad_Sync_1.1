# CI Gates — SynC MVP

Version: 1.0  
Date: 2025-08-11

## Pipeline Stages
1. Lint & Typecheck
2. Unit tests (parallel shards)
3. Integration tests (DB container + mocked externals)
4. E2E smoke (critical flows only) on PR/main
5. Artifacts: coverage, JUnit XML, screenshots/logs for E2E

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

## Caching
- Node modules cache by lockfile hash
- Test DB snapshot where supported
