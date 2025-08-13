import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest } from '../../../packages/shared/auth';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { CollectCouponPayloadSchema } from '../../../packages/shared/validation';

export default withRateLimit('users-coupons-collect-post', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  try {
    const callerId = getUserIdFromRequest(req);
    if (!callerId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (callerId !== userId) return json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const parsed = CollectCouponPayloadSchema.safeParse(body);
    if (!parsed.success || !userId) return json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    const { coupon_id } = parsed.data;
    const supabase = createSupabaseClient(true);
    // Generate a simple unique code
    const unique_code = `UC-${coupon_id}-${Date.now()}`;
    const { error } = await supabase
      .from('user_coupons')
      .insert({ coupon_id, user_id: userId, unique_code, current_owner_id: userId });
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    return json({ ok: true, userId, coupon_id, unique_code });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'Bad Request' }, { status: 400 });
  }
}));

export const config = {
  path: '/api/users/:userId/coupons/collect',
};
