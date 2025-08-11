-- SynC — Initial RLS Policies (planning)

-- Enable RLS
alter table public.users enable row level security;
alter table public.businesses enable row level security;
alter table public.business_documents enable row level security;
alter table public.storefronts enable row level security;
alter table public.storefront_products enable row level security;
alter table public.business_follows enable row level security;
alter table public.friends enable row level security;
alter table public.coupons enable row level security;
alter table public.user_coupons enable row level security;
alter table public.coupon_shares enable row level security;
alter table public.user_activities enable row level security;
alter table public.business_reviews enable row level security;
alter table public.notifications enable row level security;
alter table public.ads enable row level security;
alter table public.promotions enable row level security;
alter table public.platform_config enable row level security;
alter table public.revenue_tracking enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.wishlist_matches enable row level security;
alter table public.business_billing_account enable row level security;

-- Helper functions
create or replace function public.auth_uid() returns uuid language sql stable as $$
  select coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid, null)
$$;

-- Users: self read/write
create policy users_self_select on public.users
  for select using (id = public.auth_uid() or public.is_platform_owner());
create policy users_self_update on public.users
  for update using (id = public.auth_uid());

-- Businesses: owner_user_id matches caller; public can select storefront basics via joins
create policy businesses_owner_select on public.businesses
  for select using (owner_user_id = public.auth_uid() or public.is_platform_owner());
create policy businesses_owner_update on public.businesses
  for update using (owner_user_id = public.auth_uid());
create policy businesses_owner_insert on public.businesses
  for insert with check (owner_user_id = public.auth_uid());

-- Business documents: only business owner and platform owner
create policy biz_docs_owner on public.business_documents
  for all using (
    exists(select 1 from public.businesses b where b.id = business_id and b.owner_user_id = public.auth_uid())
    or public.is_platform_owner()
  );

-- Storefronts / products: business owner controls
create policy storefronts_owner_all on public.storefronts
  for all using (
    exists(select 1 from public.businesses b where b.id = business_id and b.owner_user_id = public.auth_uid())
    or public.is_platform_owner()
  );
create policy storefront_products_owner_all on public.storefront_products
  for all using (
    exists(select 1 from public.storefronts s join public.businesses b on b.id = s.business_id where s.id = storefront_id and b.owner_user_id = public.auth_uid())
    or public.is_platform_owner()
  );

-- Follows and friends: user scoped
create policy follows_user on public.business_follows for all using (user_id = public.auth_uid());
create policy friends_user on public.friends for all using (user_id = public.auth_uid());

-- Coupons: business owner manage; users read via derived endpoints
create policy coupons_biz_owner on public.coupons for all using (
  exists(select 1 from public.businesses b where b.id = business_id and b.owner_user_id = public.auth_uid())
  or public.is_platform_owner()
);

-- User coupons: owner user
create policy user_coupons_owner on public.user_coupons for all using (user_id = public.auth_uid());

-- Shares: owner either side can view; insert by sharer
create policy shares_view on public.coupon_shares for select using (
  sharer_user_id = public.auth_uid() or receiver_user_id = public.auth_uid() or public.is_platform_owner()
);
create policy shares_insert on public.coupon_shares for insert with check (sharer_user_id = public.auth_uid());

-- Activities/Reviews: user authored
create policy activities_owner on public.user_activities for all using (user_id = public.auth_uid());
create policy reviews_owner on public.business_reviews for all using (user_id = public.auth_uid());

-- Notifications: recipient scoped
create policy notifications_recipient on public.notifications for all using (recipient_user_id = public.auth_uid());

-- Ads/Promotions: business owner
create policy ads_owner on public.ads for all using (
  exists(select 1 from public.businesses b where b.id = business_id and b.owner_user_id = public.auth_uid())
  or public.is_platform_owner()
);
create policy promotions_owner on public.promotions for all using (
  exists(select 1 from public.businesses b where b.id = business_id and b.owner_user_id = public.auth_uid())
  or public.is_platform_owner()
);

-- Platform config & revenue: platform owner only
create policy platform_config_owner on public.platform_config for all using (public.is_platform_owner());
create policy revenue_owner on public.revenue_tracking for all using (public.is_platform_owner());

-- Config-based caps: add seeds for runtime control later (stored in platform_config)

-- Wishlist: user scoped
create policy wishlist_owner on public.wishlist_items for all using (user_id = public.auth_uid());
create policy wishlist_matches_owner on public.wishlist_matches for select using (
  exists(select 1 from public.wishlist_items w where w.id = wishlist_item_id and w.user_id = public.auth_uid())
  or public.is_platform_owner()
);

-- Billing account: business owner and platform owner
create policy billing_owner on public.business_billing_account for all using (
  exists(select 1 from public.businesses b where b.id = business_id and b.owner_user_id = public.auth_uid())
  or public.is_platform_owner()
);
