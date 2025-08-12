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


