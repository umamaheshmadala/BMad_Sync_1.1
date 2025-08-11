import { createSupabaseClient } from '../../../packages/shared/supabaseClient';

export default async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const businessId = parts[3] || '';
  if (!businessId) return new Response(JSON.stringify({ ok: false, error: 'Missing businessId' }), { status: 400 });

  const supabase = createSupabaseClient(true);
  // Fetch coupon ids for this business first
  const { data: coupons, error: coupErr } = await supabase
    .from('coupons')
    .select('id, business_id')
    .eq('business_id', businessId);
  if (coupErr) return new Response(JSON.stringify({ ok: false, error: coupErr.message }), { status: 500 });
  const couponIds = new Set((coupons || []).map((c: any) => c.id));

  // Then fetch user coupons and aggregate for those ids
  const { data: userCoupons, error: ucErr } = await supabase
    .from('user_coupons')
    .select('is_redeemed, coupon_id');
  if (ucErr) return new Response(JSON.stringify({ ok: false, error: ucErr.message }), { status: 500 });

  let redeemed = 0;
  let total = 0;
  for (const r of (userCoupons as any[]) || []) {
    if (!couponIds.has(r.coupon_id)) continue;
    total++;
    if (r.is_redeemed) redeemed++;
  }
  const redemption_rate = total > 0 ? redeemed / total : 0;

  return new Response(
    JSON.stringify({ ok: true, summary: { redeemed, total, redemption_rate } }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

export const config = {
  path: '/api/business/:businessId/analytics/coupons',
};
