import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';

export default withRateLimit('business-analytics-coupons-get', { limit: 120, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const businessId = parts[3] || '';
  if (!businessId) return json({ ok: false, error: 'Missing businessId' }, { status: 400 });

  // Access control: only business owner or platform owner
  const callerId = getUserIdFromRequest(req);
  const supabase = createSupabaseClient(true) as any;
  const biz = await supabase.from('businesses').select('owner_user_id').eq('id', businessId).maybeSingle();
  if (biz?.error) return json({ ok: false, error: biz.error.message }, { status: 500 });
  const ownerId = biz?.data?.owner_user_id as string | undefined;
  if (!(isPlatformOwner(req) || (callerId && ownerId && callerId === ownerId))) {
    return json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  // Fetch coupon ids for this business first
  const { data: coupons, error: coupErr } = await supabase
    .from('coupons')
    .select('id, business_id')
    .eq('business_id', businessId);
  if (coupErr) return json({ ok: false, error: coupErr.message }, { status: 500 });
  const couponIds = new Set((coupons || []).map((c: any) => c.id));

  // Then fetch user coupons and aggregate for those ids
  const { data: userCoupons, error: ucErr } = await supabase
    .from('user_coupons')
    .select('is_redeemed, coupon_id');
  if (ucErr) return json({ ok: false, error: ucErr.message }, { status: 500 });

  let redeemed = 0;
  let total = 0;
  for (const r of (userCoupons as any[]) || []) {
    if (!couponIds.has(r.coupon_id)) continue;
    total++;
    if (r.is_redeemed) redeemed++;
  }
  const redemption_rate = total > 0 ? redeemed / total : 0;

  return json({ ok: true, summary: { redeemed, total, redemption_rate } }, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
      'Netlify-CDN-Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
    },
  });
}));

export const config = {
  path: '/api/business/:businessId/analytics/coupons',
};
