import { createSupabaseClient } from '../../../packages/shared/supabaseClient';

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  const shareId = parts[6] || '';
  if (!userId || !shareId) return new Response(JSON.stringify({ ok: false, error: 'Invalid path' }), { status: 400 });

  const supabase = createSupabaseClient(true);

  const { data: share, error: shareErr } = await supabase
    .from('coupon_shares')
    .select('id, original_user_coupon_id, sharer_user_id, receiver_user_id, shared_coupon_instance_id')
    .eq('id', shareId)
    .single();
  if (shareErr || !share) return new Response(JSON.stringify({ ok: false, error: 'Share not found' }), { status: 404 });
  if (share.sharer_user_id !== userId)
    return new Response(JSON.stringify({ ok: false, error: 'Not share owner' }), { status: 403 });

  const { data: sharedUC, error: ucErr } = await supabase
    .from('user_coupons')
    .select('id, is_redeemed')
    .eq('id', share.shared_coupon_instance_id)
    .maybeSingle();
  if (ucErr) return new Response(JSON.stringify({ ok: false, error: ucErr.message }), { status: 500 });
  if (sharedUC && sharedUC.is_redeemed) {
    return new Response(JSON.stringify({ ok: false, error: 'Already redeemed; cannot cancel' }), { status: 409 });
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
  if (updErr) return new Response(JSON.stringify({ ok: false, error: updErr.message }), { status: 500 });

  const { error: delShareErr } = await supabase.from('coupon_shares').delete().eq('id', shareId);
  if (delShareErr) {
    // If share row already gone, still consider success after restoring ownership
  }

  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
};

export const config = {
  path: '/api/users/:userId/coupons/shared/:shareId/cancel',
};
