import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequestAsync, isPlatformOwnerAsync } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { WishlistItemPayloadSchema } from '../../../packages/shared/validation';

export default withRequestLogging('users-wishlist-post', withRateLimit('users-wishlist-post', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  try {
    const callerId = await getUserIdFromRequestAsync(req);
    if (!callerId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (callerId !== userId && !(await isPlatformOwnerAsync(req))) {
      return json({ ok: false, error: 'Forbidden' }, { status: 403 });
    }
    const body = await req.json();
    const parsed = WishlistItemPayloadSchema.safeParse(body);
    if (!parsed.success || !userId) {
      return json({ ok: false, error: 'Invalid payload', details: parsed.error?.flatten?.() }, { status: 400 });
    }
    const { item_name, item_description = null } = parsed.data as any;
    // naive categorization placeholder
    const category = 'Shopping';
    const subcategory_l1 = 'General';
    const subcategory_l2 = 'Unspecified';

    const supabase = createSupabaseClient(true);
    const { error } = await supabase.from('wishlist_items').insert({
      user_id: userId,
      item_name,
      item_description,
      category,
      subcategory_l1,
      subcategory_l2,
    });
    if (error) {
      return json({ ok: false, error: error.message }, { status: 500 });
    }

    return json({ ok: true, userId, item_name, item_description, category, subcategory_l1, subcategory_l2 });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'Bad Request' }, { status: 400 });
  }
})));

export const config = {
  path: '/api/users/:userId/wishlist',
};
