import interests from '../../configs/interests.json';
import cities from '../../configs/cities.json';
import { db } from '../setup';

// Import handlers directly and invoke with Request to simulate serverless runtime
import usersProfileInterests from '../../apps/api/functions/users-profile-interests-put';
import wishlistPost from '../../apps/api/functions/users-wishlist-post';
import collectPost from '../../apps/api/functions/users-coupons-collect-post';
import sharePost from '../../apps/api/functions/users-coupons-share-post';
import cancelSharePost from '../../apps/api/functions/users-coupons-shared-cancel-post';
import redeemPost from '../../apps/api/functions/business-redeem-post';
import storefront from '../../apps/api/functions/business-storefront';
import analyticsReviews from '../../apps/api/functions/business-analytics-reviews-get';
import analyticsCoupons from '../../apps/api/functions/business-analytics-coupons-get';

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
  // Minimal unsigned JWT with payload containing sub and optional role
  const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ sub: userId, role })).toString('base64url');
  return `Bearer ${header}.${payload}.`;
}

beforeEach(() => {
  // Reset DB mock per test
  Object.assign(db, new (db.constructor as any)());
  // Seed baseline data
  db.users.insert({ id: TEST_USER_1, city: 'Bengaluru', interests: [] });
  db.users.insert({ id: TEST_USER_2, city: 'Bengaluru', interests: [] });
  db.businesses.insert({ id: TEST_BIZ_1, owner_user_id: TEST_USER_1 });
  db.coupons.insert({ id: TEST_COUPON_1, business_id: TEST_BIZ_1 });
  db.business_reviews.insert({ id: 'r1', business_id: TEST_BIZ_1, recommend_status: true });
  db.business_reviews.insert({ id: 'r2', business_id: TEST_BIZ_1, recommend_status: false });
});

it('updates profile interests and city', async () => {
  const city = (cities as any).tiers.tier1[0];
  const interest = (interests as any).categories[0];
  const res = await usersProfileInterests(
    makeReq(path(`/api/users/${TEST_USER_1}/profile/interests`), 'PUT', { city, interests: [interest] }, {
      Authorization: bearer(TEST_USER_1),
    })
  );
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.ok).toBe(true);
});

it('adds wishlist item with categories', async () => {
  const res = await wishlistPost(
    makeReq(path(`/api/users/${TEST_USER_1}/wishlist`), 'POST', { item_name: 'Running Shoes', item_description: 'Lightweight' }, {
      Authorization: bearer(TEST_USER_1),
    })
  );
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.ok).toBe(true);
  expect(json.category).toBeTruthy();
});

it('collects, shares, cancels share, and redeems coupon', async () => {
  // Collect
  const collectRes = await collectPost(
    makeReq(path(`/api/users/${TEST_USER_1}/coupons/collect`), 'POST', { coupon_id: TEST_COUPON_1 }, {
      Authorization: bearer(TEST_USER_1),
    })
  );
  expect(collectRes.status).toBe(200);
  const collectJson = await collectRes.json();
  expect(collectJson.ok).toBe(true);

  // Share to user 2
  const shareRes = await sharePost(
    makeReq(path(`/api/users/${TEST_USER_1}/coupons/${TEST_COUPON_1}/share`), 'POST', { receiver_user_id: TEST_USER_2 }, {
      Authorization: bearer(TEST_USER_1),
    })
  );
  expect(shareRes.status).toBe(200);
  const shareJson = await shareRes.json();
  expect(shareJson.ok).toBe(true);
  expect(shareJson.share_id).toBeTruthy();

  // Cancel share
  const cancelRes = await cancelSharePost(
    makeReq(path(`/api/users/${TEST_USER_1}/coupons/shared/${shareJson.share_id}/cancel`), 'POST', undefined, {
      Authorization: bearer(TEST_USER_1),
    })
  );
  expect(cancelRes.status).toBe(200);
  const cancelJson = await cancelRes.json();
  expect(cancelJson.ok).toBe(true);

  // Re-share then redeem at business
  const shareRes2 = await sharePost(
    makeReq(path(`/api/users/${TEST_USER_1}/coupons/${TEST_COUPON_1}/share`), 'POST', { receiver_user_id: TEST_USER_2 }, {
      Authorization: bearer(TEST_USER_1),
    })
  );
  const shareJson2 = await shareRes2.json();
  const uniqueCode = shareJson2.unique_code as string;

  // Business redeem
  const redeemRes = await redeemPost(
    makeReq(path(`/api/business/${TEST_BIZ_1}/redeem`), 'POST', { unique_code: uniqueCode }, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  const redeemJson = await redeemRes.json();
  expect(redeemJson.ok).toBe(true);
});

it('storefront upsert and get', async () => {
  // Owner is TEST_USER_1 for TEST_BIZ_1
  const postRes = await storefront(
    makeReq(path(`/api/business/storefront`), 'POST', { description: 'Great store', theme: 'light', is_open: true }, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(postRes.status).toBe(200);
  const postJson = await postRes.json();
  expect(postJson.ok).toBe(true);

  const getRes = await storefront(
    makeReq(path(`/api/business/storefront`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(getRes.status).toBe(200);
  const getJson = await getRes.json();
  expect(getJson.ok).toBe(true);
  expect(getJson.storefront).toBeTruthy();
});

it('analytics endpoints return summaries', async () => {
  // Ensure some coupon activity exists
  db.user_coupons.insert({ id: 'uc1', coupon_id: TEST_COUPON_1, is_redeemed: false });
  db.user_coupons.insert({ id: 'uc2', coupon_id: TEST_COUPON_1, is_redeemed: true });

  const resReviews = await analyticsReviews(
    makeReq(path(`/api/business/${TEST_BIZ_1}/analytics/reviews`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(resReviews.status).toBe(200);
  const jsonRev = await resReviews.json();
  expect(jsonRev.ok).toBe(true);
  expect(jsonRev.summary.recommend + jsonRev.summary.not_recommend).toBe(2);

  const resCoupons = await analyticsCoupons(
    makeReq(path(`/api/business/${TEST_BIZ_1}/analytics/coupons`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(resCoupons.status).toBe(200);
  const jsonC = await resCoupons.json();
  expect(jsonC.ok).toBe(true);
  expect(jsonC.summary.total).toBe(2);
});


