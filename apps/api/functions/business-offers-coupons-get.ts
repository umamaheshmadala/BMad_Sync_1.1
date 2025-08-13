import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { withErrorHandling } from '../../../packages/shared/errors';
import { json } from '../../../packages/shared/http';

export default withRequestLogging('business-offers-coupons-get', withRateLimit('business-offers-coupons-get', { limit: 60, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });

  const callerUserId = getUserIdFromRequest(req);
  if (!callerUserId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  const supabase = createSupabaseClient(true) as any;
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const offerId = parts[4] || '';
  if (!offerId) return json({ ok: false, error: 'Missing offerId' }, { status: 400 });

  // Verify ownership of the offer (coupon template)
  const { data: offer } = await supabase.from('coupons').select('id, business_id').eq('id', offerId).maybeSingle();
  if (!offer) return json({ ok: false, error: 'Offer not found' }, { status: 404 });
  const { data: biz } = await supabase.from('businesses').select('id, owner_user_id').eq('id', offer.business_id).maybeSingle();
  const isOwner = biz && biz.owner_user_id === callerUserId;
  if (!isOwner && !isPlatformOwner(req)) return json({ ok: false, error: 'Forbidden' }, { status: 403 });

  // Preview coupons (unowned rows for this offer)
  const { data: preview, error } = await supabase
    .from('user_coupons')
    .select('id, coupon_id, unique_code, user_id, is_redeemed')
    .eq('coupon_id', offerId)
    .limit(100);
  if (error) return json({ ok: false, error: error.message }, { status: 500 });

  return json({ ok: true, items: preview || [] });
})));

export const config = {
  path: '/api/business/offers/:offerId/coupons',
};


