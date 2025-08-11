# Notifications Policy — MVP

Version: 1.0  
Date: 2025-08-11

## Channels
- In-app realtime (toasts, inbox)
- Push notifications (Phase 2)

## Throttling (best-practice defaults)
- Promotions: max 3 per user per hour, max 10 per user per day
- Social: friend requests/acceptances unthrottled but deduplicated within 5 minutes
- Coupon events: accept/decline/redeemed — real-time; collapse multiple updates within 2 minutes

## Quiet Hours
- 21:00–08:00 local time for push (Phase 2); in-app allowed but no disruptive sounds

## Payload Limits
- Title + message <= 20 words for promos; include deep links

## Preferences
- Users can disable direct notifications from a business (still follow)
- Granular ad/promo categories in `privacy_settings`

## Admin Controls
- Platform owner can adjust throttling windows and quiet hours at runtime
