# Dev Runbook — SynC MVP

## Apply DB
See `docs/db-apply.md` (schema then RLS). Ensure `platform_config.billing.mode = 'dummy'`.

## Run API locally
- Place serverless functions under `apps/api/functions/`
- Use Netlify dev or your chosen runtime; examples assume Netlify

```bash
# install
npm i -g netlify-cli
# from repo root (configure directory to netlify/functions or point to apps/api/functions)
netlify dev
```

Environment variables required:

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Optional (observability/tools):

```
# Sentry (frontend/backend)
VITE_SENTRY_DSN=...
SENTRY_DSN=...

# CI tools
SUPABASE_PAT=...
SUPABASE_PROJECT_ID=...
STRICT_ADVISORS=true
EXPLAIN_MAX_ROWS=100000
EXPLAIN_STRICT=true
```

## Test quick calls (stubs)
- PUT /api/users/{userId}/profile/interests
- POST /api/users/{userId}/wishlist
- POST /api/users/{userId}/coupons/collect
- POST /api/users/{userId}/coupons/{couponId}/share
- POST /api/users/{userId}/coupons/shared/{shareId}/cancel
- POST /api/business/{businessId}/redeem
- GET /api/business/{businessId}/analytics/reviews
- GET /api/business/{businessId}/analytics/coupons
- GET /api/platform/config
- PUT /api/platform/config/runtime
- GET /api/platform/revenue (owner only)
- GET /api/platform/ratelimit (owner only; returns message if shared limiter disabled)
- POST/GET /api/business/storefront

## Notes
- Handlers return placeholder JSON until wired to Supabase
- Shared helpers in `packages/shared/` provide mocks for config/notifications/auth

## API Docs (Swagger UI)

- Visit `/api-docs` on the deployed site to view the OpenAPI spec. The page shows the current spec version and links to the YAML (`docs/api/openapi.yaml`).

## cURL examples (replace tokens/ids)
```bash
# Update profile interests
curl -X PUT "$BASE/api/users/$USER_ID/profile/interests" \
 -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
 -d '{"city":"Bengaluru","interests":["Shopping","Food"]}'

# Add wishlist item
curl -X POST "$BASE/api/users/$USER_ID/wishlist" \
 -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
 -d '{"item_name":"Running Shoes","item_description":"Lightweight"}'

# Collect coupon
curl -X POST "$BASE/api/users/$USER_ID/coupons/collect" \
 -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
 -d '{"coupon_id":"$COUPON_ID"}'

# Share coupon
curl -X POST "$BASE/api/users/$USER_ID/coupons/$COUPON_ID/share" \
 -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" \
 -d '{"receiver_user_id":"$RECEIVER_ID"}'

# Cancel share
curl -X POST "$BASE/api/users/$USER_ID/coupons/shared/$SHARE_ID/cancel" -H "Authorization: Bearer $JWT"

# Redeem at business
curl -X POST "$BASE/api/business/$BUSINESS_ID/redeem" \
 -H "Authorization: Bearer $BIZ_JWT" -H "Content-Type: application/json" \
 -d '{"unique_code":"$UNIQUE_CODE"}'

# Business analytics
curl "$BASE/api/business/$BUSINESS_ID/analytics/reviews"
curl "$BASE/api/business/$BUSINESS_ID/analytics/coupons"

# Platform (owner-only)
curl -H "Authorization: Bearer $BIZJWT" "$BASE/api/platform/revenue"
curl -H "Authorization: Bearer $BIZJWT" "$BASE/api/platform/ratelimit"
```

## Windows quickstart (PowerShell)

1) Set environment variables for Supabase:

```powershell
$env:SUPABASE_URL = "https://<your-project>.supabase.co"
$env:SUPABASE_ANON_KEY = "<anon-key>"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service-role-key>"
```

2) Run the API locally (use polling to avoid file watch issues on Windows):

```powershell
$env:CHOKIDAR_USEPOLLING = "1"
npx --yes netlify-cli@17 dev --port 8888 --no-open
```

3) Seed minimal data (one-time). If env vars are injected correctly, run:

```powershell
Invoke-RestMethod -UseBasicParsing -Uri http://localhost:8888/api/tests/seed -Method POST -ContentType 'application/json'
```

If the function reports missing Supabase env, pass URL and service key in the body instead:

```powershell
$body = @{ supabase_url = $env:SUPABASE_URL; service_key = $env:SUPABASE_SERVICE_ROLE_KEY } | ConvertTo-Json -Compress
Invoke-RestMethod -UseBasicParsing -Uri http://localhost:8888/api/tests/seed -Method POST -ContentType 'application/json' -Body $body
```

4) One-shot sanity script (adjust IDs if needed):

```powershell
$BASE = "http://localhost:8888"
$header = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"alg":"none","typ":"JWT"}'))
$userPayload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"sub":"11111111-1111-1111-1111-111111111111"}'))
$bizPayload = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes('{"sub":"11111111-1111-1111-1111-111111111111","role":"owner"}'))
$JWT = "Bearer $header.$userPayload."
$BIZJWT = "Bearer $header.$bizPayload."
$headers = @{ Authorization = $JWT; 'Content-Type' = 'application/json' }
$bizHeaders = @{ Authorization = $BIZJWT; 'Content-Type' = 'application/json' }
$u = '11111111-1111-1111-1111-111111111111'
$u2 = '22222222-2222-2222-2222-222222222222'
$biz = '33333333-3333-3333-3333-333333333333'
$coupon = '44444444-4444-4444-4444-444444444444'

# interests + wishlist
$r1 = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/users/$u/profile/interests" -Method PUT -Headers $headers -Body '{"city":"Bengaluru","interests":["Shopping"]}'
$r2 = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/users/$u/wishlist" -Method POST -Headers $headers -Body '{"item_name":"Running Shoes","item_description":"Lightweight"}'

# collect + share + cancel + re-share + redeem
$collectBody = @{ coupon_id = $coupon } | ConvertTo-Json -Compress
$collect = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/users/$u/coupons/collect" -Method POST -Headers $headers -Body $collectBody
$shareBody = @{ receiver_user_id = $u2 } | ConvertTo-Json -Compress
$share = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/users/$u/coupons/$coupon/share" -Method POST -Headers $headers -Body $shareBody
$cancel = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/users/$u/coupons/shared/$($share.share_id)/cancel" -Method POST -Headers $headers
$reshare = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/users/$u/coupons/$coupon/share" -Method POST -Headers $headers -Body $shareBody
$redeemBody = @{ unique_code = $reshare.unique_code } | ConvertTo-Json -Compress
$redeem = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/business/$biz/redeem" -Method POST -Headers $bizHeaders -Body $redeemBody

# storefront + analytics + platform endpoints
$storeUp = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/business/storefront" -Method POST -Headers $bizHeaders -Body '{"description":"Great store","theme":"light","is_open":true}'
$storeGet = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/business/storefront" -Method GET -Headers $bizHeaders
$reviews = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/business/$biz/analytics/reviews" -Method GET -Headers $bizHeaders
$coupons = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/business/$biz/analytics/coupons" -Method GET -Headers $bizHeaders
$platformCfg = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/platform/config" -Method GET
$platformRun = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/platform/config/runtime" -Method PUT -Headers $bizHeaders -Body '{"ads.carousel_slots":{"value":5}}'
$platformRev = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/platform/revenue" -Method GET

# Owner-only ratelimit diagnostics
$platformRate = Invoke-RestMethod -UseBasicParsing -Uri "$BASE/api/platform/ratelimit" -Method GET -Headers $bizHeaders

[pscustomobject]@{
  interests = $r1.ok
  wishlist = $r2.ok
  collect = $collect.ok
  share = $share.ok
  cancel = $cancel.ok
  redeem = $redeem.ok
  storefrontUp = $storeUp.ok
  storefrontGet = $storeGet.ok
  analyticsReviews = $reviews.ok
  analyticsCoupons = $coupons.ok
  platformCfg = $platformCfg.'billing.mode'.value
  platformRun = $platformRun.ok
  platformRev = [bool]$platformRev.coupon_revenue
  platformRate = $platformRate.ok
} | ConvertTo-Json -Compress
```

## Windows shell notes

- PowerShell does not support `&&` for command chaining. Run commands separately (e.g., `npm run test` then `npm run build:web`).

