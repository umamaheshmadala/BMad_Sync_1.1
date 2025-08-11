# Test Seeds — SynC MVP

Version: 1.0  
Date: 2025-08-11

## Entities
- Users: test-user-1, test-user-2 (fixed UUIDs)
- Businesses: test-biz-1 (owner user), with storefront
- Storefront products: 4 items with categories
- Offers: 1 with generated coupons (10 qty)
- User coupons: collected 1 coupon for test-user-1

## Application
- Insert into `ref_cities`, `ref_interests` already handled by schema
- Insert entities in a single transaction per test to allow rollback
- Ensure `platform_config.billing.mode = 'dummy'`

## Notes
- Avoid real external calls; all side-effects recorded in DB tables
- Use ISO timestamps; freeze clock in tests for determinism
