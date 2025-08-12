import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner, getUserIdFromRequest } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';

export default withRequestLogging('business-analytics-trends', async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const supabase = createSupabaseClient(true) as any;

  // Optional: businessId filter (owner/platform only)
  const url = new URL(req.url);
  const businessId = url.searchParams.get('businessId') || '';
  const group = (url.searchParams.get('group') || '').toLowerCase();
  const callerId = getUserIdFromRequest(req);
  if (businessId) {
    // Validate ownership unless platform owner
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', businessId)
      .maybeSingle();
    const isOwner = biz && biz.owner_user_id === callerId;
    if (!isOwner && !isPlatformOwner(req)) return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
  }

  // Simple trends: counts over time buckets
  const { data: reviews } = await supabase
    .from('business_reviews')
    .select('created_at, recommend_status, business_id');
  const { data: coupons } = await supabase
    .from('user_coupons')
    .select('collected_at, is_redeemed, coupon_id');
  const { data: couponsTable } = await supabase
    .from('coupons')
    .select('id, business_id');

  function dateKey(iso?: string) {
    try { return (iso || '').slice(0, 10); } catch { return ''; }
  }

  const reviewTrend: Record<string, { total: number; recommend: number }> = {};
  const reviewByBusiness: Record<string, Record<string, { total: number; recommend: number }>> = {};
  for (const r of (reviews as any[]) || []) {
    if (businessId && r.business_id !== businessId) continue;
    const k = dateKey(r.created_at);
    if (!k) continue;
    reviewTrend[k] = reviewTrend[k] || { total: 0, recommend: 0 };
    reviewTrend[k].total += 1;
    if (r.recommend_status) reviewTrend[k].recommend += 1;
    if (group === 'business') {
      const b = r.business_id as string;
      if (!b) continue;
      reviewByBusiness[b] = reviewByBusiness[b] || {};
      reviewByBusiness[b][k] = reviewByBusiness[b][k] || { total: 0, recommend: 0 };
      reviewByBusiness[b][k].total += 1;
      if (r.recommend_status) reviewByBusiness[b][k].recommend += 1;
    }
  }

  const couponTrend: Record<string, { collected: number; redeemed: number }> = {};
  const couponByBusiness: Record<string, Record<string, { collected: number; redeemed: number }>> = {};
  const couponIdToBiz: Record<string, string> = {};
  for (const ct of (couponsTable as any[]) || []) {
    couponIdToBiz[String(ct.id)] = String(ct.business_id);
  }
  for (const c of (coupons as any[]) || []) {
    const k = dateKey(c.collected_at);
    if (!k) continue;
    couponTrend[k] = couponTrend[k] || { collected: 0, redeemed: 0 };
    couponTrend[k].collected += 1;
    if (c.is_redeemed) couponTrend[k].redeemed += 1;
    if (group === 'business') {
      const b = couponIdToBiz[String(c.coupon_id)];
      if (!b) continue;
      if (businessId && b !== businessId) continue;
      couponByBusiness[b] = couponByBusiness[b] || {};
      couponByBusiness[b][k] = couponByBusiness[b][k] || { collected: 0, redeemed: 0 };
      couponByBusiness[b][k].collected += 1;
      if (c.is_redeemed) couponByBusiness[b][k].redeemed += 1;
    }
  }

  const payload: any = { ok: true, trends: { reviews: reviewTrend, coupons: couponTrend } };
  if (group === 'business') {
    payload.trendsByBusiness = { reviews: reviewByBusiness, coupons: couponByBusiness };
  }
  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
});

export const config = {
  path: '/api/business/analytics/trends',
};


