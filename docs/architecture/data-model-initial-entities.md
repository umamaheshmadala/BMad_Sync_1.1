# Data Model (initial entities)
Users, Businesses, Storefronts, StorefrontProducts, BusinessFollows, Friends, Coupons, UserCoupons,
CouponShares, UserActivities, BusinessReviews, Notifications, Ads, Promotions, PlatformConfig,
RevenueTracking, WishlistItems, WishlistMatches

Relationships (high level):
- Users 1–N UserActivities, UserCoupons, BusinessFollows, Friends
- Businesses 1–N Storefronts, Coupons, Ads, Promotions
- Coupons 1–N UserCoupons; UserCoupons 1–N CouponShares (lineage)
