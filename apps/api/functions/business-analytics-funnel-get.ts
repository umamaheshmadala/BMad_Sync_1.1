import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner, getUserIdFromRequest } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json, errorJson } from '../../../packages/shared/http';
import { weakEtagForObject } from '../../../packages/shared/cache';
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
  const MAX_FILL_SINCE_DAYS = 180;
  if (fill && sinceDays > MAX_FILL_SINCE_DAYS) {
    return errorJson(`sinceDays cannot exceed ${MAX_FILL_SINCE_DAYS} when fill=true`, 400, 'range_exceeds_cap', { maxSinceDays: MAX_FILL_SINCE_DAYS });
  }
  if (tz) {
    try { new Intl.DateTimeFormat('en-CA', { timeZone: tz }); }
    catch { return errorJson('Invalid IANA time zone', 400, 'invalid_tz'); }
  }
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
  // CSV output support
  const fmt = (url.searchParams.get('format') || '').toLowerCase();
  if (fmt === 'csv') {
    const headers = ['day','collected','redeemed'];
    const escape = (v: any) => JSON.stringify(v == null ? '' : String(v));
    const keys = Object.keys(funnelByDay || {}).sort();
    const csv = [headers.join(',')].concat(keys.map(k => {
      const row = (funnelByDay as any)[k] || { collected: 0, redeemed: 0 };
      return [k, row.collected || 0, row.redeemed || 0].map(escape).join(',');
    })).join('\n');
    const ttl = Math.min(300, Math.max(30, sinceDays * 5));
    const lastKey = keys[keys.length - 1];
    const lastModified = (() => { try { return new Date(`${lastKey}T23:59:59Z`).toUTCString(); } catch { return new Date().toUTCString(); } })();
    const ifModifiedSince = new Headers((req as any).headers || {}).get('if-modified-since');
    if (ifModifiedSince) {
      const since = Date.parse(ifModifiedSince);
      const lm = Date.parse(lastModified);
      if (!Number.isNaN(since) && !Number.isNaN(lm) && lm <= since) {
        return new Response(undefined, { status: 304, headers: { 'Last-Modified': lastModified, 'Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Netlify-CDN-Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Vary': 'Accept, Accept-Encoding, Authorization', 'X-Cache-Key-Parts': `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};group=${group||''};businessId=${businessIdFilter||''}` } });
      }
    }
    const etagCsv = weakEtagForObject(csv);
    const headersCsv: Record<string, string> = { 'Content-Type': 'text/csv', 'Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Netlify-CDN-Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Vary': 'Accept, Accept-Encoding, Authorization', 'Last-Modified': lastModified, 'X-Cache-Key-Parts': `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};group=${group||''};businessId=${businessIdFilter||''}` };
    if (etagCsv) headersCsv['ETag'] = etagCsv;
    return new Response(csv, { status: 200, headers: headersCsv });
  }
  const etag = (() => {
    try {
      const key = JSON.stringify({ businessIdFilter, group, tz, fill, sinceDays, funnelByDay, totals });
      let h = 2166136261 >>> 0;
      for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
      return 'W/"' + (h >>> 0).toString(16) + '"';
    } catch { return undefined; }
  })();
  const ttl = Math.min(300, Math.max(30, sinceDays * 5));
  const headers = new Headers({
    'Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`,
    'Netlify-CDN-Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`,
    'Vary': 'Accept, Accept-Encoding, Authorization',
  });
  try {
    const keys = Object.keys(funnelByDay || {}).sort();
    const lastKey = keys[keys.length - 1];
    const lm = lastKey ? new Date(`${lastKey}T23:59:59Z`).toUTCString() : new Date().toUTCString();
    headers.set('Last-Modified', lm);
  } catch { headers.set('Last-Modified', new Date().toUTCString()); }
  if (etag) headers.set('ETag', etag);
  headers.set('X-Cache-Key-Parts', `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};group=${group||''};businessId=${businessIdFilter||''}`);
  const ifNoneMatch = new Headers((req as any).headers || {}).get('if-none-match');
  const ifModifiedSince = new Headers((req as any).headers || {}).get('if-modified-since');
  if (etag && ifNoneMatch === etag) {
    return new Response(undefined, { status: 304, headers });
  }
  if (ifModifiedSince) {
    const since = Date.parse(ifModifiedSince);
    if (!Number.isNaN(since)) {
      const last = Date.now();
      if (last - since < 60_000) {
        return new Response(undefined, { status: 304, headers });
      }
    }
  }
  return json(payload, { headers });
})));

export const config = {
  path: '/api/business/analytics/funnel',
};


