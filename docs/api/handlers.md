# API Handlers Mapping — SynC MVP

This maps `docs/api/openapi.yaml` routes to serverless function names and expected IO. Implement using Netlify Functions or Supabase Edge Functions.

## Conventions
- Directory: `apps/api/functions/`
- File name: kebab-case by path segment
- Auth: verify Supabase JWT; inject `userId` from claims when applicable

## Mappings
- POST /api/auth/signup → `auth-signup.ts`
- POST /api/auth/login → `auth-login.ts`
- PUT /api/users/{userId}/profile/interests → `users-profile-interests-put.ts`
- GET /api/users/{userId}/dashboard → `users-dashboard-get.ts`
- POST /api/users/{userId}/favorites/business → `users-favorites-business-post.ts`
- POST /api/users/{userId}/wishlist → `users-wishlist-post.ts`
- GET /api/users/{userId}/wishlist/matches → `users-wishlist-matches-get.ts`
- POST /api/users/{userId}/coupons/collect → `users-coupons-collect-post.ts`
- POST /api/users/{userId}/coupons/{couponId}/share → `users-coupons-share-post.ts`
- POST /api/users/{userId}/coupons/shared/{shareId}/cancel → `users-coupons-shared-cancel-post.ts`
- POST /api/users/{userId}/checkin/gps → `users-checkin-gps-post.ts`
- POST /api/business/signup → `business-signup.ts`
- POST /api/business/login → `business-login.ts`
- POST/GET /api/business/storefront → `business-storefront.ts`
- POST/GET /api/storefronts/{storefrontId}/products → `storefronts-products-post.ts`
- POST /api/business/offers → `business-offers-post.ts`
- POST /api/business/offers/{offerId}/coupons → `business-offers-coupons-post.ts`
- POST /api/business/{businessId}/redeem → `business-redeem-post.ts`
- GET /api/business/{businessId}/analytics/reviews → `business-analytics-reviews-get.ts`
- POST /api/business/{businessId}/reviews → `business-reviews-post.ts`
- GET /api/business/{businessId}/analytics/coupons → `business-analytics-coupons-get.ts`
- GET /api/business/analytics/trends → `business-analytics-trends-get.ts`
- GET /api/business/analytics/funnel → `business-analytics-funnel-get.ts`
- POST /api/business/coupons/issue-targeted → `business-coupons-issue-targeted-post.ts`
- POST /api/business/ads → `business-ads-post.ts`
- GET /api/platform/revenue → `platform-revenue-get.ts`
- GET /api/platform/health → `platform-health-get.ts`
- PUT /api/platform/config/pricing → `platform-config-pricing-put.ts`
- (Add) GET /api/platform/config → `platform-config-get.ts`
- (Add) PUT /api/platform/config/runtime → `platform-config-runtime-put.ts`

## Shared Utilities (packages/shared)
- supabaseClient.ts: factory by service role / anon
- auth.ts: JWT verification, role checks (owner)
- config.ts: read/write `platform_config`
- notifications.ts: in-memory queue honors throttles from config (CI)
- billing.ts: dummy sink; when mode=dummy, log-only to `revenue_tracking`

## Test Notes
- Integration: mock Supabase network; use test DB or branch; wrap writes in transactions
- E2E: stub billing/notifications; assert DB side-effects only
