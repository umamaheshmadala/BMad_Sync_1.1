import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner, getUserIdFromRequest } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';

type FunnelCounts = { issued: number; collected: number; shared: number; redeemed: number };

export default withRequestLogging('business-analytics-funnel', async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const supabase = createSupabaseClient(true) as any;

  const url = new URL(req.url);
  const businessIdFilter = url.searchParams.get('businessId') || '';
  const group = (url.searchParams.get('group') || '').toLowerCase();
  const callerId = getUserIdFromRequest(req);

  if (businessIdFilter) {
    // Validate ownership unless platform owner
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', businessIdFilter)
      .maybeSingle();
    const isOwner = biz && biz.owner_user_id === callerId;
    if (!isOwner && !isPlatformOwner(req)) return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
  }

  // Fetch core tables
  const [{ data: coupons }, { data: userCoupons }, { data: shares }] = await Promise.all([
    supabase.from('coupons').select('id, business_id'),
    supabase.from('user_coupons').select('id, coupon_id, is_redeemed'),
    supabase.from('coupon_shares').select('original_user_coupon_id'),
  ]);

  const couponIdToBiz: Record<string, string> = {};
  for (const c of (coupons as any[]) || []) {
    couponIdToBiz[String(c.id)] = String(c.business_id);
  }

  const userCouponIdToCouponId: Record<string, string> = {};
  for (const uc of (userCoupons as any[]) || []) {
    userCouponIdToCouponId[String(uc.id)] = String(uc.coupon_id);
  }

  function ensureCounts(map: Record<string, FunnelCounts>, bizId: string) {
    if (!map[bizId]) map[bizId] = { issued: 0, collected: 0, shared: 0, redeemed: 0 };
    return map[bizId];
  }

  // Grouped counts by business
  const byBusiness: Record<string, FunnelCounts> = {};

  // Issued per business
  for (const c of (coupons as any[]) || []) {
    const bizId = String(c.business_id || '');
    if (!bizId) continue;
    if (businessIdFilter && bizId !== businessIdFilter) continue;
    ensureCounts(byBusiness, bizId).issued += 1;
  }

  // Collected + Redeemed per business
  for (const uc of (userCoupons as any[]) || []) {
    const couponId = String(uc.coupon_id || '');
    const bizId = couponIdToBiz[couponId];
    if (!bizId) continue;
    if (businessIdFilter && bizId !== businessIdFilter) continue;
    const bucket = ensureCounts(byBusiness, bizId);
    bucket.collected += 1;
    if (uc.is_redeemed) bucket.redeemed += 1;
  }

  // Shared per business: map share.original_user_coupon_id -> coupon -> business
  for (const s of (shares as any[]) || []) {
    const origUcId = String(s.original_user_coupon_id || '');
    const couponId = userCouponIdToCouponId[origUcId];
    if (!couponId) continue;
    const bizId = couponIdToBiz[couponId];
    if (!bizId) continue;
    if (businessIdFilter && bizId !== businessIdFilter) continue;
    ensureCounts(byBusiness, bizId).shared += 1;
  }

  // Aggregate totals
  const totals: FunnelCounts = { issued: 0, collected: 0, shared: 0, redeemed: 0 };
  for (const bizId of Object.keys(byBusiness)) {
    const c = byBusiness[bizId];
    totals.issued += c.issued;
    totals.collected += c.collected;
    totals.shared += c.shared;
    totals.redeemed += c.redeemed;
  }

  const payload: any = { ok: true, funnel: totals };
  if (group === 'business') payload.funnelByBusiness = byBusiness;
  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
});

export const config = {
  path: '/api/business/analytics/funnel',
};


