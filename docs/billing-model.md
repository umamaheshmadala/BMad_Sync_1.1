# Billing Model — Razorpay Postpaid

Version: 1.0  
Date: 2025-08-11

## Summary
- Processor: Razorpay
- Currency: INR (₹)
- Cycle: Monthly postpaid invoice
- Threshold: If cumulative charges exceed ₹20,000 before cycle end, require immediate payment; freeze further paid services until cleared
- Visibility: Show available credit to businesses in dashboard

## Billable Items
- Coupon generation: ₹2 per coupon generated
- Promotional banner: ₹500 per day per slot
- Search top placement: ₹500 per day
- Push notifications: rate TBD (per 1k sends)

## Flow
1. On each billable event, record charge in `RevenueTracking`
2. Update `BusinessBillingAccount.current_cycle_total`
3. If `current_cycle_total` > ₹20,000 and status != `frozen` → set status `frozen`, issue payment link via Razorpay
4. Unfreeze upon successful payment webhook
5. At month end, generate invoice for remaining balance and reset counters

## Data (planning)
- BusinessBillingAccount(id, business_id, cycle_start, cycle_end, current_cycle_total, status[frozen|active], available_credit)
- RevenueTracking(id, source_type, entity_id, business_id, amount, transaction_date)

## Webhooks
- Payment success → unfreeze, post receipt
- Payment failed/expired → keep frozen, notify business owner

## Edge Cases
- Proration for partial days on banners/search placement
- Grace period toggle (owner setting) before freeze (default: none)
