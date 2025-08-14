import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json, errorJson } from '../../../packages/shared/http';

export default withRequestLogging('business-analytics-coupons-issued', withRateLimit('business-analytics-coupons-issued-get', { limit: 120, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const businessId = (url.searchParams.get('businessId') || '').trim();
  const group = (url.searchParams.get('group') || '').trim().toLowerCase();
  const tz = (url.searchParams.get('tz') || '').trim();
  const fillParam = url.searchParams.get('fill');
  const fill = fillParam == null ? true : String(fillParam).toLowerCase() !== 'false';
  const sinceDaysParam = url.searchParams.get('sinceDays');
  const sinceDays = sinceDaysParam ? Math.max(1, Math.min(365, Number(sinceDaysParam))) : 30;
  const MAX_FILL_SINCE_DAYS = 180;
  if (fill && sinceDays > MAX_FILL_SINCE_DAYS) {
    return errorJson(`sinceDays cannot exceed ${MAX_FILL_SINCE_DAYS} when fill=true`, 400, 'range_exceeds_cap', { maxSinceDays: MAX_FILL_SINCE_DAYS });
  }
  if (tz) {
    try { new Intl.DateTimeFormat('en-CA', { timeZone: tz }); }
    catch { return errorJson('Invalid IANA time zone', 400, 'invalid_tz'); }
  }

  const callerId = getUserIdFromRequest(req);
  const supabase = createSupabaseClient(true) as any;
  if (businessId) {
    const { data: biz } = await supabase.from('businesses').select('id, owner_user_id').eq('id', businessId).maybeSingle();
    const isOwner = biz && biz.owner_user_id === callerId;
    if (!isOwner && !isPlatformOwner(req)) return json({ ok: false, error: 'Forbidden' }, { status: 403 });
  } else {
    if (!(isPlatformOwner(req) && group === 'business')) return errorJson('businessId is required unless group=business and caller is platform owner', 400, 'invalid_params');
  }

  const sinceIso = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: coupons } = await supabase
    .from('coupons')
    .select('id, business_id, start_date')
    .gte('start_date', sinceIso);

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

  const perDay: Record<string, { issued: number }> = {};
  const byBusiness: Record<string, Record<string, { issued: number }>> = {};
  for (const c of (coupons as any[]) || []) {
    const biz = String((c as any).business_id || '');
    if (businessId && biz !== businessId) continue;
    const k = keyFor((c as any).start_date);
    if (!k) continue;
    perDay[k] = perDay[k] || { issued: 0 };
    perDay[k].issued += 1;
    if (group === 'business' && biz) {
      byBusiness[biz] = byBusiness[biz] || {};
      byBusiness[biz][k] = byBusiness[biz][k] || { issued: 0 };
      byBusiness[biz][k].issued += 1;
    }
  }

  let byDay: Record<string, { issued: number }> = {};
  if (fill) {
    const now = new Date();
    for (let i = sinceDays; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      let ymd: string;
      try { ymd = tz ? new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d) : d.toISOString().slice(0, 10); }
      catch { ymd = d.toISOString().slice(0, 10); }
      byDay[ymd] = perDay[ymd] || { issued: 0 };
    }
  } else {
    Object.keys(perDay).sort().forEach((k) => { byDay[k] = perDay[k]; });
  }

  const fmt = (url.searchParams.get('format') || '').toLowerCase();
  if (fmt === 'csv') {
    const headers = group === 'business' ? ['businessId','day','issued'] : ['day','issued'];
    const escape = (v: any) => JSON.stringify(v == null ? '' : String(v));
    let lines: string[] = [headers.join(',')];
    if (group === 'business') {
      for (const biz of Object.keys(byBusiness).sort()) {
        for (const k of Object.keys(byBusiness[biz] || {}).sort()) {
          const v = (byBusiness[biz][k] || { issued: 0 }).issued || 0;
          lines.push([biz, k, String(v)].map(escape).join(','));
        }
      }
    } else {
      for (const k of Object.keys(byDay).sort()) {
        lines.push([k, String(byDay[k].issued || 0)].map(escape).join(','));
      }
    }
    const csv = lines.join('\n');
    const ttlCsv = Math.min(300, Math.max(30, sinceDays * 5));
    const lastKey = (() => {
      try {
        if (group === 'business') {
          const all = Object.values(byBusiness || {}).flatMap((m: any) => Object.keys(m || {}));
          return all.sort().pop();
        }
        return Object.keys(byDay || {}).sort().pop();
      } catch { return undefined; }
    })();
    const lastModified = (() => { try { return new Date(`${lastKey}T23:59:59Z`).toUTCString(); } catch { return new Date().toUTCString(); } })();
    return new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Cache-Control': `public, max-age=0, s-maxage=${ttlCsv}, stale-while-revalidate=120`, 'Netlify-CDN-Cache-Control': `public, max-age=0, s-maxage=${ttlCsv}, stale-while-revalidate=120`, 'Vary': 'Accept, Accept-Encoding, Authorization', 'Last-Modified': lastModified } });
  }

  const series = Object.keys(byDay).sort().map((day) => ({ day, issued: byDay[day].issued }));
  const payload: any = { ok: true, byDay: series };
  if (group === 'business') payload.byBusiness = byBusiness;
  const etag = (() => {
    try {
      const key = JSON.stringify({ businessId, group, tz, fill, sinceDays, series, byBusiness });
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
    const lastKey = (() => {
      const all = Object.keys(byDay || {});
      return all.sort().pop();
    })();
    const lm = lastKey ? new Date(`${lastKey}T23:59:59Z`).toUTCString() : new Date().toUTCString();
    headers.set('Last-Modified', lm);
  } catch { headers.set('Last-Modified', new Date().toUTCString()); }
  if (etag) headers.set('ETag', etag);
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
  path: '/api/business/analytics/coupons-issued',
};


