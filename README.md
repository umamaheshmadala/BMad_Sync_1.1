### BMad_Sync_1.1

SynC MVP scaffold with Netlify Functions, Supabase schema/RLS, and integration tests.

- Dev quickstart: see `docs/dev-runbook.md`
- API functions live under `apps/api/functions/*`
- Tests: `npm test`

### Live

- Site: `tiny-bombolone-8f8acf`
- UI: `https://tiny-bombolone-8f8acf.netlify.app/react`
- Current tag: `v0.1.8`

### Local run

1) Install deps

```powershell
npm install
```

2) Environment (PowerShell)

```powershell
$env:SUPABASE_URL="https://<your>.supabase.co"
$env:SUPABASE_ANON_KEY="<anon>"
$env:SUPABASE_SERVICE_ROLE_KEY="<service>"
$env:FEATURE_SUPABASE_AUTH="true"
$env:CHOKIDAR_USEPOLLING="1"
```

3) Start API and UI

```powershell
npx --yes netlify-cli@17 dev --port 8888 --no-open
npm run dev:web
```

Open `http://localhost:5173`

### Database setup

- Run `docs/supabase_schema.sql`, then `docs/rls_policies.sql`
- Seed: open `http://localhost:8888` → trigger “POST /api/tests/seed”

### Netlify deploy

- Build: `npm run build:web`
- Publish: `apps/web-react/dist`
- Functions: `apps/api/functions`

Environment variables:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `FEATURE_SUPABASE_AUTH=true`
- `FEATURE_DEV_AUTH=false`
- `FEATURE_SHARED_RATELIMIT=true` (optional; enables Postgres-backed shared limiter)
- UI autofill (recommended): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
 - Advisors (optional): `SUPABASE_PAT`, `SUPABASE_PROJECT_ID`, and optionally `STRICT_ADVISORS=true`
 - EXPLAIN baselines (optional): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

CLI deploy (optional):

```powershell
npx --yes netlify-cli@17 deploy --build --prod --dir "apps/web-react/dist" --functions "apps/api/functions"
```

### What’s live

- Auth via Supabase (email/password), token persisted in localStorage
- Endpoints: users wishlist/notifications/coupons, business storefront/reviews/ads/trends/products, platform pricing/config/runtime/revenue
- Logging wraps key request handlers; x-request-id in responses and logs
- Rate limiting: IP-based with RateLimit-* headers (shared store optional)
- API docs: Swagger UI at `/api-docs` (loads `docs/api/openapi.yaml`)
- CI: typecheck + tests + OpenAPI validation; PR preview smoke; hourly smoke; daily light load


### Releases

- Latest stable: [v0.1.8](https://github.com/umamaheshmadala/BMad_Sync_1.1/releases/tag/v0.1.8)
- All releases: https://github.com/umamaheshmadala/BMad_Sync_1.1/releases


