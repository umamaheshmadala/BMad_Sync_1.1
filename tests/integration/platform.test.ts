import configGet from '../../apps/api/functions/platform-config-get';
import configPut from '../../apps/api/functions/platform-config-runtime-put';
import revenueGet from '../../apps/api/functions/platform-revenue-get';

function path(base: string) { return `http://localhost${base}`; }
function makeReq(url: string, method: string, body?: any) {
  return new Request(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
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
  const res = await revenueGet(makeReq(path('/api/platform/revenue'), 'GET')) as Response;
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json).toHaveProperty('coupon_revenue');
});


