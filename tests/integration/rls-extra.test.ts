import { db } from '../setup';

import notificationsGet from '../../apps/api/functions/users-notifications-get';
import notificationsPut from '../../apps/api/functions/users-notifications-put';
import notificationReadItem from '../../apps/api/functions/users-notifications-read-item-put';
import collectPost from '../../apps/api/functions/users-coupons-collect-post';
import storefrontProducts from '../../apps/api/functions/storefronts-products-post';
import funnelGet from '../../apps/api/functions/business-analytics-funnel-get';
import revenueGet from '../../apps/api/functions/platform-revenue-get';

const TEST_USER_1 = 'test-user-1';
const TEST_USER_2 = 'test-user-2';
const TEST_BIZ_1 = 'test-biz-1';
const TEST_COUPON_1 = 'coupon-1';

function makeReq(url: string, method: string, body?: any, headers?: Record<string, string>) {
  return new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

function path(base: string) {
  return `http://localhost${base}`;
}

function bearer(userId: string, role?: string) {
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, role })).toString('base64url');
  return `Bearer ${header}.${payload}.`;
}

beforeEach(() => {
  Object.assign(db, new (db.constructor as any)());
  db.users.insert({ id: TEST_USER_1, city: 'Bengaluru', interests: [] });
  db.users.insert({ id: TEST_USER_2, city: 'Bengaluru', interests: [] });
  db.businesses.insert({ id: TEST_BIZ_1, owner_user_id: TEST_USER_1 });
  db.coupons.insert({ id: TEST_COUPON_1, business_id: TEST_BIZ_1 });
});

it('forbids clearing notifications for another user', async () => {
  db.notifications.insert({ id: 'n1', recipient_user_id: TEST_USER_1, message: 'X', notification_type: 'wishlist_match' });
  const res = await notificationsGet(
    makeReq(path(`/api/users/${TEST_USER_1}/notifications`), 'DELETE', undefined, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(res.status).toBe(403);
});

it('forbids marking all notifications read for another user', async () => {
  db.notifications.insert({ id: 'n2', recipient_user_id: TEST_USER_1, message: 'Y', notification_type: 'wishlist_match' });
  const res = await notificationsPut(
    makeReq(path(`/api/users/${TEST_USER_1}/notifications/read`), 'PUT', undefined, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(res.status).toBe(403);
});

it('forbids marking a single notification as read for another user', async () => {
  const n = db.notifications.insert({ recipient_user_id: TEST_USER_1, message: 'Z', notification_type: 'wishlist_match' });
  const res = await notificationReadItem(
    makeReq(path(`/api/users/${TEST_USER_1}/notifications/${n.id}/read`), 'PUT', undefined, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(res.status).toBe(403);
});

it('forbids collecting a coupon for another user', async () => {
  const res = await collectPost(
    makeReq(path(`/api/users/${TEST_USER_1}/coupons/collect`), 'POST', { coupon_id: TEST_COUPON_1 }, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(res.status).toBe(403);
});

it('forbids funnel analytics with businessId for non-owner', async () => {
  const res = await funnelGet(
    makeReq(path(`/api/business/analytics/funnel?businessId=${TEST_BIZ_1}`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(res.status).toBe(403);
});

it('allows owner to access platform revenue and forbids non-owner', async () => {
  const resForbidden = await revenueGet(
    makeReq(path(`/api/platform/revenue`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(resForbidden.status).toBe(403);

  const resOwner = await revenueGet(
    makeReq(path(`/api/platform/revenue`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(resOwner.status).toBe(200);
});

it('enforces storefront products GET: non-owner forbidden, owner allowed', async () => {
  db.storefronts.insert({ id: 'sf-sec', business_id: TEST_BIZ_1 });
  db.storefront_products.insert({ id: 'p-sec-1', storefront_id: 'sf-sec', product_name: 'Sec Item' });

  // Non-owner cannot read
  const resForbidden = await storefrontProducts(
    makeReq(path(`/api/storefronts/sf-sec/products`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(resForbidden.status).toBe(403);

  // Owner can read
  const resOwner = await storefrontProducts(
    makeReq(path(`/api/storefronts/sf-sec/products`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(resOwner.status).toBe(200);
  const json = await resOwner.json();
  expect(Array.isArray(json.items)).toBe(true);
});


