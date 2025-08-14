import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner, getUserIdFromRequest } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json, errorJson } from '../../../packages/shared/http';
import { weakEtagForObject } from '../../../packages/shared/cache';
import { withErrorHandling } from '../../../packages/shared/errors';

export default withRequestLogging('business-analytics-trends', withRateLimit('analytics-trends', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const supabase = createSupabaseClient(true) as any;

  // Optional: businessId filter (owner/platform only)
  const url = new URL(req.url);
  const businessId = url.searchParams.get('businessId') || '';
  const group = (url.searchParams.get('group') || '').toLowerCase();
  const tz = (url.searchParams.get('tz') || '').trim();
  const fillParam = url.searchParams.get('fill');
  const fill = fillParam == null ? true : String(fillParam).toLowerCase() !== 'false';
  const sinceDaysParam = url.searchParams.get('sinceDays');
  // Align default with UI for snappier responses
  const sinceDays = sinceDaysParam ? Math.max(1, Math.min(365, Number(sinceDaysParam))) : 7;
  // Enforce guard to prevent very large zero-fill ranges
  const MAX_FILL_SINCE_DAYS = 180;
  if (fill && sinceDays > MAX_FILL_SINCE_DAYS) {
    return errorJson(`sinceDays cannot exceed ${MAX_FILL_SINCE_DAYS} when fill=true`, 400, 'range_exceeds_cap', { maxSinceDays: MAX_FILL_SINCE_DAYS });
  }
  if (tz) {
    try { new Intl.DateTimeFormat('en-CA', { timeZone: tz }); }
    catch { return errorJson('Invalid IANA time zone', 400, 'invalid_tz'); }
  }
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
  function tzYmd(d: Date): string {
    if (!tz) return d.toISOString().slice(0, 10);
    try {
      const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
      return fmt.format(d);
    } catch {
      return d.toISOString().slice(0, 10);
    }
  }
  const now = new Date();
  const allDays = (() => {
    if (!tz) {
      return dateKeysRange(sinceIso, now.toISOString());
    }
    const keys: string[] = [];
    for (let i = sinceDays; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      keys.push(tzYmd(d));
    }
    return keys;
  })();
  const orderedReviews: Record<string, { total: number; recommend: number }> = {};
  const orderedCoupons: Record<string, { collected: number; redeemed: number }> = {};
  for (const d of allDays) {
    const r = reviewTrend[d] || { total: 0, recommend: 0 };
    const c = couponTrend[d] || { collected: 0, redeemed: 0 };
    orderedReviews[d] = r;
    orderedCoupons[d] = c;
  }

  const trendsPayload = fill ? { reviews: orderedReviews, coupons: orderedCoupons } : { reviews: reviewTrend, coupons: couponTrend };
  const payload: any = { ok: true, trends: trendsPayload };
  if (group === 'business') {
    payload.trendsByBusiness = { reviews: reviewByBusiness, coupons: couponByBusiness };
  }
  // CSV output support
  const fmt = (url.searchParams.get('format') || '').toLowerCase();
  if (fmt === 'csv') {
    const rows: Array<Record<string, any>> = [];
    const base = trendsPayload as any;
    const keys = Object.keys((base.reviews || {})).sort();
    for (const day of keys) {
      const r = (base.reviews || {})[day] || { total: 0, recommend: 0 };
      const c = (base.coupons || {})[day] || { collected: 0, redeemed: 0 };
      rows.push({ day, review_total: r.total || 0, review_recommend: r.recommend || 0, coupon_collected: c.collected || 0, coupon_redeemed: c.redeemed || 0 });
    }
    const headers = ['day','review_total','review_recommend','coupon_collected','coupon_redeemed'];
    const escape = (v: any) => JSON.stringify(v == null ? '' : String(v));
    const csv = [headers.join(',')].concat(rows.map(r => headers.map(h => escape((r as any)[h])).join(','))).join('\n');
    const ttl = Math.min(300, Math.max(30, sinceDays * 5));
    const lastKey = keys[keys.length - 1];
    const lastModified = (() => { try { return new Date(`${lastKey}T23:59:59Z`).toUTCString(); } catch { return new Date().toUTCString(); } })();
    const ifModifiedSince = new Headers((req as any).headers || {}).get('if-modified-since');
    if (ifModifiedSince) {
      const since = Date.parse(ifModifiedSince);
      const lm = Date.parse(lastModified);
      if (!Number.isNaN(since) && !Number.isNaN(lm) && lm <= since) {
        return new Response(undefined, { status: 304, headers: { 'Last-Modified': lastModified, 'Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Netlify-CDN-Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Vary': 'Accept, Accept-Encoding, Authorization', 'X-Cache-Key-Parts': `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};group=${group||''};businessId=${businessId||''}` } });
      }
    }
    const etagCsv = weakEtagForObject(csv);
    const headersCsv: Record<string, string> = { 'Content-Type': 'text/csv', 'Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Netlify-CDN-Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Vary': 'Accept, Accept-Encoding, Authorization', 'Last-Modified': lastModified, 'X-Cache-Key-Parts': `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};group=${group||''};businessId=${businessId||''}` };
    if (etagCsv) headersCsv['ETag'] = etagCsv;
    return new Response(csv, { status: 200, headers: headersCsv });
  }
  // Compute a simple ETag based on inputs and payload shape (stable across identical responses)
  const etag = (() => {
    try {
      const key = JSON.stringify({ businessId, group, tz, fill, sinceDays, trendsPayload });
      let h = 2166136261 >>> 0; // FNV-1a
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
    const keys = Object.keys((trendsPayload as any).reviews || {}).sort();
    const lastKey = keys[keys.length - 1];
    const lm = lastKey ? new Date(`${lastKey}T23:59:59Z`).toUTCString() : new Date().toUTCString();
    headers.set('Last-Modified', lm);
  } catch { headers.set('Last-Modified', new Date().toUTCString()); }
  headers.set('X-Cache-Key-Parts', `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};group=${group||''};businessId=${businessId||''}`);
  if (etag) headers.set('ETag', etag);
  const ifNoneMatch = new Headers((req as any).headers || {}).get('if-none-match');
  const ifModifiedSince = new Headers((req as any).headers || {}).get('if-modified-since');
  if (etag && ifNoneMatch === etag) {
    return new Response(undefined, { status: 304, headers });
  }
  if (ifModifiedSince) {
    // Since payloads are time-bucketed by day, treat same-day repeats as not modified
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
  path: '/api/business/analytics/trends',
};


