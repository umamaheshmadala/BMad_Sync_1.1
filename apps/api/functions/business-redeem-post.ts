import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner, getUserIdFromRequest, getUserIdFromRequestAsync } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { RedeemPayloadSchema } from '../../../packages/shared/validation';

export default withRequestLogging('business-redeem-post', withRateLimit('business-redeem-post', { limit: 120, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const businessId = parts[3] || '';
  try {
    const callerId = await getUserIdFromRequestAsync(req);
    if (!callerId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const parsed = RedeemPayloadSchema.safeParse(body);
    if (!parsed.success || !businessId) {
      return json({ ok: false, error: 'Invalid payload', details: parsed.error?.flatten?.() }, { status: 400 });
    }
    const { unique_code } = parsed.data as any;
    const supabase = createSupabaseClient(true);
    const { data: uc, error: ucErr } = await supabase
      .from('user_coupons')
      .select('id, coupon_id, is_redeemed')
      .eq('unique_code', unique_code)
      .maybeSingle();
    if (ucErr || !uc) return json({ ok: false, error: 'Coupon not found' }, { status: 404 });
    if (uc.is_redeemed) return json({ ok: false, error: 'Already redeemed' }, { status: 409 });

    const { data: coupon, error: cErr } = await supabase
      .from('coupons')
      .select('business_id')
      .eq('id', uc.coupon_id)
      .single();
    if (cErr || !coupon || coupon.business_id !== businessId)
      return json({ ok: false, error: 'Business mismatch' }, { status: 403 });

    const { error: upd } = await supabase
      .from('user_coupons')
      .update({ is_redeemed: true, redeemed_at: new Date().toISOString() })
      .eq('id', uc.id);
    if (upd) return json({ ok: false, error: upd.message }, { status: 500 });

    return json({ ok: true });
  } catch (e: any) {
    return json({ ok: false, error: e?.message || 'Bad Request' }, { status: 400 });
  }
})));

export const config = {
  path: '/api/business/:businessId/redeem',
};
