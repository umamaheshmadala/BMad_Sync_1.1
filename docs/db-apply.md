# Apply Database Schema (Supabase)

Version: 1.0  
Date: 2025-08-11

## Prereqs
- A Supabase project (dummy billing: no Razorpay keys required)
- Access to the SQL editor in Supabase dashboard or Supabase CLI

## Order of operations
1) Open Supabase SQL editor
2) Paste and run (in order):
   - `docs/supabase_schema.sql`
   - `docs/rls_policies.sql`
   - `supabase/migrations/20250811145000_perf_indexes.sql`
3) Verify tables and policies in Table Editor
4) (Optional) Seed lookup tables if needed again (already included in schema file)
5) Create service role (dashboard → Settings → API) for serverless use later

## Notes
- Schema uses city-only matching for MVP; lat/lng can be added later
- Billing mode seeded to `dummy` (`platform_config.billing.mode`)
- Runtime-tunable values stored in `platform_config` (notifications, coupon caps, carousel slots)

## CLI alternative
```bash
# From repo root (adjust path if needed)
# 1. Apply schema
supabase db query < docs/supabase_schema.sql
# 2. Apply RLS policies
supabase db query < docs/rls_policies.sql
# 3. Apply performance indexes
supabase db query < supabase/migrations/20250811145000_perf_indexes.sql
```

## Rollback safety
- Files use IF NOT EXISTS where possible; re-running is safe
- To reset seeds: delete rows from `platform_config`, `ref_cities`, `ref_interests` and rerun
