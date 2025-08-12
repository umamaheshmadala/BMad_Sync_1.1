-- Performance indexes for analytics and lookups (safe to re-run)
create index if not exists idx_user_coupons_collected_at on user_coupons(collected_at);
create index if not exists idx_user_coupons_coupon_id on user_coupons(coupon_id);
create index if not exists idx_coupon_shares_shared_at on coupon_shares(shared_at);
create index if not exists idx_coupon_shares_orig_uc on coupon_shares(original_user_coupon_id);
create index if not exists idx_coupons_business_id on coupons(business_id);
create index if not exists idx_business_reviews_biz_created on business_reviews(business_id, created_at);
create index if not exists idx_businesses_owner on businesses(owner_user_id);

