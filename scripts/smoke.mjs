/*
 Simple smoke test for deploy previews / production.
 Usage:
   BASE_URL="https://example.netlify.app" node scripts/smoke.mjs
 Optionally:
   TOKEN="Bearer <JWT>" BASE_URL=... node scripts/smoke.mjs
*/

const BASE_URL = process.env.BASE_URL || process.env.DEPLOY_PRIME_URL || process.env.URL;
const TOKEN = process.env.TOKEN || '';

if (!BASE_URL) {
  console.error('BASE_URL env var is required');
  process.exit(2);
}

function url(p) {
  return `${BASE_URL.replace(/\/$/, '')}${p}`;
}

async function get(path) {
  const res = await fetch(url(path), {
    headers: TOKEN ? { Authorization: TOKEN } : undefined,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = undefined; }
  return { res, json, text };
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
    const { res } = await get('/api/business/analytics/trends?sinceDays=1');
    if (!res.ok) {
      failures.push(`trends: status=${res.status}`);
    }
    // Rate limit headers present
    if (!res.headers.get('RateLimit-Limit')) {
      failures.push('trends: missing RateLimit-* headers');
    }
  }

  // Funnel
  {
    const { res } = await get('/api/business/analytics/funnel?sinceDays=1');
    if (!res.ok) {
      failures.push(`funnel: status=${res.status}`);
    }
    if (!res.headers.get('RateLimit-Limit')) {
      failures.push('funnel: missing RateLimit-* headers');
    }
  }

  // Coupons Issued JSON+CSV (requires owner token when grouped)
  if (TOKEN) {
    const { res } = await get('/api/business/analytics/coupons-issued?group=business&sinceDays=1');
    if (!res.ok) {
      failures.push(`coupons-issued: status=${res.status}`);
    }
    const csv = await get('/api/business/analytics/coupons-issued?group=business&sinceDays=1&format=csv');
    if (csv.res.ok) {
      const cc = csv.res.headers.get('Cache-Control') || '';
      if (!cc.includes('s-maxage=')) {
        failures.push('coupons-issued: missing cache headers on CSV');
      }
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


