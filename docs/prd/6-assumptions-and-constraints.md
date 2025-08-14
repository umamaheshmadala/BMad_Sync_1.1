# 6. Assumptions and Constraints
- Web‑first, responsive design; Indian Tier 1/2/3 cities list during onboarding and dashboard
- If user already chose interests previously, successful login redirects directly to dashboard
- Local dev opens in Chrome Incognito by default to avoid caching during testing
- Monorepo structure; serverless backend; Supabase (DB/Auth/Storage/Realtime)
- Testability: Each story must include unit, integration, and critical E2E tests; provide deterministic seeds and mockable services (billing, notifications).
