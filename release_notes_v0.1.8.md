Version v0.1.8

Highlights
- UI: cURL generation/copy; unified toasts with x-request-id; analytics loading with 10s timeout; Rate Limit export JSON/CSV; optional Sentry FE tags x-request-id.
- API: Owner-only revenue and rate limit diagnostics; owner/business-owner analytics (reviews/coupons) with Cache-Control; x-request-id on all responses; optional Sentry BE.
- OpenAPI: 0.1.8; production server URL; 401/403 for analytics; ratelimit diagnostics schema.
- DB: Analytics indexes; shared rate limiter table support.
- CI/CD: Tests/build; OpenAPI lint; Advisors/EXPLAIN (strict togglable); hourly smoke; daily load.

Status
- Tests: green (42/42)
- Web build: successful
- Smoke: OK against production

Operational Notes
- Shared limiter enabled: FEATURE_SHARED_RATELIMIT=true. Diagnostics at GET /api/platform/ratelimit (owner).
- Repo vars recommended for strict gates: STRICT_ADVISORS=true, EXPLAIN_STRICT=true, EXPLAIN_MAX_ROWS=100000, DEPLOYED_BASE_URL set to site URL.


