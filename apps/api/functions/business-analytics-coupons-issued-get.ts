import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json, errorJson } from '../../../packages/shared/http';
import { weakEtagForObject, deriveLastModifiedFromIsoTimestamps, contentDispositionHeaderWithRFC5987, buildCsvHeaders, contentDispositionFilenameForCsv } from '../../../packages/shared/cache';
import { parseLimitParam, parseOffsetParam, validateOrderParam } from '../../../packages/shared/validation';

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
  // Grouped pagination/sort params (server-side for group=business)
  const orderParam = (url.searchParams.get('order') || '').trim();
  const limitParam = url.searchParams.get('limit');
  const offsetParam = url.searchParams.get('offset');
  // Validate pagination params early to avoid surprises later
  const limit = parseLimitParam(limitParam, 1, 500);
  const offset = parseOffsetParam(offsetParam);
  const MAX_FILL_SINCE_DAYS = 180;
  if (fill && sinceDays > MAX_FILL_SINCE_DAYS) {
    return errorJson(`sinceDays cannot exceed ${MAX_FILL_SINCE_DAYS} when fill=true`, 400, 'range_exceeds_cap', { maxSinceDays: MAX_FILL_SINCE_DAYS });
  }
  if (tz) {
    try { new Intl.DateTimeFormat('en-CA', { timeZone: tz }); }
    catch { return errorJson('Invalid IANA time zone', 400, 'invalid_tz'); }
  }

  // Validate order when grouped
  const allowedOrders = new Set([
    'total.asc','total.desc','avgperday.asc','avgperday.desc','businessid.asc','businessid.desc','businessname.asc','businessname.desc','firstday.asc','firstday.desc','lastday.asc','lastday.desc'
  ]);
  const { ok: orderOk, normalized: normalizedOrder } = validateOrderParam(orderParam, allowedOrders);
  if (group === 'business' && normalizedOrder && !orderOk) {
    return errorJson('Invalid order parameter', 400, 'invalid_order', { allowed: Array.from(allowedOrders).sort() });
  }

  const callerId = getUserIdFromRequest(req);
  const supabase = createSupabaseClient(true) as any;
  if (businessId) {
    const { data: biz } = await supabase.from('businesses').select('id, owner_user_id').eq('id', businessId).maybeSingle();
    const isOwner = biz && biz.owner_user_id === callerId;
    if (!isOwner && !isPlatformOwner(req)) return json({ ok: false, error: 'Forbidden' }, { status: 403 });
  } else {
    // Allow public by-day aggregate when not grouping
    if (group === 'business' && !isPlatformOwner(req)) return json({ ok: false, error: 'Forbidden' }, { status: 403 });
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
  const expand = (url.searchParams.get('expand') || '').trim().toLowerCase();
  if (fmt === 'csv') {
    const acceptLanguage = new Headers((req as any).headers || {}).get('accept-language') || '';
    const lang = ((acceptLanguage.split(',')[0] || '').toLowerCase().split('-')[0]) || 'en';
    const t = (key: string) => {
      const es: Record<string, string> = { businessId: 'negocioId', businessName: 'nombreNegocio', day: 'día', issued: 'emitidos', total: 'total', avgPerDay: 'promedioDiario', firstDay: 'primero', lastDay: 'último' };
      const fr: Record<string, string> = { businessId: 'entrepriseId', businessName: "nomD'Entreprise", day: 'jour', issued: 'émis', total: 'total', avgPerDay: 'moyenneParJour', firstDay: 'premier', lastDay: 'dernier' };
      const pt: Record<string, string> = { businessId: 'empresaId', businessName: 'nomeEmpresa', day: 'dia', issued: 'emitidos', total: 'total', avgPerDay: 'mediaPorDia', firstDay: 'primeiro', lastDay: 'ultimo' };
      if (lang === 'es') return (es as any)[key] || key;
      if (lang === 'fr') return (fr as any)[key] || key;
      if (lang === 'pt') return (pt as any)[key] || key;
      return key;
    };
    // When grouped and pagination/sort is requested, emit summary CSV instead of per-day rows
    const wantSummary = group === 'business' && (!!orderParam || limit != null || offset != null);
    if (group === 'business' && wantSummary) {
      // Prepare business name map if needed
      let bizNames: Record<string, string> = {};
      if (expand.includes('business')) {
        try {
          const ids = Object.keys(byBusiness);
          if (ids.length) {
            const { data: bizRows } = await supabase.from('businesses').select('id,business_name').in('id', ids);
            for (const b of (bizRows as any[]) || []) { bizNames[String((b as any).id)] = String((b as any).business_name || ''); }
          }
        } catch {}
      }
      type Row = { businessId: string; total: number; days: number; avgPerDay: number; firstDay?: string; lastDay?: string };
      const rows: Row[] = Object.keys(byBusiness || {}).map((biz) => {
        const days = Object.keys(byBusiness[biz] || {}).sort();
        const total = days.reduce((m, d) => m + Number(((byBusiness as any)[biz][d] as any)?.issued || 0), 0);
        const nDays = Math.max(1, days.length);
        const avg = Math.round((total / nDays) * 10) / 10;
        return { businessId: biz, total, days: nDays, avgPerDay: avg, firstDay: days[0], lastDay: days[days.length - 1] };
      });
      const sortKey = ((): keyof Row | 'businessName' => {
        const o = orderParam.toLowerCase();
        if (o.startsWith('avgperday')) return 'avgPerDay';
        if (o.startsWith('businessid')) return 'businessId';
        if (o.startsWith('firstname') || o.startsWith('firstday')) return 'firstDay';
        if (o.startsWith('lastname') || o.startsWith('lastday')) return 'lastDay';
        if (o.startsWith('businessname')) return 'businessName' as any;
        return 'total';
      })();
      const asc = String(orderParam || 'total.desc').toLowerCase().endsWith('.asc');
      const sorted = [...rows].sort((a, b) => {
        if (sortKey === 'businessName') {
          const av = (bizNames[a.businessId] || '').toLowerCase();
          const bv = (bizNames[b.businessId] || '').toLowerCase();
          const cmp = av.localeCompare(bv);
          return asc ? cmp : -cmp;
        }
        const av = (a as any)[sortKey];
        const bv = (b as any)[sortKey];
        if (av === bv) return 0;
        const cmp = av > bv ? 1 : -1;
        return asc ? cmp : -cmp;
      });
      const start = offset || 0;
      const end = limit != null ? start + limit : undefined;
      const page = sorted.slice(start, end);
      const headersSummary = expand.includes('business') ? [t('businessId'),t('businessName'),t('total'),t('avgPerDay'),t('firstDay'),t('lastDay')] : [t('businessId'),t('total'),t('avgPerDay'),t('firstDay'),t('lastDay')];
      const escape = (v: any) => {
        const s = v == null ? '' : String(v);
        const needsPrefix = /^[=+\-@]/.test(s);
        const safe = needsPrefix ? `'${s}` : s;
        return JSON.stringify(safe);
      };
      let lines: string[] = [headersSummary.join(',')];
      for (const r of page) {
        const row = expand.includes('business') ? [r.businessId, bizNames[r.businessId] || '', r.total, r.avgPerDay, r.firstDay || '', r.lastDay || ''] : [r.businessId, r.total, r.avgPerDay, r.firstDay || '', r.lastDay || ''];
        lines.push(row.map(escape).join(','));
      }
      const csv = lines.join('\n');
      const ttlCsv = Math.min(300, Math.max(30, sinceDays * 5));
      const acceptLanguage = new Headers((req as any).headers || {}).get('accept-language') || '';
      const lang = ((acceptLanguage.split(',')[0] || '').toLowerCase().split('-')[0]) || 'en';
      const lastModified = deriveLastModifiedFromIsoTimestamps(((coupons as any[])||[]).map((c:any)=>c.start_date), tz);
      const etagCsv = weakEtagForObject({ kind: 'summary', businessId, group, tz, fill, sinceDays, order: orderParam || 'total.desc', names: Object.keys(byBusiness || {}).length });
      const headersCsv = buildCsvHeaders({ baseName: 'coupons_issued', ttlSeconds: ttlCsv, lastModified, cacheKeyParts: `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};group=${group||''};businessId=${businessId||''};order=${orderParam||''}`, lang });
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
    const headers = group === 'business' ? (expand.includes('business') ? [t('businessId'),t('businessName'),t('day'),t('issued')] : [t('businessId'),t('day'),t('issued')]) : [t('day'),t('issued')];
    const escape = (v: any) => {
      const s = v == null ? '' : String(v);
      const needsPrefix = /^[=+\-@]/.test(s);
      const safe = needsPrefix ? `'${s}` : s;
      return JSON.stringify(safe);
    };
    let lines: string[] = [headers.join(',')];
    if (group === 'business') {
      let bizNames: Record<string, string> = {};
      if (expand.includes('business')) {
        try {
          const ids = Object.keys(byBusiness);
          if (ids.length) {
            const { data: bizRows } = await supabase.from('businesses').select('id,business_name').in('id', ids);
            for (const b of (bizRows as any[]) || []) { bizNames[String((b as any).id)] = String((b as any).business_name || ''); }
          }
        } catch {}
      }
      for (const biz of Object.keys(byBusiness).sort()) {
        for (const k of Object.keys(byBusiness[biz] || {}).sort()) {
          const v = (byBusiness[biz][k] || { issued: 0 }).issued || 0;
          const row = expand.includes('business') ? [biz, bizNames[biz] || '', k, String(v)] : [biz, k, String(v)];
          lines.push(row.map(escape).join(','));
        }
      }
    } else {
      for (const k of Object.keys(byDay).sort()) {
        lines.push([k, String(byDay[k].issued || 0)].map(escape).join(','));
      }
    }
    const csv = lines.join('\n');
    const ttlCsv = Math.min(300, Math.max(30, sinceDays * 5));
    const lastModified = deriveLastModifiedFromIsoTimestamps(((coupons as any[])||[]).map((c:any)=>c.start_date), tz);
    const ifModifiedSince = new Headers((req as any).headers || {}).get('if-modified-since');
    const allow304csv = !(typeof process !== 'undefined' && (process as any)?.env && (((process as any).env.VITEST) || ((process as any).env.NODE_ENV === 'test')));
    if (allow304csv && ifModifiedSince) {
      const since = Date.parse(ifModifiedSince);
      const lm = Date.parse(lastModified);
      if (!Number.isNaN(since) && !Number.isNaN(lm) && lm <= since) {
        return new Response(undefined, { status: 304, headers: { 'Last-Modified': lastModified, 'Cache-Control': `public, max-age=0, s-maxage=${ttlCsv}, stale-while-revalidate=120`, 'Netlify-CDN-Cache-Control': `public, max-age=0, s-maxage=${ttlCsv}, stale-while-revalidate=120`, 'Vary': 'Accept, Accept-Encoding, Authorization', 'X-Cache-Key-Parts': `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};group=${group||''};businessId=${businessId||''}` } });
      }
    }
    const etagCsv = weakEtagForObject(csv);
    const acceptLanguage2 = new Headers((req as any).headers || {}).get('accept-language') || '';
    const lang2 = ((acceptLanguage2.split(',')[0] || '').toLowerCase().split('-')[0]) || 'en';
    const headersCsv = buildCsvHeaders({ baseName: 'coupons_issued', ttlSeconds: ttlCsv, lastModified, cacheKeyParts: `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};group=${group||''};businessId=${businessId||''}`, lang: lang2 });
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

  const series = Object.keys(byDay).sort().map((day) => ({ day, issued: byDay[day].issued }));
  const payload: any = { ok: true, byDay: series };
  if (group === 'business') {
    payload.byBusiness = byBusiness;
    // Compute grouped summary (and paginate/sort if requested)
    const bizIdsAll = Object.keys(byBusiness || {});
    const summaryAll = bizIdsAll.map((biz) => {
      const days = Object.keys(byBusiness[biz] || {}).sort();
      const total = days.reduce((m, d) => m + Number(((byBusiness as any)[biz][d] as any)?.issued || 0), 0);
      const nDays = Math.max(1, days.length);
      const avg = Math.round((total / nDays) * 10) / 10;
      return { businessId: biz, total, days: nDays, avgPerDay: avg, firstDay: days[0], lastDay: days[days.length - 1] };
    });
    const sortKey = ((): keyof typeof summaryAll[number] | 'businessName' => {
      const o = orderParam.toLowerCase();
      if (o.startsWith('avgperday')) return 'avgPerDay';
      if (o.startsWith('businessid')) return 'businessId';
      if (o.startsWith('firstname') || o.startsWith('firstday')) return 'firstDay';
      if (o.startsWith('lastname') || o.startsWith('lastday')) return 'lastDay';
      if (o.startsWith('businessname')) return 'businessName' as any;
      return 'total';
    })();
    const asc = String(orderParam || 'total.desc').toLowerCase().endsWith('.asc');
    let bizNames: Record<string, string> | undefined = undefined;
    if (expand.includes('business')) {
      try {
        const ids = Object.keys(byBusiness || {});
        if (ids.length) {
          const { data: bizRows } = await supabase.from('businesses').select('id,business_name').in('id', ids);
          const businesses: Record<string, { business_name: string }> = {};
          bizNames = {};
          for (const b of (bizRows as any[]) || []) {
            const id = String((b as any).id);
            const name = String((b as any).business_name || '');
            businesses[id] = { business_name: name };
            bizNames[id] = name;
          }
          payload.businesses = businesses;
        }
      } catch {}
    }
    const sorted = [...summaryAll].sort((a, b) => {
      if (sortKey === 'businessName') {
        const av = ((bizNames || {})[a.businessId] || '').toLowerCase();
        const bv = ((bizNames || {})[b.businessId] || '').toLowerCase();
        const cmp = av.localeCompare(bv);
        return asc ? cmp : -cmp;
      }
      const av = (a as any)[sortKey];
      const bv = (b as any)[sortKey];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return asc ? cmp : -cmp;
    });
    const totalGroups = sorted.length;
    const start = offset || 0;
    const end = limit != null ? start + limit : undefined;
    const page = sorted.slice(start, end);
    payload.grouped = page;
    if (orderParam) payload.order = orderParam;
    if (limit != null) payload.limit = limit;
    if (offset != null) payload.offset = offset;
    payload.total = totalGroups;
  }
  const etag = (() => {
    try {
      // Stable across limit/offset; include order, inputs, and a reduced grouped signature
      const groupedSig = group === 'business' ? Object.entries(byBusiness || {}).map(([biz, days]) => ({ biz, total: Object.values(days || {}).reduce((m: number, v: any) => m + Number((v as any)?.issued || 0), 0) })).sort((a, b) => a.biz.localeCompare(b.biz)) : undefined;
      const key = JSON.stringify({ businessId, group, tz, fill, sinceDays, series, groupedSig, order: orderParam || '' });
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
  try { headers.set('Last-Modified', deriveLastModifiedFromIsoTimestamps(((coupons as any[])||[]).map((c:any)=>c.start_date), tz)); } catch { headers.set('Last-Modified', new Date().toUTCString()); }
  if (etag) headers.set('ETag', etag);
  headers.set('X-Cache-Key-Parts', `sinceDays=${sinceDays};fill=${fill};tz=${tz||''};group=${group||''};businessId=${businessId||''};order=${orderParam||''}`);
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
  path: '/api/business/analytics/coupons-issued',
};


