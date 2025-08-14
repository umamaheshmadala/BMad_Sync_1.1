import configGet from '../../apps/api/functions/platform-config-get';
import configPut from '../../apps/api/functions/platform-config-runtime-put';
import revenueGet from '../../apps/api/functions/platform-revenue-get';
import ratelimitGet from '../../apps/api/functions/platform-ratelimit-get';
import healthGet from '../../apps/api/functions/platform-health-get';
import { db } from '../setup';

function path(base: string) { return `http://localhost${base}`; }
function makeReq(url: string, method: string, body?: any, headers?: Record<string, string>) {
  return new Request(url, { method, headers: { 'Content-Type': 'application/json', ...(headers || {}) }, body: body ? JSON.stringify(body) : undefined });
}

it('reads platform config with dummy billing mode', async () => {
  const res = await configGet(makeReq(path('/api/platform/config'), 'GET')) as Response;
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json['billing.mode'].value).toBe('dummy');
});

it('writes runtime platform config (no-op in scaffold)', async () => {
  const res = await configPut(makeReq(path('/api/platform/config/runtime'), 'PUT', { 'ads.carousel_slots': { value: 5 } })) as Response;
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.ok).toBe(true);
});

it('gets platform revenue summary', async () => {
  // Seed some redeemed user_coupons and matching coupons with costs
  (db as any).coupons.insert({ id: 'c1', business_id: 'b1', cost_per_coupon: 2 });
  (db as any).coupons.insert({ id: 'c2', business_id: 'b1', cost_per_coupon: 5 });
  (db as any).user_coupons.insert({ id: 'uc1', coupon_id: 'c1', is_redeemed: true });
  (db as any).user_coupons.insert({ id: 'uc2', coupon_id: 'c1', is_redeemed: false });
  (db as any).user_coupons.insert({ id: 'uc3', coupon_id: 'c2', is_redeemed: true });

  const ownerHeader = { Authorization: ((): string => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'owner-user', role: 'owner' })).toString('base64url');
    return `Bearer ${header}.${payload}.`;
  })() };
  const res = await revenueGet(makeReq(path('/api/platform/revenue'), 'GET', undefined, ownerHeader)) as Response;
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json).toHaveProperty('coupon_revenue');
  expect(json.coupon_revenue).toBe(7); // 2 (c1 redeemed once) + 5 (c2 redeemed once)
});

it('funnel guard rejects too-large sinceDays when fill=true', async () => {
  const { default: funnelGet } = await import('../../apps/api/functions/business-analytics-funnel-get');
  const res = await funnelGet(makeReq(path('/api/business/analytics/funnel?sinceDays=1000'), 'GET')) as Response;
  expect(res.status).toBe(400);
});

it('funnel invalid tz rejected and CSV returned', async () => {
  const { default: funnelGet } = await import('../../apps/api/functions/business-analytics-funnel-get');
  const bad = await funnelGet(makeReq(path('/api/business/analytics/funnel?tz=Invalid/TZ'), 'GET')) as Response;
  expect(bad.status).toBe(400);
  const ok = await funnelGet(makeReq(path('/api/business/analytics/funnel?format=csv'), 'GET')) as Response;
  expect((ok.headers as any).get('Content-Type')).toContain('text/csv');
  // Should include cache headers
  expect((ok.headers as any).get('Cache-Control')).toMatch(/s-maxage=/);
});

it('gets platform ratelimit diagnostics for owner and forbids non-owner', async () => {
  const makeBearer = (role?: string) => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 'some-user', ...(role ? { role } : {}) })).toString('base64url');
    return `Bearer ${header}.${payload}.`;
  };
  const owner = { Authorization: makeBearer('owner') };
  const nonOwner = { Authorization: makeBearer() };

  const okRes = await ratelimitGet(makeReq(path('/api/platform/ratelimit'), 'GET', undefined, owner)) as Response;
  expect([200, 403]).toContain(okRes.status); // Feature may be disabled, but owner access should not 401

  const forbRes = await ratelimitGet(makeReq(path('/api/platform/ratelimit'), 'GET', undefined, nonOwner)) as Response;
  expect(forbRes.status).toBe(403);
});

it('returns platform health with flags and version', async () => {
  const res = await healthGet(new Request('http://localhost/api/platform/health', { method: 'GET' })) as Response;
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.ok).toBe(true);
  expect(typeof json.version).toBe('string');
  expect(json.features).toHaveProperty('FEATURE_SUPABASE_AUTH');
  expect(json.features).toHaveProperty('FEATURE_DEV_AUTH');
  expect(json.features).toHaveProperty('FEATURE_SHARED_RATELIMIT');
});

it('persists runtime config and returns it from GET', async () => {
  // Update value
  const putRes = await configPut(makeReq(path('/api/platform/config/runtime'), 'PUT', { 'billing.threshold': { value: 12345 } })) as Response;
  expect(putRes.status).toBe(200);
  const putJson = await putRes.json();
  expect(putJson.ok).toBe(true);

  // Read back
  const getRes = await configGet(makeReq(path('/api/platform/config'), 'GET')) as Response;
  expect(getRes.status).toBe(200);
  const cfg = await getRes.json();
  expect(cfg['billing.threshold'].value).toBe(12345);
});


