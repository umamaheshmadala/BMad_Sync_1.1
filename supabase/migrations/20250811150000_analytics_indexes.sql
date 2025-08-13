-- Analytics-friendly indexes
create index if not exists idx_business_reviews_biz_created on public.business_reviews(business_id, created_at);
create index if not exists idx_user_coupons_coupon_redeemed_collected on public.user_coupons(coupon_id, is_redeemed, collected_at);
create index if not exists idx_user_activities_user_occurred on public.user_activities(user_id, occurred_at);

