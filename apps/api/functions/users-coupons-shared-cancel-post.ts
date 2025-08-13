import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest } from '../../../packages/shared/auth';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';

export default withRateLimit('users-coupons-shared-cancel-post', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  const shareId = parts[6] || '';
  if (!userId || !shareId) return json({ ok: false, error: 'Invalid path' }, { status: 400 });

  const supabase = createSupabaseClient(true);
  const callerId = getUserIdFromRequest(req);
  if (!callerId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  if (callerId !== userId) return json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const { data: share, error: shareErr } = await supabase
    .from('coupon_shares')
    .select('id, original_user_coupon_id, sharer_user_id, receiver_user_id, shared_coupon_instance_id')
    .eq('id', shareId)
    .single();
  if (shareErr || !share) return json({ ok: false, error: 'Share not found' }, { status: 404 });
  if (share.sharer_user_id !== userId)
    return json({ ok: false, error: 'Not share owner' }, { status: 403 });

  const { data: sharedUC, error: ucErr } = await supabase
    .from('user_coupons')
    .select('id, is_redeemed')
    .eq('id', share.shared_coupon_instance_id)
    .maybeSingle();
  if (ucErr) return json({ ok: false, error: ucErr.message }, { status: 500 });
  if (sharedUC && sharedUC.is_redeemed) {
    return json({ ok: false, error: 'Already redeemed; cannot cancel' }, { status: 409 });
  }

  if (sharedUC) {
    const { error: delErr } = await supabase
      .from('user_coupons')
      .delete()
      .eq('id', share.shared_coupon_instance_id);
    // If deletion fails due to RLS or prior transfer, continue rollback to restore ownership
    if (delErr) {
      // proceed without hard failing
    }
  }

  const { data: originalUC } = await supabase
    .from('user_coupons')
    .select('transfer_count')
    .eq('id', share.original_user_coupon_id)
    .single();
  const newCount = Math.max(0, (originalUC?.transfer_count || 0) - 1);
  const { error: updErr } = await supabase
    .from('user_coupons')
    .update({ current_owner_id: userId, transfer_count: newCount })
    .eq('id', share.original_user_coupon_id);
  if (updErr) return json({ ok: false, error: updErr.message }, { status: 500 });

  const { error: delShareErr } = await supabase.from('coupon_shares').delete().eq('id', shareId);
  if (delShareErr) {
    // If share row already gone, still consider success after restoring ownership
  }

  return json({ ok: true });
}));

export const config = {
  path: '/api/users/:userId/coupons/shared/:shareId/cancel',
};
