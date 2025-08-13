import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest } from '../../../packages/shared/auth';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { ShareCouponPayloadSchema } from '../../../packages/shared/validation';

export default withRateLimit('users-coupons-share-post', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const segments = url.pathname.split('/');
  const userId = segments[3] || '';
  const couponId = segments[5] || '';
  try {
    const callerId = getUserIdFromRequest(req);
    if (!callerId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    if (callerId !== userId) return json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const body = await req.json();
    const parsed = ShareCouponPayloadSchema.safeParse(body);
    if (!parsed.success || !userId || !couponId) return json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    const { receiver_user_id } = parsed.data;
    const supabase = createSupabaseClient(true);

    // Validate original ownership
    const { data: originalUC, error: origErr } = await supabase
      .from('user_coupons')
      .select('id, is_redeemed, transfer_count')
      .eq('coupon_id', couponId)
      .eq('current_owner_id', userId)
      .limit(1)
      .maybeSingle();
    if (origErr || !originalUC) {
      return json({ ok: false, error: 'Original coupon not owned by user' }, { status: 403 });
    }
    if (originalUC.is_redeemed) {
      return json({ ok: false, error: 'Already redeemed; cannot share' }, { status: 409 });
    }

    // Create new instance for receiver
    const unique_code = `UC-${couponId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const { data: newUC, error: insErr } = await supabase
      .from('user_coupons')
      .insert({ coupon_id: couponId, user_id: receiver_user_id, unique_code, current_owner_id: receiver_user_id })
      .select('id')
      .single();
    if (insErr) return json({ ok: false, error: insErr.message }, { status: 500 });

    // Record share row
    const { data: shareRow, error: shareErr } = await supabase
      .from('coupon_shares')
      .insert({
        original_user_coupon_id: originalUC.id,
        sharer_user_id: userId,
        receiver_user_id,
        shared_coupon_instance_id: newUC.id,
      })
      .select('id')
      .single();
    if (shareErr) return json({ ok: false, error: shareErr.message }, { status: 500 });

    // Update original transfer_count and nullify current ownership
    const { error: updErr } = await supabase
      .from('user_coupons')
      .update({ current_owner_id: null, transfer_count: (originalUC.transfer_count || 0) + 1 })
      .eq('id', originalUC.id);
    if (updErr) return json({ ok: false, error: updErr.message }, { status: 500 });

    return json({ ok: true, share_id: shareRow.id, new_user_coupon_id: newUC.id, unique_code });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'Bad Request' }, { status: 400 });
  }
}));

export const config = {
  path: '/api/users/:userId/coupons/:couponId/share',
};
