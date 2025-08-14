/*
 Simple smoke test for deploy previews / production.
 Usage:
   BASE_URL="https://example.netlify.app" node scripts/smoke.mjs
 Optionally:
   TOKEN="Bearer <JWT>" BASE_URL=... node scripts/smoke.mjs
*/

const BASE_URL = process.env.BASE_URL || process.env.DEPLOY_PRIME_URL || process.env.URL;
const TOKEN = process.env.TOKEN || '';
const ACCEPT_LANGUAGE = process.env.ACCEPT_LANGUAGE || '';

if (!BASE_URL) {
  console.error('BASE_URL env var is required');
  process.exit(2);
}

function url(p) {
  return `${BASE_URL.replace(/\/$/, '')}${p}`;
}

async function get(path) {
  const res = await fetch(url(path), {
    headers: (() => {
      const h = {};
      if (TOKEN) Object.assign(h, { Authorization: TOKEN });
      if (ACCEPT_LANGUAGE) Object.assign(h, { 'Accept-Language': ACCEPT_LANGUAGE });
      return Object.keys(h).length ? h : undefined;
    })(),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { res, json, text };
}

async function saveSample(name, content) {
  try {
    const fs = await import('node:fs/promises');
    const dir = ACCEPT_LANGUAGE ? `smoke-samples/${ACCEPT_LANGUAGE}` : 'smoke-samples';
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(`${dir}/${name}`, content);
  } catch {}
}

async function main() {
  const failures = [];

  // Health
  {
    const { res, json } = await get('/api/platform/health');
    if (!res.ok || !json || json.ok !== true) {
      failures.push(`health: status=${res.status}`);
    }
  }

  // Trends
  {
    const res1 = await get('/api/business/analytics/trends?sinceDays=1');
    if (!res1.res.ok) {
      failures.push(`trends: status=${res1.res.status}`);
    }
    if (!res1.res.headers.get('RateLimit-Limit')) {
      failures.push('trends: missing RateLimit-* headers');
    }
    if (!res1.res.headers.get('ETag') || !res1.res.headers.get('Last-Modified') || !(res1.res.headers.get('Vary')||'').includes('Accept')) {
      failures.push('trends: missing cache headers');
    }
    if (res1.json) await saveSample('trends.json', JSON.stringify(res1.json, null, 2));
    const resCsv = await get('/api/business/analytics/trends?sinceDays=1&format=csv');
    if (resCsv.res.ok) {
      const cc = resCsv.res.headers.get('Cache-Control') || '';
      if (!cc.includes('s-maxage=')) failures.push('trends: CSV missing cache headers');
      const cd = resCsv.res.headers.get('Content-Disposition') || '';
      if (!cd.includes('filename')) failures.push('trends: CSV missing Content-Disposition filename');
      const cl = resCsv.res.headers.get('Content-Language') || '';
      if (ACCEPT_LANGUAGE && !cl) failures.push('trends: CSV missing Content-Language');
      await saveSample('trends.csv', resCsv.text);
    }
  }

  // Funnel
  {
    const res1 = await get('/api/business/analytics/funnel?sinceDays=1');
    if (!res1.res.ok) {
      failures.push(`funnel: status=${res1.res.status}`);
    }
    if (!res1.res.headers.get('RateLimit-Limit')) {
      failures.push('funnel: missing RateLimit-* headers');
    }
    if (!res1.res.headers.get('ETag') || !res1.res.headers.get('Last-Modified') || !(res1.res.headers.get('Vary')||'').includes('Accept')) {
      failures.push('funnel: missing cache headers');
    }
    if (res1.json) await saveSample('funnel.json', JSON.stringify(res1.json, null, 2));
    const resCsv = await get('/api/business/analytics/funnel?sinceDays=1&format=csv');
    if (resCsv.res.ok) {
      const cc = resCsv.res.headers.get('Cache-Control') || '';
      if (!cc.includes('s-maxage=')) failures.push('funnel: CSV missing cache headers');
      const cd = resCsv.res.headers.get('Content-Disposition') || '';
      if (!cd.includes('filename')) failures.push('funnel: CSV missing Content-Disposition filename');
      const cl = resCsv.res.headers.get('Content-Language') || '';
      if (ACCEPT_LANGUAGE && !cl) failures.push('funnel: CSV missing Content-Language');
      await saveSample('funnel.csv', resCsv.text);
    }
  }

  // Coupons Issued JSON+CSV (requires owner token when grouped)
  if (TOKEN) {
    const { res, json, text } = await get('/api/business/analytics/coupons-issued?group=business&sinceDays=1&order=total.desc&limit=2&offset=0');
    if (!res.ok) {
      failures.push(`coupons-issued: status=${res.status}`);
    }
    if (json && Array.isArray(json.grouped) && !Number.isFinite(json.total)) {
      failures.push('coupons-issued: grouped pagination fields missing');
    }
    if (json) await saveSample('coupons-issued.json', JSON.stringify(json, null, 2));
    const csv = await get('/api/business/analytics/coupons-issued?group=business&sinceDays=1&order=total.desc&limit=2&offset=0&format=csv');
    if (csv.res.ok) {
      const cc = csv.res.headers.get('Cache-Control') || '';
      if (!cc.includes('s-maxage=')) {
        failures.push('coupons-issued: missing cache headers on CSV');
      }
      const cd = csv.res.headers.get('Content-Disposition') || '';
      if (!cd.toLowerCase().includes('attachment') || !cd.toLowerCase().includes('.csv')) {
        failures.push('coupons-issued: missing Content-Disposition for CSV');
      }
      await saveSample('coupons-issued.csv', csv.text);
    }
  }

  // Reviews Summary (owner): JSON+CSV
  if (TOKEN) {
    const { res, json } = await get('/api/business/analytics/reviews-summary?businessId=test-biz-1&sinceDays=3');
    if (!res.ok) failures.push(`reviews-summary: status=${res.status}`);
    if (json) await saveSample('reviews-summary.json', JSON.stringify(json, null, 2));
    const csv = await get('/api/business/analytics/reviews-summary?businessId=test-biz-1&sinceDays=3&format=csv');
    if (csv.res.ok) {
      const cd = csv.res.headers.get('Content-Disposition') || '';
      if (!cd.toLowerCase().includes('attachment') || !cd.toLowerCase().includes('.csv')) {
        failures.push('reviews-summary: missing Content-Disposition for CSV');
      }
      await saveSample('reviews-summary.csv', csv.text);
    }
  }

  // Optional: if TOKEN present, try a lightweight authorized call
  if (TOKEN) {
    const { res } = await get('/api/users/test-user-1/notifications?limit=1');
    if (!res.ok) {
      failures.push(`notifications: status=${res.status}`);
    }
  }

  if (failures.length) {
    console.error('SMOKE FAIL', failures);
    process.exit(1);
  }
  console.log('SMOKE OK');
}

main().catch((e) => {
  console.error('SMOKE ERROR', e?.message || e);
  process.exit(1);
});


