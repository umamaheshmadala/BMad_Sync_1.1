import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner, getUserIdFromRequest } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';

export default withRequestLogging('business-analytics-trends', async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const supabase = createSupabaseClient(true) as any;

  // Optional: businessId filter (owner/platform only)
  const url = new URL(req.url);
  const businessId = url.searchParams.get('businessId') || '';
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
    .select('collected_at, is_redeemed');

  function dateKey(iso?: string) {
    try { return (iso || '').slice(0, 10); } catch { return ''; }
  }

  const reviewTrend: Record<string, { total: number; recommend: number }> = {};
  for (const r of (reviews as any[]) || []) {
    if (businessId && r.business_id !== businessId) continue;
    const k = dateKey(r.created_at);
    if (!k) continue;
    reviewTrend[k] = reviewTrend[k] || { total: 0, recommend: 0 };
    reviewTrend[k].total += 1;
    if (r.recommend_status) reviewTrend[k].recommend += 1;
  }

  const couponTrend: Record<string, { collected: number; redeemed: number }> = {};
  for (const c of (coupons as any[]) || []) {
    const k = dateKey(c.collected_at);
    if (!k) continue;
    couponTrend[k] = couponTrend[k] || { collected: 0, redeemed: 0 };
    couponTrend[k].collected += 1;
    if (c.is_redeemed) couponTrend[k].redeemed += 1;
  }

  return new Response(
    JSON.stringify({ ok: true, trends: { reviews: reviewTrend, coupons: couponTrend } }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

export const config = {
  path: '/api/business/analytics/trends',
};


