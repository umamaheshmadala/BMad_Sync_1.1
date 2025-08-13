import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner, getUserIdFromRequest } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { withErrorHandling } from '../../../packages/shared/errors';

type FunnelCounts = { issued: number; collected: number; shared: number; redeemed: number };

export default withRequestLogging('business-analytics-funnel', withRateLimit('analytics-funnel', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const supabase = createSupabaseClient(true) as any;

  const url = new URL(req.url);
  const businessIdFilter = url.searchParams.get('businessId') || '';
  const group = (url.searchParams.get('group') || '').toLowerCase();
  const sinceDaysParam = url.searchParams.get('sinceDays');
  // Align default with UI for snappier responses
  const sinceDays = sinceDaysParam ? Math.max(1, Math.min(365, Number(sinceDaysParam))) : 7;
  const sinceIso = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const callerId = getUserIdFromRequest(req);

  if (businessIdFilter) {
    // Validate ownership unless platform owner
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', businessIdFilter)
      .maybeSingle();
    const isOwner = biz && biz.owner_user_id === callerId;
    if (!isOwner && !isPlatformOwner(req)) return json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }

  // Fetch core tables
  const [{ data: coupons }, { data: userCoupons }, { data: shares }] = await Promise.all([
    supabase.from('coupons').select('id, business_id'),
    supabase.from('user_coupons').select('id, coupon_id, is_redeemed, collected_at').gte('collected_at', sinceIso),
    supabase.from('coupon_shares').select('original_user_coupon_id, shared_at').gte('shared_at', sinceIso),
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

  // Aggregate totals and per-day buckets for collected/redeemed
  const totals: FunnelCounts = { issued: 0, collected: 0, shared: 0, redeemed: 0 };
  const byDay: Record<string, { collected: number; redeemed: number }> = {};
  const tz = (url.searchParams.get('tz') || '').trim();
  const fillParam = url.searchParams.get('fill');
  const fill = fillParam == null ? true : String(fillParam).toLowerCase() !== 'false';
  const keyFor = (iso?: string) => {
    try {
      if (!iso) return '';
      const d = new Date(iso);
      if (tz) {
        try { const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }); return fmt.format(d); } catch {}
      }
      return (iso || '').slice(0, 10);
    } catch { return ''; }
  };
  for (const bizId of Object.keys(byBusiness)) {
    const c = byBusiness[bizId];
    totals.issued += c.issued;
    totals.collected += c.collected;
    totals.shared += c.shared;
    totals.redeemed += c.redeemed;
  }
  for (const uc of (userCoupons as any[]) || []) {
    const k = keyFor(uc.collected_at);
    if (!k) continue;
    byDay[k] = byDay[k] || { collected: 0, redeemed: 0 };
    byDay[k].collected += 1;
    if (uc.is_redeemed) byDay[k].redeemed += 1;
  }

  // Zero-fill and order ascending by key
  const zeroFilled: Record<string, { collected: number; redeemed: number }> = {};
  const keysAsc = (() => {
    const ks = Object.keys(byDay);
    return ks.sort();
  })();
  // Build a default window same as trends (today back to sinceDays)
  const windowKeys = (() => {
    const keys: string[] = [];
    const nowD = new Date();
    for (let i = sinceDays; i >= 0; i -= 1) {
      const d = new Date(nowD.getTime() - i * 24 * 60 * 60 * 1000);
      try {
        const ymd = tz ? new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d) : d.toISOString().slice(0, 10);
        keys.push(ymd);
      } catch {
        keys.push(d.toISOString().slice(0, 10));
      }
    }
    return keys;
  })();
  let funnelByDay: Record<string, { collected: number; redeemed: number }>;
  if (fill) {
    for (const k of windowKeys) zeroFilled[k] = byDay[k] || { collected: 0, redeemed: 0 };
    funnelByDay = zeroFilled;
  } else {
    const ordered: Record<string, { collected: number; redeemed: number }> = {};
    Object.keys(byDay).sort().forEach((k) => { ordered[k] = byDay[k]; });
    funnelByDay = ordered;
  }

  const payload: any = { ok: true, funnel: totals, funnelByDay };
  if (group === 'business') payload.funnelByBusiness = byBusiness;
  return json(payload, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
      'Netlify-CDN-Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
    },
  });
})));

export const config = {
  path: '/api/business/analytics/funnel',
};


