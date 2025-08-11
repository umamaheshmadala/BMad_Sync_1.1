# Owner Config Dashboard — SynC MVP

Version: 1.0  
Date: 2025-08-11

## Goals
- Allow platform owner to adjust runtime tunables without code changes
- Keep MVP simple; use existing `platform_config` keys

## Sections & Controls
- Billing
  - Mode: selector [dummy, live] (default: dummy)
  - Threshold (₹): numeric (default: 20000)
  - Available Credit Info: read-only per business (from `business_billing_account`)
  - Actions: Freeze/Unfreeze business (writes `status`)
- Notifications
  - Promotions per hour: numeric (default: 3)
  - Promotions per day: numeric (default: 10)
  - Quiet hours: string HH-HH (default: 21-08)
- Coupon Sharing
  - Cap per user/day: numeric (default: 21)
  - Cap reset: [local] (read-only for MVP)
- Ads
  - Carousel slots: numeric (default: 6)
  - Rotation seconds: numeric (default: 3)
- Pricing
  - Coupon rate (₹): numeric (default: 2)
  - Banner/day (₹): numeric (default: 500)
  - Search top/day (₹): numeric (default: 500)

## UX
- Single page form with Save & Revert buttons
- Validation: ranges and formats (quiet hours HH-HH)
- Success toasts; changes persist to `platform_config` keys

## API
- Read: GET /api/platform/config (aggregated config)
- Write: PUT /api/platform/config/pricing (pricing subset)
- Write: PUT /api/platform/config/runtime (notifications, sharing, ads)

## Data
- All values persisted in `platform_config` as `{ key_name, config_value: { value: any } }`

## Security
- Require owner JWT role ('owner'); server verifies via `is_platform_owner()`
