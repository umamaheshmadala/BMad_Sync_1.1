import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner, getUserIdFromRequest } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { withErrorHandling } from '../../../packages/shared/errors';

export default withRequestLogging('business-analytics-trends', withRateLimit('analytics-trends', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const supabase = createSupabaseClient(true) as any;

  // Optional: businessId filter (owner/platform only)
  const url = new URL(req.url);
  const businessId = url.searchParams.get('businessId') || '';
  const group = (url.searchParams.get('group') || '').toLowerCase();
  const tz = (url.searchParams.get('tz') || '').trim();
  const sinceDaysParam = url.searchParams.get('sinceDays');
  // Align default with UI for snappier responses
  const sinceDays = sinceDaysParam ? Math.max(1, Math.min(365, Number(sinceDaysParam))) : 7;
  const sinceIso = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const callerId = getUserIdFromRequest(req);
  if (businessId) {
    // Validate ownership unless platform owner
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', businessId)
      .maybeSingle();
    const isOwner = biz && biz.owner_user_id === callerId;
    if (!isOwner && !isPlatformOwner(req)) return json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  // Simple trends: counts over time buckets
  const { data: reviews } = await supabase
    .from('business_reviews')
    .select('created_at, recommend_status, business_id')
    .gte('created_at', sinceIso);
  const { data: coupons } = await supabase
    .from('user_coupons')
    .select('collected_at, is_redeemed, coupon_id')
    .gte('collected_at', sinceIso);
  const { data: couponsTable } = await supabase
    .from('coupons')
    .select('id, business_id');

  function dateKey(iso?: string) {
    try {
      if (!iso) return '';
      const d = new Date(iso);
      if (tz) {
        // Shift to tz by deriving local date in that tz using offset approximation via Intl (runtime may not support).
        try {
          const fmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
          const parts = fmt.formatToParts(d);
          const y = parts.find(p => p.type==='year')?.value;
          const m = parts.find(p => p.type==='month')?.value;
          const day = parts.find(p => p.type==='day')?.value;
          if (y && m && day) return `${y}-${m}-${day}`;
        } catch {}
      }
      return iso.slice(0, 10);
    } catch { return ''; }
  }
  function dateKeysRange(startIso: string, endIso: string): string[] {
    try {
      const keys: string[] = [];
      const start = new Date(startIso);
      const end = new Date(endIso);
      // Normalize to UTC date boundaries (tz handling can be added later if needed)
      let cur = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
      const endDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
      while (cur <= endDay) {
        const k = cur.toISOString().slice(0, 10);
        keys.push(k);
        cur = new Date(cur.getTime() + 24 * 60 * 60 * 1000);
      }
      return keys;
    } catch {
      return [];
    }
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

  // Zero-fill for requested range and ensure ascending key order
  const todayIso = new Date().toISOString();
  const allDays = dateKeysRange(sinceIso, todayIso);
  const orderedReviews: Record<string, { total: number; recommend: number }> = {};
  const orderedCoupons: Record<string, { collected: number; redeemed: number }> = {};
  for (const d of allDays) {
    const r = reviewTrend[d] || { total: 0, recommend: 0 };
    const c = couponTrend[d] || { collected: 0, redeemed: 0 };
    orderedReviews[d] = r;
    orderedCoupons[d] = c;
  }

  const payload: any = { ok: true, trends: { reviews: orderedReviews, coupons: orderedCoupons } };
  if (group === 'business') {
    payload.trendsByBusiness = { reviews: reviewByBusiness, coupons: couponByBusiness };
  }
  return json(payload, {
    headers: {
      // Enable short CDN caching to improve p95
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
      'Netlify-CDN-Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
    },
  });
})));

export const config = {
  path: '/api/business/analytics/trends',
};


