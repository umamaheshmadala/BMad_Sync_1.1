import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner, getUserIdFromRequest } from '../../../packages/shared/auth';

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const businessId = parts[3] || '';
  try {
    const callerId = getUserIdFromRequest(req);
    if (!callerId) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
    const body = await req.json();
    const { unique_code } = body || {};
    if (!businessId || typeof unique_code !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });
    }
    const supabase = createSupabaseClient(true);
    const { data: uc, error: ucErr } = await supabase
      .from('user_coupons')
      .select('id, coupon_id, is_redeemed')
      .eq('unique_code', unique_code)
      .maybeSingle();
    if (ucErr || !uc) return new Response(JSON.stringify({ ok: false, error: 'Coupon not found' }), { status: 404 });
    if (uc.is_redeemed) return new Response(JSON.stringify({ ok: false, error: 'Already redeemed' }), { status: 409 });

    const { data: coupon, error: cErr } = await supabase
      .from('coupons')
      .select('business_id')
      .eq('id', uc.coupon_id)
      .single();
    if (cErr || !coupon || coupon.business_id !== businessId)
      return new Response(JSON.stringify({ ok: false, error: 'Business mismatch' }), { status: 403 });

    const { error: upd } = await supabase
      .from('user_coupons')
      .update({ is_redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('id', uc.id);
    if (upd) return new Response(JSON.stringify({ ok: false, error: upd.message }), { status: 500 });

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Bad Request' }), { status: 400 });
  }
};

export const config = {
  path: '/api/business/:businessId/redeem',
};
