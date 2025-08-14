# Analytics Controls (UI)
- Persisted controls via localStorage:
  - `sync_analytics_since_days` (number)
  - `sync_analytics_tz` (string)
  - `sync_analytics_fill` (boolean as '1' or '')
- Reusable component: `apps/web-react/src/ui/components/AnalyticsControls.tsx` used across Trends, Funnel, and Issued.
- Timezone presets dropdown with free‑text fallback (IANA): `UTC`, `America/Los_Angeles`, `America/New_York`, `Europe/London`, `Europe/Berlin`, `Asia/Kolkata`, `Asia/Singapore`, `Australia/Sydney`.
- CSV exports open endpoints with `?format=csv` for Trends, Funnel, Reviews Summary; Reviews table provides client‑side CSV export of the current list; Issued grouped table supports client-side grouped CSV.
 - Issued grouped: server-side sort and pagination via `order`, `limit`, `offset`. When these are present with `group=business`, the API returns a `grouped` array with summary rows and CSV export returns a summary CSV. Default order is `total.desc`. UI persists `order/limit/offset`.
