# SynC — Front-End Specification

Version: 1.0  
Date: 2025-08-11  
Owner: UX Expert

## Goals
- Modern, intuitive, responsive web app for consumers, businesses, and platform owner
- Reduce cognitive load; clear navigation; fast perceived performance (<2s)
- Support interest-based personalization and real-time updates

## Tech & Libraries
- React + Vite + TypeScript
- Tailwind CSS + Shadcn UI (theme option: cosmic-night)
- Form handling: React Hook Form + Zod
- Data fetching: TanStack Query
- Icons: Lucide
- Charts (analytics): Recharts (or Chart.js)

## App Structure
- Layouts: `RootLayout` (shell), `DashboardLayout` (auth-guarded)
- Routing (example):
  - `/` Landing (minimal)
  - `/auth/login`, `/auth/signup`, `/auth/reset`
  - `/onboarding/city-interests` (first login only; skip if interests exist)
  - `/dashboard` (user default after login)
  - `/dashboard/wallet`
  - `/dashboard/wishlist`
  - `/dashboard/favorites`
  - `/dashboard/friends`
  - `/business/:businessId` (storefront)
  - `/business/portal` (business dashboard)
  - `/owner` (platform owner dashboard)
  - `/search` (discovery)

## Navigation & Global UI
- Top App Bar: city selector, search, notifications bell, avatar menu
- Left Sidebar (dashboard): Wallet, Wishlist, Favorites, Friends, Discover
- Right Sidebar (optional): contacts/quick actions
- Global Toaster; skeletons for loading states
 - Global Toaster; skeletons for loading states; copy-to-clipboard for JSON and cURL
- Ads: 6‑slot carousel on dashboard with 3s auto‑rotate; minimal chrome to keep dashboard clean

## Key Screens (MVP)
- Auth: login/signup/reset with clear errors
- Onboarding: city (India Tier 1/2/3), choose >=5 interests
- Dashboard: hot/trending offers, targeted ads, city switcher, quick links
- Wallet: collected coupons; filters; status badges
- Wishlist: add item; auto category preview; link to search
- Favorites: businesses and coupons tabs
- Friends: find/search; requests; favorites; basic activity
- Storefront: branding, location, offers, trending products; follow/favorite; available coupons
- Business Portal: profile, offers/coupons, analytics snapshots, recommendations
- Owner: revenue overview; visibility and pricing controls
 - Owner: revenue overview; pricing controls; rate limit diagnostics
- Search: filters (city, category, interests), results grid

## Components (selected)
- CitySelect, InterestMultiSelect, SearchBar, OfferCard, CouponCard, ProductPill, StorefrontHeader,
  TrendGrid, AdBanner, NotificationItem, AvatarWithRing (Driver), EmptyState, Pagination, Tabs,
  Drawer/Modal forms (Shadcn)

## State & Data
- Auth/session: Supabase client; role-aware UI; protected routes
- Query cache: TanStack Query for offers, coupons, storefronts, analytics
- Forms: RHF + Zod; inline validation and a11y messages

## Realtime & Notifications
- In-app realtime subscriptions (phase 1), optimistic UI
- Web push later; MVP uses in-app toasts with deep links

## Accessibility
- Keyboard-first; focus rings; semantic landmarks
- Toasts use `aria-live="polite"` for announcements
- Axe runs in CI against preview (gated by `AXE_CI=true`)
- Contrast AA; prefers-reduced-motion

## Performance
- Route code splitting; image lazy loading; skeletons
- Bundle size budgets enforced in CI; Lighthouse runs on preview URL (/react) with perf > 90
- Debounced search; minimized layout shift

## Error & Empty States
- Standard error component with retry
- Empty states with CTA (add interests, find friends, collect coupons)

## Theming
- Tailwind tokens; Shadcn theme aligned to the provided dark neon reference (cosmic‑night vibe)
- Colors: deep charcoal backgrounds, purple/indigo gradients, soft glows, high‑contrast white/gray text
- Dark mode default

## Dev UX
- Local dev opens Chrome Incognito
- .env for Supabase URLs/keys; mock seeds for empty states

## Analytics Hooks (UI)
- Track offer/coupon clicks, storefront visits, ad impressions
- Respect privacy settings
- Capture request IDs on failures and tag Sentry events with `x-request-id`

## Table Behavior (Dev UI)
- Persisted per table via `localStorage`:
  - Offers: order, page, page size, search
  - Coupons preview: order, page, page size, search
  - Reviews: filter, order, page, page size
- Navigation controls:
  - First/Prev/Next/Last buttons
  - Go-to-page input (enter page number, click go)
- Sorting arrows: ▲ for ascending, ▼ for descending next to the active header

## Mini-Charts
- Trends: daily inline bars for reviews total and coupons collected (from `trendsResult.trends`)
- Funnel: collected vs redeemed daily double bars using coupons series
- Reviews: daily recommend vs not‑recommend bars using `trendsResult.trends.reviews`

## Analytics Controls (UI)
- Persisted controls via localStorage:
  - `sync_analytics_since_days` (number)
  - `sync_analytics_tz` (string)
  - `sync_analytics_fill` (boolean as '1' or '')
- Reusable component: `apps/web-react/src/ui/components/AnalyticsControls.tsx` used across Trends, Funnel, and Issued.
- Timezone presets dropdown with free‑text fallback (IANA): `UTC`, `America/Los_Angeles`, `America/New_York`, `Europe/London`, `Europe/Berlin`, `Asia/Kolkata`, `Asia/Singapore`, `Australia/Sydney`.
- CSV exports open endpoints with `?format=csv` for Trends, Funnel, Reviews Summary; Reviews table provides client‑side CSV export of the current list; Issued grouped table supports client-side grouped CSV.
 - Issued grouped: server-side sort and pagination via `order`, `limit`, `offset`. When these are present with `group=business`, the API returns a `grouped` array with summary rows and CSV export returns a summary CSV. Default order is `total.desc`. UI persists `order/limit/offset`.

## Caching & Revalidation

Add examples for `If-None-Match` and `If-Modified-Since` for JSON and CSV.

### Locale-aware CSV downloads

- Trends, Funnel, Reviews Summary, and Coupons Issued support localized CSV headers for `en`, `es`, `fr`, `pt`.
- Send `Accept-Language: <locale>` to localize header row and set `Content-Language`.
- CSV filenames include locale suffix and RFC5987 `filename*` parameter. The browser should honor `filename*`; a plain ASCII `filename` fallback is also provided.

Example (download via fetch → blob):

```ts
const res = await fetch('/api/business/analytics/trends?format=csv', { headers: { 'Accept-Language': 'fr-FR' } });
const blob = await res.blob();
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
 a.href = url;
 a.download = 'fallback.csv'; // server sets filename via headers
 a.click();
 URL.revokeObjectURL(url);
```

### cURL recipes (JSON/CSV with Accept-Language)

```bash
# Trends JSON (English)
curl -sS \
  -H "Authorization: $OWNER_BEARER" \
  "$BASE_URL/api/business/analytics/trends?sinceDays=7"

# Trends CSV (French)
curl -sS -D - \
  -H "Authorization: $OWNER_BEARER" \
  -H "Accept-Language: fr" \
  "$BASE_URL/api/business/analytics/trends?sinceDays=7&format=csv" -o trends_fr.csv

# Funnel CSV (Spanish)
curl -sS -D - \
  -H "Authorization: $OWNER_BEARER" \
  -H "Accept-Language: es" \
  "$BASE_URL/api/business/analytics/funnel?sinceDays=7&format=csv" -o funnel_es.csv

# Reviews Summary CSV (Portuguese)
curl -sS -D - \
  -H "Authorization: $OWNER_BEARER" \
  -H "Accept-Language: pt" \
  "$BASE_URL/api/business/analytics/reviews-summary?businessId=test-biz-1&sinceDays=7&format=csv" -o reviews_summary_pt.csv

# Coupons Issued CSV grouped (Owner; English)
curl -sS -D - \
  -H "Authorization: $OWNER_BEARER" \
  "$BASE_URL/api/business/analytics/coupons-issued?group=business&sinceDays=30&order=total.desc&limit=10&format=csv" -o coupons_issued_en.csv
```

### UI i18n and accessibility

- Strings centralized in `apps/web-react/src/ui/i18n.ts`; prefer a future `LocaleProvider` + `useLocale()` for component access.
- Locale source of truth is URL `?locale=`; keep `localStorage` in sync for persistence.
- Provide explicit roles/aria for tables and paginator; use `aria-live="polite"` for status.
- Tooltips should be available on focus and dismissible via ESC.

## ETag Revalidation Examples (JS)

```ts
// JSON with If-None-Match
async function fetchWithEtag(url) {
  const res1 = await fetch(url);
  const etag = res1.headers.get('ETag');
  if (!etag) return await res1.json();
  const res2 = await fetch(url, { headers: { 'If-None-Match': etag } });
  if (res2.status === 304) return null; // not modified
  return await res2.json();
}

// CSV with If-Modified-Since
async function fetchCsvWithLastModified(url) {
  const res1 = await fetch(url);
  const lm = res1.headers.get('Last-Modified');
  if (!lm) return await res1.text();
  const res2 = await fetch(url, { headers: { 'If-Modified-Since': lm } });
  if (res2.status === 304) return null;
  return await res2.text();
}
```

## Acceptance Notes per Story (UI)
- 1.2: Auth pages → `/dashboard` on success
- 2.3: Onboarding only if interests missing
- 3.5: Share modal with confirm, cap indicators
- 3.8: Driver avatar ring visible
- 4.x: Charts on business/owner dashboards

## Open UI Decisions
- Final interests taxonomy and city list JSON
- Additional component libs (reactbits) selection
- Ad placements (above/below the fold)
