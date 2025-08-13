-- SynC — Initial Supabase Schema (planning)
-- Safe to run multiple times (IF NOT EXISTS where possible)

create extension if not exists pgcrypto;

-- Helper: platform owner role detection (expects JWT claim role='owner')
create or replace function public.is_platform_owner() returns boolean
language sql stable as $$
  select coalesce((current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'owner', false);
$$;

-- Users
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text,
  preferred_name text,
  avatar_url text,
  city text,
  interests text[] default '{}',
  is_driver boolean default false,
  driver_score numeric default 0,
  is_online boolean default false,
  created_at timestamptz default now()
);

-- Businesses
create table if not exists public.businesses (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null,
  email text unique not null,
  business_name text not null,
  address text,
  google_location_url text,
  contact_info jsonb,
  logo_url text,
  open_hours jsonb,
  status text default 'active',
  created_at timestamptz default now()
);

-- Business Verification (MVP soft docs)
create table if not exists public.business_documents (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  doc_type text,
  file_url text not null,
  uploaded_at timestamptz default now()
);

-- Storefronts
create table if not exists public.storefronts (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  description text,
  theme text,
  is_open boolean default true,
  created_at timestamptz default now()
);

-- StorefrontProducts (manual curation + suggested flags)
create table if not exists public.storefront_products (
  id uuid primary key default gen_random_uuid(),
  storefront_id uuid references public.storefronts(id) on delete cascade,
  product_name text not null,
  product_description text,
  product_image_url text,
  category text,
  subcategory_l1 text,
  subcategory_l2 text,
  display_order int,
  is_trending boolean default false,
  suggested boolean default false,
  created_at timestamptz default now()
);

-- BusinessFollows
create table if not exists public.business_follows (
  user_id uuid references public.users(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  receive_notifications boolean default true,
  created_at timestamptz default now(),
  primary key (user_id, business_id)
);

-- Friends
create table if not exists public.friends (
  user_id uuid references public.users(id) on delete cascade,
  friend_id uuid references public.users(id) on delete cascade,
  status text check (status in ('pending','accepted','blocked')) not null,
  accepted_at timestamptz,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);

-- Coupons / UserCoupons / Shares
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  title text,
  description text,
  terms_and_conditions text,
  value numeric,
  start_date date,
  end_date date,
  total_quantity int,
  cost_per_coupon numeric default 2
);

create table if not exists public.user_coupons (
  id uuid primary key default gen_random_uuid(),
  coupon_id uuid references public.coupons(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  unique_code text unique,
  is_redeemed boolean default false,
  redeemed_at timestamptz,
  current_owner_id uuid references public.users(id),
  transfer_count int default 0,
  collected_at timestamptz default now()
);

create table if not exists public.coupon_shares (
  id uuid primary key default gen_random_uuid(),
  original_user_coupon_id uuid references public.user_coupons(id) on delete cascade,
  sharer_user_id uuid references public.users(id),
  receiver_user_id uuid references public.users(id),
  shared_coupon_instance_id uuid references public.user_coupons(id),
  shared_at timestamptz default now()
);

-- Activities & Reviews
create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  business_id uuid references public.businesses(id),
  activity_type text,
  entity_id uuid,
  activity_data jsonb,
  occurred_at timestamptz default now()
);

create table if not exists public.business_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  recommend_status boolean not null,
  review_text text,
  checked_in_at timestamptz,
  created_at timestamptz default now()
);

-- Notifications
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid references public.users(id) on delete cascade,
  sender_business_id uuid references public.businesses(id),
  notification_type text,
  message text,
  deep_link_url text,
  created_at timestamptz default now(),
  read_at timestamptz
);

-- Ads / Promotions
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  title text,
  description text,
  image_url text,
  weight int default 1, -- carousel weight
  cost_per_day numeric default 500,
  start_date date,
  end_date date
);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  title text,
  description text,
  target_parameters jsonb,
  start_date date,
  end_date date
);

-- Platform Config & Revenue
create table if not exists public.platform_config (
  key_name text primary key,
  config_value jsonb
);

create table if not exists public.revenue_tracking (
  id uuid primary key default gen_random_uuid(),
  source_type text,
  entity_id uuid,
  business_id uuid references public.businesses(id) on delete cascade,
  amount numeric not null,
  transaction_date timestamptz default now()
);

-- Wishlist
create table if not exists public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  item_name text not null,
  item_description text,
  category text,
  subcategory_l1 text,
  subcategory_l2 text,
  created_at timestamptz default now()
);

create table if not exists public.wishlist_matches (
  id uuid primary key default gen_random_uuid(),
  wishlist_item_id uuid references public.wishlist_items(id) on delete cascade,
  business_id uuid references public.businesses(id) on delete cascade,
  coupon_id uuid references public.coupons(id),
  matched_at timestamptz default now(),
  notification_sent_at timestamptz
);

-- Billing (dummy-ready)
create table if not exists public.business_billing_account (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  cycle_start date,
  cycle_end date,
  current_cycle_total numeric default 0,
  status text default 'active', -- active|frozen
  available_credit numeric default 20000
);

-- Defaults / Seeds in platform_config
insert into public.platform_config(key_name, config_value) values
  ('billing.mode', '{"value":"dummy"}'::jsonb),
  ('billing.threshold', '{"value":20000}'::jsonb),
  ('ads.carousel_slots', '{"value":6}'::jsonb),
  ('ads.rotation_sec', '{"value":3}'::jsonb)
  on conflict (key_name) do nothing;

-- Additional runtime-tunable config
insert into public.platform_config(key_name, config_value) values
  ('notifications.promotions_per_hour', '{"value":3}'::jsonb),
  ('notifications.promotions_per_day', '{"value":10}'::jsonb),
  ('notifications.quiet_hours', '{"value":"21-08"}'::jsonb),
  ('coupon_sharing.cap_per_user_per_day', '{"value":21}'::jsonb),
  ('coupon_sharing.cap_reset_tz', '{"value":"local"}'::jsonb)
  on conflict (key_name) do nothing;

-- Reference tables for onboarding and lookup
create table if not exists public.ref_cities (
  name text primary key,
  tier text check (tier in ('tier1','tier2','tier3')) not null
);

create table if not exists public.ref_interests (
  name text primary key
);

-- Optional admin/membership scaffolding for future flexibility
create table if not exists public.platform_admins (
  user_id uuid primary key,
  created_at timestamptz default now()
);

create table if not exists public.business_members (
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text check (role in ('owner','admin','editor','viewer')) not null,
  added_at timestamptz default now(),
  primary key (business_id, user_id)
);

-- Seed common Indian cities (subset for MVP)
insert into public.ref_cities(name, tier) values
  ('Mumbai','tier1'), ('Delhi','tier1'), ('Bengaluru','tier1'), ('Hyderabad','tier1'), ('Chennai','tier1'), ('Kolkata','tier1'), ('Pune','tier1'), ('Ahmedabad','tier1'),
  ('Surat','tier2'), ('Jaipur','tier2'), ('Lucknow','tier2'), ('Kanpur','tier2'), ('Nagpur','tier2'), ('Indore','tier2'), ('Bhopal','tier2'), ('Patna','tier2'),
  ('Vadodara','tier2'), ('Ghaziabad','tier2'), ('Coimbatore','tier2'), ('Kochi','tier2'), ('Visakhapatnam','tier2'), ('Thiruvananthapuram','tier2'), ('Noida','tier2'),
  ('Guwahati','tier3'), ('Rajkot','tier3'), ('Ranchi','tier3'), ('Jodhpur','tier3'), ('Vijayawada','tier3'), ('Madurai','tier3'), ('Mysuru','tier3'), ('Varanasi','tier3'),
  ('Dehradun','tier3'), ('Amritsar','tier3'), ('Chandigarh','tier3'), ('Aurangabad','tier3'), ('Jabalpur','tier3'), ('Nashik','tier3'), ('Mangalore','tier3')
  on conflict (name) do nothing;

-- Seed interests (from PRD list)
insert into public.ref_interests(name) values
  ('Active Life'), ('Arts & Entertainment'), ('Automotive'), ('Beauty & Spas'), ('Education'), ('Event Planning & Services'), ('Financial Services'),
  ('Food'), ('Health & Medical'), ('Home Services'), ('Hotels & Travel'), ('Local Flavor'), ('Local Services'), ('Mass Media'), ('Nightlife'), ('Pets'),
  ('Professional Services'), ('Public Services & Government'), ('Real Estate'), ('Religious Organizations'), ('Restaurants'), ('Shopping')
  on conflict (name) do nothing;

-- Indexes
create index if not exists idx_users_city on public.users(city);
create index if not exists idx_storefront_products_storefront on public.storefront_products(storefront_id);
create index if not exists idx_coupons_business on public.coupons(business_id);
create index if not exists idx_user_coupons_user on public.user_coupons(user_id);
create index if not exists idx_notifications_user on public.notifications(recipient_user_id);

-- Shared rate limit table (optional, for multi-instance accuracy)
create table if not exists public.rate_limits (
  key text primary key,
  window_start integer not null,
  count integer not null default 0
);
create index if not exists idx_rate_limits_window on public.rate_limits(window_start);