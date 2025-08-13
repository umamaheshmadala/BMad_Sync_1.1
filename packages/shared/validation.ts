import { z } from 'zod';

export const ReviewPayloadSchema = z.object({
  recommend_status: z.boolean(),
  review_text: z.string().max(200).nullable().optional(),
  checked_in_at: z.union([z.string().datetime(), z.null()]).optional(),
});

export type ReviewPayload = z.infer<typeof ReviewPayloadSchema>;

export const StorefrontProductSchema = z.object({
  product_name: z.string().min(2),
  product_description: z.string().max(200).nullable().optional(),
  product_image_url: z
    .string()
    .url()
    .refine((u) => /^https?:\/\//i.test(u), { message: 'Must be http or https URL' })
    .nullable()
    .optional(),
  category: z.string().min(1).nullable().optional(),
  subcategory_l1: z.string().min(1).nullable().optional(),
  subcategory_l2: z.string().min(1).nullable().optional(),
  display_order: z.number().int().optional(),
  is_trending: z.boolean().optional(),
  suggested: z.boolean().optional(),
});

export const StorefrontProductsPayloadSchema = z.object({
  items: z.array(StorefrontProductSchema).min(1).max(100),
});

export type StorefrontProductsPayload = z.infer<typeof StorefrontProductsPayloadSchema>;


export const CollectCouponPayloadSchema = z.object({
  coupon_id: z.string().min(1),
});

export type CollectCouponPayload = z.infer<typeof CollectCouponPayloadSchema>;

export const ShareCouponPayloadSchema = z.object({
  receiver_user_id: z.string().min(1),
});

export type ShareCouponPayload = z.infer<typeof ShareCouponPayloadSchema>;

export const BusinessAdPayloadSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(500).nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  weight: z.number().int().min(1).max(100).optional(),
  cost_per_day: z.number().min(0).optional(),
  start_date: z.union([z.string(), z.null()]).optional(),
  end_date: z.union([z.string(), z.null()]).optional(),
});

export type BusinessAdPayload = z.infer<typeof BusinessAdPayloadSchema>;

export const BusinessOfferPayloadSchema = z.object({
  title: z.string().min(1),
  description: z.string().max(500).nullable().optional(),
  terms_and_conditions: z.string().max(2000).nullable().optional(),
  value: z.number().nullable().optional(),
  total_quantity: z.number().int().min(0).nullable().optional(),
  cost_per_coupon: z.number().min(0).optional(),
  start_date: z.union([z.string(), z.null()]).optional(),
  end_date: z.union([z.string(), z.null()]).optional(),
});

export type BusinessOfferPayload = z.infer<typeof BusinessOfferPayloadSchema>;

export const StorefrontUpdatePayloadSchema = z.object({
  description: z.string().max(2000).nullable().optional(),
  theme: z.string().max(100).nullable().optional(),
  is_open: z.boolean().optional(),
});

export type StorefrontUpdatePayload = z.infer<typeof StorefrontUpdatePayloadSchema>;


// Additional payload schemas
export const WishlistItemPayloadSchema = z.object({
  item_name: z.string().min(1),
  item_description: z.string().max(500).nullable().optional(),
});

export type WishlistItemPayload = z.infer<typeof WishlistItemPayloadSchema>;

export const UserProfileInterestsPayloadSchema = z.object({
  city: z.string().min(1),
  interests: z.array(z.string().min(1)).min(1),
});

export type UserProfileInterestsPayload = z.infer<typeof UserProfileInterestsPayloadSchema>;

export const FavoriteBusinessPayloadSchema = z.object({
  business_id: z.string().uuid(),
});

export type FavoriteBusinessPayload = z.infer<typeof FavoriteBusinessPayloadSchema>;

export const GpsCheckinPayloadSchema = z.object({
  business_id: z.string().uuid(),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

export type GpsCheckinPayload = z.infer<typeof GpsCheckinPayloadSchema>;

export const OffersCouponsGeneratePayloadSchema = z.object({
  total_quantity: z.number().int().min(0).optional(),
  terms_and_conditions: z.string().max(2000).optional(),
});

export type OffersCouponsGeneratePayload = z.infer<typeof OffersCouponsGeneratePayloadSchema>;

export const RedeemPayloadSchema = z.object({
  unique_code: z.string().min(1),
});

export type RedeemPayload = z.infer<typeof RedeemPayloadSchema>;

export const IssueTargetedPayloadSchema = z.object({
  coupon_id: z.string().uuid().optional(),
  target_parameters: z.record(z.any()).optional(),
});

export type IssueTargetedPayload = z.infer<typeof IssueTargetedPayloadSchema>;

// Platform config schemas
export const PlatformPricingSchema = z.record(z.string(), z.any());

export const PlatformRuntimeConfigShapeSchema = z
  .object({
    'billing.mode': z.object({ value: z.string() }).optional(),
    'billing.threshold': z.object({ value: z.number() }).optional(),
    'notifications.promotions_per_hour': z.object({ value: z.number() }).optional(),
    'notifications.promotions_per_day': z.object({ value: z.number() }).optional(),
    'notifications.quiet_hours': z.object({ value: z.string() }).optional(),
    'coupon_sharing.cap_per_user_per_day': z.object({ value: z.number() }).optional(),
    'ads.carousel_slots': z.object({ value: z.number() }).optional(),
    'ads.rotation_sec': z.object({ value: z.number() }).optional(),
  })
  .strict();

export type PlatformRuntimeConfigShape = z.infer<typeof PlatformRuntimeConfigShapeSchema>;

