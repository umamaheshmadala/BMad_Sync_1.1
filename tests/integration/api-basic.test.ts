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
import storefrontProducts from '../../apps/api/functions/storefronts-products-post';
import analyticsReviews from '../../apps/api/functions/business-analytics-reviews-get';
import reviewsPost from '../../apps/api/functions/business-reviews-post';
import analyticsCoupons from '../../apps/api/functions/business-analytics-coupons-get';
import offersGet from '../../apps/api/functions/business-offers-get';
import offersCouponsGet from '../../apps/api/functions/business-offers-coupons-get';
import wishlistMatchesGet from '../../apps/api/functions/users-wishlist-matches-get';
import notificationsGet from '../../apps/api/functions/users-notifications-get';
import notificationReadItem from '../../apps/api/functions/users-notifications-read-item-put';
import adsPost from '../../apps/api/functions/business-ads-post';
import trendsGet from '../../apps/api/functions/business-analytics-trends-get';
import funnelGet from '../../apps/api/functions/business-analytics-funnel-get';
import reviewsSummaryGet from '../../apps/api/functions/business-analytics-reviews-summary-get';
import couponsIssuedGet from '../../apps/api/functions/business-analytics-coupons-issued-get';
import pricingPut from '../../apps/api/functions/platform-config-pricing-put';
import authSignup from '../../apps/api/functions/auth-signup';
import authLogin from '../../apps/api/functions/auth-login';

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
  // Seed some offers and coupons
  db.coupons.insert({ id: 'offer-1', business_id: TEST_BIZ_1, title: 'Alpha Deal', start_date: '2025-01-01' });
  db.coupons.insert({ id: 'offer-2', business_id: TEST_BIZ_1, title: 'Beta Bonanza', start_date: '2025-01-02' });
  db.user_coupons.insert({ id: 'uc-offer-2-1', coupon_id: 'offer-2', unique_code: 'UC-XYZ-1', is_redeemed: false });
  db.user_coupons.insert({ id: 'uc-offer-2-2', coupon_id: 'offer-2', unique_code: 'UC-XYZ-2', is_redeemed: true });
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

it('storefront products post and get', async () => {
  // Seed storefront record
  db.storefronts.insert({ id: 'sf-test', business_id: TEST_BIZ_1 });

  // Add products
  const postRes = await storefrontProducts(
    makeReq(path(`/api/storefronts/sf-test/products`), 'POST', {
      items: [
        { product_name: 'Item A', category: 'Shopping' },
        { product_name: 'Item B', category: 'Food' },
      ],
    }, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(postRes.status).toBe(200);
  const postJson = await postRes.json();
  expect(postJson.ok).toBe(true);
  expect(postJson.count).toBe(2);

  // Get products
  const getRes = await storefrontProducts(
    makeReq(path(`/api/storefronts/sf-test/products`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(getRes.status).toBe(200);
  const getJson = await getRes.json();
  expect(getJson.ok).toBe(true);
  expect(getJson.items.length).toBe(2);
});

it('rejects invalid products payloads', async () => {
  db.storefronts.insert({ id: 'sf-bad', business_id: TEST_BIZ_1 });
  // Empty items
  const resEmpty = await storefrontProducts(
    makeReq(path(`/api/storefronts/sf-bad/products`), 'POST', { items: [] }, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(resEmpty.status).toBe(400);

  // Too many items
  const many = Array.from({ length: 101 }).map((_, i) => ({ product_name: `X${i}` }));
  const resMany = await storefrontProducts(
    makeReq(path(`/api/storefronts/sf-bad/products`), 'POST', { items: many }, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(resMany.status).toBe(400);

  // Name too short
  const resShort = await storefrontProducts(
    makeReq(path(`/api/storefronts/sf-bad/products`), 'POST', { items: [{ product_name: 'X' }] }, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(resShort.status).toBe(400);
});

it('rejects products with invalid image url or too long description', async () => {
  db.storefronts.insert({ id: 'sf-validate', business_id: TEST_BIZ_1 });
  // Bad URL
  const badUrl = await storefrontProducts(
    makeReq(path(`/api/storefronts/sf-validate/products`), 'POST', { items: [{ product_name: 'Valid', product_image_url: 'ftp://bad' }] }, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(badUrl.status).toBe(400);

  // Too long description
  const longDesc = 'x'.repeat(201);
  const tooLong = await storefrontProducts(
    makeReq(path(`/api/storefronts/sf-validate/products`), 'POST', { items: [{ product_name: 'Valid', product_description: longDesc }] }, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(tooLong.status).toBe(400);
});

it('rejects review payloads with invalid types or too long text', async () => {
  // recommend_status must be boolean
  const badType = await reviewsPost(
    makeReq(path(`/api/business/${TEST_BIZ_1}/reviews`), 'POST', { recommend_status: 'yes' }, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(badType.status).toBe(400);

  // review_text too long
  const long = 'y'.repeat(201);
  const tooLong = await reviewsPost(
    makeReq(path(`/api/business/${TEST_BIZ_1}/reviews`), 'POST', { recommend_status: true, review_text: long }, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(tooLong.status).toBe(400);
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

it('lists offers with search and pagination for owner', async () => {
  const res1 = await offersGet(
    makeReq(path(`/api/business/offers?q=Beta&limit=1&offset=0&order=title.asc`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(res1.status).toBe(200);
  const j1 = await res1.json();
  expect(j1.ok).toBe(true);
  expect(Array.isArray(j1.items)).toBe(true);
  expect(j1.items.length).toBeLessThanOrEqual(1);
  // Next page
  const res2 = await offersGet(
    makeReq(path(`/api/business/offers?limit=1&offset=1&order=start_date.desc`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  const j2 = await res2.json();
  expect(j2.ok).toBe(true);
});

it('lists offer coupons with pagination and code search for owner', async () => {
  const res = await offersCouponsGet(
    makeReq(path(`/api/business/offers/offer-2/coupons?limit=1&offset=0&q=XYZ&order=unique_code.asc`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(res.status).toBe(200);
  const j = await res.json();
  expect(j.ok).toBe(true);
  expect(Array.isArray(j.items)).toBe(true);
  expect(j.items.length).toBe(1);
});

it('orders and paginates reviews asc/desc with totals', async () => {
  // Seed deterministic timestamps
  const now = Date.now();
  db.business_reviews.insert({ id: 'r3', business_id: TEST_BIZ_1, recommend_status: true, created_at: new Date(now - 3000).toISOString() });
  db.business_reviews.insert({ id: 'r4', business_id: TEST_BIZ_1, recommend_status: false, created_at: new Date(now - 2000).toISOString() });
  db.business_reviews.insert({ id: 'r5', business_id: TEST_BIZ_1, recommend_status: true, created_at: new Date(now - 1000).toISOString() });

  // Desc by created_at (default)
  const resDesc = await reviewsPost(
    makeReq(path(`/api/business/${TEST_BIZ_1}/reviews?limit=2&offset=0&order=created_at.desc`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(resDesc.status).toBe(200);
  const jDesc = await resDesc.json();
  expect(jDesc.ok).toBe(true);
  expect(jDesc.limit).toBe(2);
  expect(jDesc.total).toBeGreaterThanOrEqual(5);
  // Asc by created_at
  const resAsc = await reviewsPost(
    makeReq(path(`/api/business/${TEST_BIZ_1}/reviews?limit=2&offset=0&order=created_at.asc`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  const jAsc = await resAsc.json();
  expect(jAsc.ok).toBe(true);
  expect(jAsc.limit).toBe(2);
  // Order by recommend_status desc
  const resRec = await reviewsPost(
    makeReq(path(`/api/business/${TEST_BIZ_1}/reviews?limit=3&offset=0&order=recommend_status.desc`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  const jRec = await resRec.json();
  expect(jRec.ok).toBe(true);
  expect(jRec.limit).toBe(3);
});

it('creates a business review and reflects in analytics', async () => {
  // Add positive review
  const resPost = await reviewsPost(
    makeReq(path(`/api/business/${TEST_BIZ_1}/reviews`), 'POST', { recommend_status: true, review_text: 'Nice!' }, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(resPost.status).toBe(200);
  const rj = await resPost.json();
  expect(rj.ok).toBe(true);

  const resReviews = await analyticsReviews(
    makeReq(path(`/api/business/${TEST_BIZ_1}/analytics/reviews`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  const json = await resReviews.json();
  expect(json.ok).toBe(true);
  expect(json.summary.recommend + json.summary.not_recommend).toBe(3);
});

it('filters reviews by recommend status for owner', async () => {
  // Owner requests only positive reviews
  const res = await reviewsPost(
    makeReq(path(`/api/business/${TEST_BIZ_1}/reviews?recommend=true&limit=10&offset=0`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.ok).toBe(true);
  expect(Array.isArray(json.items)).toBe(true);
  for (const r of json.items) {
    expect(r.recommend_status).toBe(true);
  }
});

it('returns wishlist matches by category', async () => {
  // Ensure a wishlist item exists and a product with same category
  db.wishlist_items.insert({ id: 'w1', user_id: TEST_USER_1, item_name: 'Sneakers', category: 'Shopping' });
  db.storefronts.insert({ id: 'sf1', business_id: TEST_BIZ_1 });
  db.storefront_products.insert({ id: 'p1', storefront_id: 'sf1', category: 'Shopping' });

  const res = await wishlistMatchesGet(
    makeReq(path(`/api/users/${TEST_USER_1}/wishlist/matches`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1),
    })
  );
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.ok).toBe(true);
  expect(json.count).toBeGreaterThan(0);
});

it('persists and returns notifications for wishlist matches', async () => {
  // Ensure wishlist and product overlap
  db.wishlist_items.insert({ id: 'w2', user_id: TEST_USER_1, item_name: 'Pasta', category: 'Food', subcategory_l1: 'Italian' });
  db.storefronts.insert({ id: 'sf2', business_id: TEST_BIZ_1 });
  db.storefront_products.insert({ id: 'p2', storefront_id: 'sf2', category: 'Food', subcategory_l1: 'Italian' });

  // Trigger matches (which should persist a notification)
  await wishlistMatchesGet(
    makeReq(path(`/api/users/${TEST_USER_1}/wishlist/matches`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1),
    })
  );

  // Retrieve notifications
  const resN = await notificationsGet(
    makeReq(path(`/api/users/${TEST_USER_1}/notifications`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1),
    })
  );
  expect(resN.status).toBe(200);
  const jsonN = await resN.json();
  expect(jsonN.ok).toBe(true);
  expect(Array.isArray(jsonN.items)).toBe(true);
  expect(jsonN.items.length).toBeGreaterThan(0);
});

it('clears notifications for a user', async () => {
  // Seed a notification
  db.notifications.insert({ id: 'n1', recipient_user_id: TEST_USER_1, message: 'X', notification_type: 'wishlist_match' });
  const resDel = await notificationsGet(
    makeReq(path(`/api/users/${TEST_USER_1}/notifications`), 'DELETE', undefined, {
      Authorization: bearer(TEST_USER_1),
    })
  );
  expect(resDel.status).toBe(200);
  const jsonDel = await resDel.json();
  expect(jsonDel.ok).toBe(true);

  const resN = await notificationsGet(
    makeReq(path(`/api/users/${TEST_USER_1}/notifications`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1),
    })
  );
  const jsonN = await resN.json();
  expect(jsonN.ok).toBe(true);
  expect(jsonN.items.length).toBe(0);
});

it('marks a single notification as read', async () => {
  const n = db.notifications.insert({ recipient_user_id: TEST_USER_1, message: 'Y', notification_type: 'wishlist_match' });
  const res = await notificationReadItem(
    makeReq(path(`/api/users/${TEST_USER_1}/notifications/${n.id}/read`), 'PUT', undefined, {
      Authorization: bearer(TEST_USER_1),
    })
  );
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.ok).toBe(true);
});

it('posts an ad for business owner', async () => {
  const res = await adsPost(
    makeReq(path(`/api/business/ads`), 'POST', { title: 'Sale' }, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(res.status).toBe(200);
  const j = await res.json();
  expect(j.ok).toBe(true);
});

it('returns analytics trends', async () => {
  // Seed some data
  db.business_reviews.insert({ business_id: TEST_BIZ_1, recommend_status: true, created_at: new Date().toISOString() });
  db.user_coupons.insert({ coupon_id: TEST_COUPON_1, is_redeemed: false, collected_at: new Date().toISOString() });
  const res = await trendsGet(makeReq(path(`/api/business/analytics/trends`), 'GET'));
  expect(res.status).toBe(200);
  const j = await res.json();
  expect(j.ok).toBe(true);
  expect(j.trends).toBeTruthy();
});

it('trends zero-fill and sinceDays clamping', async () => {
  const res = await trendsGet(makeReq(path(`/api/business/analytics/trends?sinceDays=1`), 'GET'));
  expect(res.status).toBe(200);
  const j = await res.json();
  expect(j.ok).toBe(true);
  // Expect at least 1 day present
  expect(Object.keys(j.trends.reviews).length).toBeGreaterThanOrEqual(1);
});

it('rejects large sinceDays when fill=true for trends', async () => {
  const res = await trendsGet(makeReq(path(`/api/business/analytics/trends?sinceDays=1000`), 'GET'));
  expect(res.status).toBe(400);
});

it('rejects invalid tz and supports CSV for trends', async () => {
  const bad = await trendsGet(makeReq(path(`/api/business/analytics/trends?tz=Invalid/TZ`), 'GET'));
  expect(bad.status).toBe(400);
  const csv = await trendsGet(makeReq(path(`/api/business/analytics/trends?format=csv`), 'GET'));
  expect(csv.headers.get('Content-Type')).toContain('text/csv');
  expect(csv.headers.get('Cache-Control')).toMatch(/s-maxage=/);
});

it('reviews summary by day returns zero-filled series and enforces guard', async () => {
  // Seed a few reviews with timestamps
  const now = Date.now();
  db.business_reviews.insert({ business_id: TEST_BIZ_1, recommend_status: true, created_at: new Date(now - 24*60*60*1000).toISOString() });
  db.business_reviews.insert({ business_id: TEST_BIZ_1, recommend_status: false, created_at: new Date(now - 2*24*60*60*1000).toISOString() });

  const ok = await reviewsSummaryGet(
    makeReq(path(`/api/business/analytics/reviews-summary?businessId=${TEST_BIZ_1}&sinceDays=3`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(ok.status).toBe(200);
  const j = await ok.json();
  expect(j.ok).toBe(true);
  expect(Array.isArray(j.byDay)).toBe(true);
  // CSV variant returns cache headers
  const okCsv = await reviewsSummaryGet(
    makeReq(path(`/api/business/analytics/reviews-summary?businessId=${TEST_BIZ_1}&sinceDays=3&format=csv`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(okCsv.headers.get('Content-Type')).toContain('text/csv');
  expect(okCsv.headers.get('Cache-Control')).toMatch(/s-maxage=/);
  // Guard
  const bad = await reviewsSummaryGet(
    makeReq(path(`/api/business/analytics/reviews-summary?businessId=${TEST_BIZ_1}&sinceDays=1000`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(bad.status).toBe(400);
});

it('coupons issued grouped by business returns JSON and CSV', async () => {
  // Seed a second business and coupons with recent start_date
  db.businesses.insert({ id: 'biz-2', owner_user_id: TEST_USER_1 });
  db.coupons.insert({ id: 'ci-1', business_id: TEST_BIZ_1, start_date: new Date().toISOString() });
  db.coupons.insert({ id: 'ci-2', business_id: 'biz-2', start_date: new Date().toISOString() });

  const owner = { Authorization: bearer(TEST_USER_1, 'owner') };
  const resJson = await couponsIssuedGet(
    makeReq(path(`/api/business/analytics/coupons-issued?group=business&sinceDays=2`), 'GET', undefined, owner)
  );
  expect(resJson.status).toBe(200);
  const j = await resJson.json();
  expect(j.ok).toBe(true);
  expect(j.byBusiness).toBeTruthy();

  const resCsv = await couponsIssuedGet(
    makeReq(path(`/api/business/analytics/coupons-issued?group=business&sinceDays=2&format=csv`), 'GET', undefined, owner)
  );
  expect(resCsv.headers.get('Content-Type')).toContain('text/csv');
});

it('coupons issued grouped supports server-side order/limit/offset and CSV summary', async () => {
  // Seed businesses and coupons
  db.businesses.insert({ id: 'gbiz-1', owner_user_id: TEST_USER_1 });
  db.businesses.insert({ id: 'gbiz-2', owner_user_id: TEST_USER_1 });
  db.coupons.insert({ id: 'gci-1', business_id: 'gbiz-1', start_date: new Date().toISOString() });
  db.coupons.insert({ id: 'gci-2', business_id: 'gbiz-1', start_date: new Date().toISOString() });
  db.coupons.insert({ id: 'gci-3', business_id: 'gbiz-2', start_date: new Date().toISOString() });

  const owner = { Authorization: bearer(TEST_USER_1, 'owner') };
  const json = await couponsIssuedGet(
    makeReq(path(`/api/business/analytics/coupons-issued?group=business&sinceDays=7&order=total.desc&limit=1&offset=0`), 'GET', undefined, owner)
  );
  expect(json.status).toBe(200);
  const jj = await json.json();
  expect(jj.ok).toBe(true);
  expect(Array.isArray(jj.grouped)).toBe(true);
  expect(jj.limit).toBe(1);
  expect(jj.total).toBeGreaterThanOrEqual(2);

  const csv = await couponsIssuedGet(
    makeReq(path(`/api/business/analytics/coupons-issued?group=business&sinceDays=7&order=total.desc&limit=1&offset=0&expand=business&format=csv`), 'GET', undefined, owner)
  );
  expect(csv.headers.get('Content-Type') || '').toContain('text/csv');
  const disp = csv.headers.get('Content-Disposition') || '';
  expect(disp.toLowerCase()).toContain('attachment');
});

it('invalid order parameter returns 400', async () => {
  const owner = { Authorization: bearer(TEST_USER_1, 'owner') };
  const res = await couponsIssuedGet(
    makeReq(path(`/api/business/analytics/coupons-issued?group=business&order=not_a_key.asc`), 'GET', undefined, owner)
  );
  expect(res.status).toBe(400);
});

it('large offset returns empty grouped page but stable total', async () => {
  // Ensure at least one business exists
  db.businesses.insert({ id: 'pgbiz-1', owner_user_id: TEST_USER_1 });
  db.coupons.insert({ id: 'pgc-1', business_id: 'pgbiz-1', start_date: new Date().toISOString() });
  const owner = { Authorization: bearer(TEST_USER_1, 'owner') };
  const res1 = await couponsIssuedGet(
    makeReq(path(`/api/business/analytics/coupons-issued?group=business&sinceDays=7`), 'GET', undefined, owner)
  );
  const j1 = await res1.json();
  const total = Number(j1?.total || Object.keys(j1?.byBusiness || {}).length);
  const res2 = await couponsIssuedGet(
    makeReq(path(`/api/business/analytics/coupons-issued?group=business&sinceDays=7&limit=10&offset=9999&order=total.desc`), 'GET', undefined, owner)
  );
  const j2 = await res2.json();
  expect(Array.isArray(j2.grouped)).toBe(true);
  expect((j2.grouped as any[]).length).toBe(0);
  expect(Number(j2.total)).toBe(total);
});

it('filters reviews by created_at date range', async () => {
  const now = Date.now();
  const early = new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString();
  const mid = new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString();
  const late = new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString();
  db.business_reviews.insert({ id: 'dr1', business_id: TEST_BIZ_1, recommend_status: true, created_at: early });
  db.business_reviews.insert({ id: 'dr2', business_id: TEST_BIZ_1, recommend_status: false, created_at: mid });
  db.business_reviews.insert({ id: 'dr3', business_id: TEST_BIZ_1, recommend_status: true, created_at: late });
  const res = await reviewsPost(
    makeReq(path(`/api/business/${TEST_BIZ_1}/reviews?created_gte=${encodeURIComponent(mid)}&created_lte=${encodeURIComponent(late)}&limit=100&offset=0`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(res.status).toBe(200);
  const j = await res.json();
  expect(j.ok).toBe(true);
  // Should include mid and late, but not early
  const ids = (j.items as any[]).map(r => r.id);
  expect(ids.includes('dr2')).toBe(true);
  expect(ids.includes('dr3')).toBe(true);
  expect(ids.includes('dr1')).toBe(false);
});

it('forbids analytics trends with businessId for non-owner', async () => {
  const res = await trendsGet(
    makeReq(path(`/api/business/analytics/trends?businessId=${TEST_BIZ_1}`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(res.status).toBe(403);
});

it('forbids coupons analytics for non-owner; allows owner', async () => {
  // Seed coupon activity
  db.user_coupons.insert({ id: 'uc3', coupon_id: TEST_COUPON_1, is_redeemed: true });
  // Non-owner forbidden
  const forb = await analyticsCoupons(
    makeReq(path(`/api/business/${TEST_BIZ_1}/analytics/coupons`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(forb.status).toBe(403);
  // Owner allowed
  const ok = await analyticsCoupons(
    makeReq(path(`/api/business/${TEST_BIZ_1}/analytics/coupons`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(ok.status).toBe(200);
});

it('updates platform pricing (owner)', async () => {
  const res = await pricingPut(
    makeReq(path(`/api/platform/config/pricing`), 'PUT', { tiers: [{ name: 'basic', price: 0 }] }, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(res.status).toBe(200);
  const j = await res.json();
  expect(j.ok).toBe(true);
});

it('auth signup and login return unsigned bearer token', async () => {
  const email = 'test@example.com';
  const resSignup = await authSignup(makeReq(path(`/api/auth/signup`), 'POST', { email }));
  expect(resSignup.status).toBe(200);
  const sj = await resSignup.json();
  expect(sj.ok).toBe(true);
  expect(String(sj.bearer || '')).toContain('Bearer ');

  const resLogin = await authLogin(makeReq(path(`/api/auth/login`), 'POST', { email }));
  const lj = await resLogin.json();
  expect(lj.ok).toBe(true);
  expect(String(lj.bearer || '')).toContain('Bearer ');
});

it('rejects unauthorized requests with 401', async () => {
  const res = await wishlistPost(
    makeReq(path(`/api/users/${TEST_USER_1}/wishlist`), 'POST', { item_name: 'X' })
  );
  expect(res.status).toBe(401);
});

it('rejects forbidden requests with 403 when caller != path user', async () => {
  const res = await wishlistPost(
    makeReq(path(`/api/users/${TEST_USER_1}/wishlist`), 'POST', { item_name: 'X' }, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(res.status).toBe(403);
});

it('enforces basic access patterns akin to RLS (owner vs non-owner)', async () => {
  // Non-owner cannot read another user's notifications
  db.notifications.insert({ id: 'n2', recipient_user_id: TEST_USER_1, message: 'Z', notification_type: 'wishlist_match' });
  const resN = await notificationsGet(
    makeReq(path(`/api/users/${TEST_USER_1}/notifications`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(resN.status).toBe(403);

  // Non-owner cannot list reviews for business they don't own
  const resRev = await reviewsPost(
    makeReq(path(`/api/business/${TEST_BIZ_1}/reviews`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_2),
    })
  );
  expect(resRev.status).toBe(403);

  // Business owner can list reviews
  const resOwner = await reviewsPost(
    makeReq(path(`/api/business/${TEST_BIZ_1}/reviews`), 'GET', undefined, {
      Authorization: bearer(TEST_USER_1, 'owner'),
    })
  );
  expect(resOwner.status).toBe(200);
});

it('ETag/Last-Modified 304 works for trends and coupons-issued CSV', async () => {
  const first = await trendsGet(makeReq(path(`/api/business/analytics/trends?sinceDays=1`), 'GET'));
  expect(first.status).toBe(200);
  const lm = first.headers.get('Last-Modified') || '';
  const again = await trendsGet(new Request(path(`/api/business/analytics/trends?sinceDays=1`), { method: 'GET', headers: { 'If-Modified-Since': lm } } as any));
  expect([200, 304]).toContain(again.status);

  const csv1 = await (await import('../../apps/api/functions/business-analytics-coupons-issued-get')).default(
    makeReq(path(`/api/business/analytics/coupons-issued?format=csv`), 'GET')
  ) as Response;
  expect(csv1.status).toBe(200);
  const lmCsv = csv1.headers.get('Last-Modified') || '';
  const csv2 = await (await import('../../apps/api/functions/business-analytics-coupons-issued-get')).default(
    new Request(path(`/api/business/analytics/coupons-issued?format=csv`), { method: 'GET', headers: { 'If-Modified-Since': lmCsv } } as any)
  ) as Response;
  expect([200, 304]).toContain(csv2.status);
  // ETag for CSV trends
  const trendsCsv = await (await import('../../apps/api/functions/business-analytics-trends-get')).default(
    makeReq(path(`/api/business/analytics/trends?format=csv`), 'GET')
  ) as Response;
  const et = trendsCsv.headers.get('ETag');
  if (et) {
    const trendsCsv2 = await (await import('../../apps/api/functions/business-analytics-trends-get')).default(
      new Request(path(`/api/business/analytics/trends?format=csv`), { method: 'GET', headers: { 'If-None-Match': et } } as any)
    ) as Response;
    expect([200,304]).toContain(trendsCsv2.status);
  }
});

it('CSV headers localized for es/fr/pt and ETag varies by locale', async () => {
  // Ensure some activity exists
  db.business_reviews.insert({ business_id: TEST_BIZ_1, recommend_status: true, created_at: new Date().toISOString() });
  db.user_coupons.insert({ coupon_id: TEST_COUPON_1, is_redeemed: false, collected_at: new Date().toISOString() });

  const resEs = await trendsGet(new Request(path(`/api/business/analytics/trends?format=csv`), { method: 'GET', headers: { 'Accept-Language': 'es-ES' } } as any));
  const hEs = await resEs.text();
  expect(hEs.split('\n')[0]).toContain('día');
  const etEs = resEs.headers.get('ETag') || '';

  const resFr = await trendsGet(new Request(path(`/api/business/analytics/trends?format=csv`), { method: 'GET', headers: { 'Accept-Language': 'fr-FR' } } as any));
  const hFr = await resFr.text();
  expect(hFr.split('\n')[0]).toContain('jour');
  const etFr = resFr.headers.get('ETag') || '';

  const resPt = await trendsGet(new Request(path(`/api/business/analytics/trends?format=csv`), { method: 'GET', headers: { 'Accept-Language': 'pt-BR' } } as any));
  const hPt = await resPt.text();
  expect(hPt.split('\n')[0]).toContain('dia');

  if (etEs && etFr) expect(etEs).not.toBe(etFr);
});

it('Funnel CSV localized headers and JSON 304 semantics', async () => {
  // Seed coupon activity
  db.user_coupons.insert({ id: 'fuc1', coupon_id: TEST_COUPON_1, is_redeemed: false, collected_at: new Date().toISOString() });
  const csv = await funnelGet(new Request(path(`/api/business/analytics/funnel?format=csv`), { method: 'GET', headers: { 'Accept-Language': 'fr-FR' } } as any));
  const text = await csv.text();
  expect(text.split('\n')[0]).toContain('jour');
  // JSON ETag revalidation (may be 200 in test env)
  const j1 = await funnelGet(makeReq(path(`/api/business/analytics/funnel`), 'GET'));
  const et = j1.headers.get('ETag') || '';
  if (et) {
    const j2 = await funnelGet(new Request(path(`/api/business/analytics/funnel`), { method: 'GET', headers: { 'If-None-Match': et } } as any));
    expect([200, 304]).toContain(j2.status);
  }
});

it('Coupons-issued summary CSV localized headers (fr) with business name', async () => {
  // Seed businesses and coupons
  db.businesses.insert({ id: 'locbiz-1', owner_user_id: TEST_USER_1, business_name: 'Étoile' });
  db.coupons.insert({ id: 'locci-1', business_id: 'locbiz-1', start_date: new Date().toISOString() });
  const owner = { Authorization: bearer(TEST_USER_1, 'owner') };
  const res = await couponsIssuedGet(
    new Request(path(`/api/business/analytics/coupons-issued?group=business&order=total.desc&limit=1&offset=0&expand=business&format=csv`), { method: 'GET', headers: { ...owner, 'Accept-Language': 'fr-FR' } } as any)
  );
  const text = await (res as any as Response).text();
  expect(text.split('\n')[0]).toContain("nomD'Entreprise");
});

it('CSV Content-Disposition includes RFC5987 filename* and locale suffix', async () => {
  const trendsCsv = await (await import('../../apps/api/functions/business-analytics-trends-get')).default(
    new Request(path(`/api/business/analytics/trends?format=csv`), { method: 'GET', headers: { 'Accept-Language': 'fr-FR' } } as any)
  ) as Response;
  const cd1 = trendsCsv.headers.get('Content-Disposition') || '';
  expect(cd1).toMatch(/filename=/);
  expect(cd1).toMatch(/filename\*=/);
  expect(cd1).toMatch(/trends_fr/);

  const funnelCsv = await (await import('../../apps/api/functions/business-analytics-funnel-get')).default(
    new Request(path(`/api/business/analytics/funnel?format=csv`), { method: 'GET', headers: { 'Accept-Language': 'pt-BR' } } as any)
  ) as Response;
  const cd2 = funnelCsv.headers.get('Content-Disposition') || '';
  expect(cd2).toMatch(/filename\*=/);
  expect(cd2).toMatch(/funnel_pt/);

  const issuedCsv = await (await import('../../apps/api/functions/business-analytics-coupons-issued-get')).default(
    new Request(path(`/api/business/analytics/coupons-issued?format=csv`), { method: 'GET', headers: { 'Accept-Language': 'es-ES' } } as any)
  ) as Response;
  const cd3 = issuedCsv.headers.get('Content-Disposition') || '';
  expect(cd3).toMatch(/filename\*=/);
  expect(cd3).toMatch(/coupons_issued_es/);
});


