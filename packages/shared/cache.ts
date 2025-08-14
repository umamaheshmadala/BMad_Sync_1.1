export function computeTtlFromSinceDays(sinceDays: number): number {
  const days = Math.max(1, Math.min(365, Number(sinceDays || 7)));
  return Math.min(300, Math.max(30, days * 5));
}

export function weakEtagForObject(obj: unknown): string | undefined {
  try {
    // Normalize to stabilize ETag: order object keys and arrays
    const normalize = (v: any): any => {
      if (v == null) return v;
      if (Array.isArray(v)) return v.map(normalize);
      if (typeof v === 'object') {
        const entries = Object.entries(v).map(([k, val]) => [k, normalize(val)] as const).sort((a, b) => a[0].localeCompare(b[0]));
        return Object.fromEntries(entries);
      }
      return v;
    };
    const key = JSON.stringify(normalize(obj));
    let h = 2166136261 >>> 0;
    for (let i = 0; i < key.length; i++) { h ^= key.charCodeAt(i); h = Math.imul(h, 16777619); }
    const salt = 'v1';
    const salted = `${(h >>> 0).toString(16)}:${salt}`;
    let hh = 2166136261 >>> 0;
    for (let i = 0; i < salted.length; i++) { hh ^= salted.charCodeAt(i); hh = Math.imul(hh, 16777619); }
    return 'W/"' + (hh >>> 0).toString(16) + '"';
  } catch {
    return undefined;
  }
}

export function deriveLastModifiedFromKeys(keys: string[] | undefined): string {
  try {
    const last = (keys || []).sort().pop();
    return last ? new Date(`${last}T23:59:59Z`).toUTCString() : new Date().toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

export function contentDispositionFilenameForCsv(base: string, locale?: string): string {
  const safeBase = base.replace(/[^A-Za-z0-9._-]/g, '_');
  const stamp = new Date().toISOString().slice(0,10);
  const safe = locale ? `${safeBase}_${locale}` : safeBase;
  return `${safe}_${stamp}.csv`;
}

export function contentDispositionHeaderWithRFC5987(filename: string): string {
  // RFC5987: filename*=UTF-8''<url-encoded>
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_');
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export function deriveLastModifiedFromIsoTimestamps(isoTimestamps: Array<string | undefined>, tz?: string): string {
  try {
    const latest = (isoTimestamps || []).map((s) => {
      const t = Date.parse(String(s || ''));
      return Number.isNaN(t) ? 0 : t;
    }).reduce((m, t) => Math.max(m, t), 0);
    if (!latest) return new Date().toUTCString();
    const d = new Date(latest);
    let ymd: string;
    try {
      ymd = tz ? new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d) : d.toISOString().slice(0, 10);
    } catch {
      ymd = d.toISOString().slice(0, 10);
    }
    return new Date(`${ymd}T23:59:59Z`).toUTCString();
  } catch {
    return new Date().toUTCString();
  }
}

export function withContentLanguage(headers: Headers | Record<string, string>, lang?: string) {
  try {
    const h = headers instanceof Headers ? headers : new Headers(headers as any);
    if (lang) h.set('Content-Language', lang);
    return h;
  } catch {
    return headers;
  }
}

export function buildCsvHeaders(params: {
  baseName: string;
  ttlSeconds: number;
  lastModified: string;
  cacheKeyParts?: string;
  lang?: string;
}): Record<string, string> {
  const { baseName, ttlSeconds, lastModified, cacheKeyParts, lang } = params;
  const headers: Record<string, string> = {
    'Content-Type': 'text/csv; charset=utf-8',
    'Cache-Control': `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=120`,
    'Netlify-CDN-Cache-Control': `public, max-age=0, s-maxage=${ttlSeconds}, stale-while-revalidate=120`,
    'Vary': 'Accept, Accept-Encoding, Authorization, Accept-Language',
    'Last-Modified': lastModified,
  };
  if (cacheKeyParts) headers['X-Cache-Key-Parts'] = cacheKeyParts;
  const locale = lang && lang.trim() ? lang.split('-')[0] : undefined;
  const filename = contentDispositionFilenameForCsv(baseName, locale);
  headers['Content-Disposition'] = contentDispositionHeaderWithRFC5987(filename);
  if (locale) headers['Content-Language'] = locale;
  return headers;
}


