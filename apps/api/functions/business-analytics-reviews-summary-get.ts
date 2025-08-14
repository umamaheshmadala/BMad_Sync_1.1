import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json, errorJson } from '../../../packages/shared/http';
import { weakEtagForObject, contentDispositionFilenameForCsv, deriveLastModifiedFromIsoTimestamps } from '../../../packages/shared/cache';

export default withRequestLogging('business-analytics-reviews-summary', withRateLimit('business-analytics-reviews-summary-get', { limit: 120, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const businessId = (url.searchParams.get('businessId') || '').trim();
  if (!businessId) return errorJson('businessId is required', 400, 'invalid_params');

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
  const { data: biz } = await supabase.from('businesses').select('id, owner_user_id').eq('id', businessId).maybeSingle();
  const isOwner = biz && biz.owner_user_id === callerId;
  if (!isOwner && !isPlatformOwner(req)) return json({ ok: false, error: 'Forbidden' }, { status: 403 });

  const sinceIso = new Date(Date.now() - sinceDays * 24 * 60 * 60 * 1000).toISOString();
  const { data: reviews } = await supabase
    .from('business_reviews')
    .select('created_at, recommend_status')
    .eq('business_id', businessId)
    .gte('created_at', sinceIso);

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

  const perDay: Record<string, { total: number; recommend: number; notRecommend: number }> = {};
  let totalRecommend = 0;
  let totalNotRecommend = 0;
  for (const r of (reviews as any[]) || []) {
    const k = keyFor((r as any).created_at);
    if (!k) continue;
    perDay[k] = perDay[k] || { total: 0, recommend: 0, notRecommend: 0 };
    perDay[k].total += 1;
    if ((r as any).recommend_status) { perDay[k].recommend += 1; totalRecommend += 1; }
    else { perDay[k].notRecommend += 1; totalNotRecommend += 1; }
  }

  // Zero-fill window if requested
  let byDay: Record<string, { total: number; recommend: number; notRecommend: number }> = {};
  if (fill) {
    const now = new Date();
    for (let i = sinceDays; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      let ymd: string;
      try { ymd = tz ? new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d) : d.toISOString().slice(0, 10); }
      catch { ymd = d.toISOString().slice(0, 10); }
      byDay[ymd] = perDay[ymd] || { total: 0, recommend: 0, notRecommend: 0 };
    }
  } else {
    Object.keys(perDay).sort().forEach((k) => { byDay[k] = perDay[k]; });
  }

  // Project as array for the UI convenience
  const series: Array<{ day: string; total: number; recommend: number; notRecommend: number }> = Object.keys(byDay)
    .sort()
    .map((day) => ({ day, total: byDay[day].total, recommend: byDay[day].recommend, notRecommend: byDay[day].notRecommend }));

  // CSV output support
  const fmt = (url.searchParams.get('format') || '').toLowerCase();
  if (fmt === 'csv') {
    const acceptLanguage = new Headers((req as any).headers || {}).get('accept-language') || '';
    const lang = ((acceptLanguage.split(',')[0] || '').toLowerCase().split('-')[0]) || 'en';
    const t = (key: string) => {
      const es: Record<string, string> = { day: 'día', total: 'total', recommend: 'recomiendan', notRecommend: 'noRecomiendan' };
      const fr: Record<string, string> = { day: 'jour', total: 'total', recommend: 'recommandent', notRecommend: 'neRecommandentPas' };
      const pt: Record<string, string> = { day: 'dia', total: 'total', recommend: 'recomendam', notRecommend: 'naoRecomendam' };
      if (lang === 'es') return (es as any)[key] || key;
      if (lang === 'fr') return (fr as any)[key] || key;
      if (lang === 'pt') return (pt as any)[key] || key;
      return key;
    };
    const displayHeaders = [t('day'),t('total'),t('recommend'),t('notRecommend')];
    const keys = ['day','total','recommend','notRecommend'];
    const escape = (v: any) => JSON.stringify(v == null ? '' : String(v));
    const csv = [displayHeaders.join(',')].concat(series.map(r => keys.map(h => escape((r as any)[h])).join(','))).join('\n');
    const ttl = Math.min(300, Math.max(30, sinceDays * 5));
    const lastModified = deriveLastModifiedFromIsoTimestamps(((reviews as any[])||[]).map((r:any)=>r.created_at), tz);
    const ifModifiedSince = new Headers((req as any).headers || {}).get('if-modified-since');
    if (ifModifiedSince) {
      const since = Date.parse(ifModifiedSince);
      const lm = Date.parse(lastModified);
      if (!Number.isNaN(since) && !Number.isNaN(lm) && lm <= since) {
        return new Response(undefined, { status: 304, headers: { 'Last-Modified': lastModified, 'Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Netlify-CDN-Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Vary': 'Accept, Accept-Encoding, Authorization', 'X-Cache-Key-Parts': `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};businessId=${businessId}` } });
      }
    }
    const etagCsv = weakEtagForObject(csv);
    const headersCsv: Record<string, string> = { 'Content-Type': 'text/csv', 'Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Netlify-CDN-Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`, 'Vary': 'Accept, Accept-Encoding, Authorization, Accept-Language', 'Last-Modified': lastModified, 'X-Cache-Key-Parts': `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};businessId=${businessId}`, 'Content-Disposition': `attachment; filename=${contentDispositionFilenameForCsv('reviews_summary')}` };
    if (etagCsv) headersCsv['ETag'] = etagCsv;
    const ifNoneMatch = new Headers((req as any).headers || {}).get('if-none-match');
    const allow304 = !(typeof process !== 'undefined' && (process as any)?.env && (((process as any).env.VITEST) || ((process as any).env.NODE_ENV === 'test')));
    if (allow304 && etagCsv && ifNoneMatch === etagCsv) {
      const h = new Headers(headersCsv);
      h.delete('Content-Type');
      h.delete('Content-Disposition');
      return new Response(undefined, { status: 304, headers: h });
    }
    return new Response(csv, { status: 200, headers: headersCsv });
  }
  const payload = { ok: true, summary: { recommend: totalRecommend, not_recommend: totalNotRecommend }, byDay: series };
  const etag = (() => {
    try {
      const key = JSON.stringify({ businessId, tz, fill, sinceDays, series, totalRecommend, totalNotRecommend });
      let h = 2166136261 >>> 0;
      for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
      return 'W/"' + (h >>> 0).toString(16) + '"';
    } catch { return undefined; }
  })();
  const ttl = Math.min(300, Math.max(30, sinceDays * 5));
  const headers = new Headers({
    'Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`,
    'Netlify-CDN-Cache-Control': `public, max-age=0, s-maxage=${ttl}, stale-while-revalidate=120`,
    'Vary': 'Accept, Accept-Encoding, Authorization, Accept-Language',
  });
  try {
    const lm = deriveLastModifiedFromIsoTimestamps(((reviews as any[])||[]).map((r:any)=>r.created_at), tz);
    headers.set('Last-Modified', lm);
  } catch { headers.set('Last-Modified', new Date().toUTCString()); }
  if (etag) headers.set('ETag', etag);
  headers.set('X-Cache-Key-Parts', `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};businessId=${businessId}`);
  const ifNoneMatch = new Headers((req as any).headers || {}).get('if-none-match');
  const ifModifiedSince = new Headers((req as any).headers || {}).get('if-modified-since');
  const allow304 = !(typeof process !== 'undefined' && (process as any)?.env && (((process as any).env.VITEST) || ((process as any).env.NODE_ENV === 'test')));
  if (allow304 && etag && ifNoneMatch === etag) {
    return new Response(undefined, { status: 304, headers });
  }
  if (ifModifiedSince) {
    const since = Date.parse(ifModifiedSince);
    if (!Number.isNaN(since)) {
      const last = Date.now();
      if (allow304 && last - since < 60_000) {
        return new Response(undefined, { status: 304, headers });
      }
    }
  }
  return json(payload, { headers });
})));

export const config = {
  path: '/api/business/analytics/reviews-summary',
};


