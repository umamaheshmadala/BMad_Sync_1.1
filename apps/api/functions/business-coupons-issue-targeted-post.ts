import { withRequestLogging } from '../../../packages/shared/logging';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';
import { IssueTargetedPayloadSchema } from '../../../packages/shared/validation';

export default withRequestLogging('business-coupons-issue-targeted-post', withRateLimit('business-coupons-issue-targeted-post', { limit: 30, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const callerId = getUserIdFromRequest(req);
  if (!callerId) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

  // Placeholder parsing of targeting parameters
  const body = await req.json().catch(() => ({}));
  const parsed = IssueTargetedPayloadSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: 'Invalid payload', details: parsed.error.flatten() }, { status: 400 });
  const { coupon_id: offerCouponId, target_parameters: targetParameters = {} } = parsed.data as any;

  // MVP: issue one coupon per followed user if coupon_id provided
  const supabase = createSupabaseClient(true) as any;
  let issued = 0;
  if (offerCouponId) {
    // Find followers of any business for simplicity (could filter by biz later)
    const { data: follows } = await supabase.from('business_follows').select('user_id');
    for (const f of (follows as any[]) || []) {
      const userId = String(f.user_id);
      const unique_code = `UC-${offerCouponId}-${Date.now()}-${issued}`;
      const { error } = await supabase
        .from('user_coupons')
        .insert({ coupon_id: offerCouponId, user_id: userId, unique_code, current_owner_id: userId });
      if (!error) issued += 1;
    }
  }
  return json({ ok: true, issued_count: issued, target_parameters: targetParameters });
})));

export const config = {
  path: '/api/business/coupons/issue-targeted',
};


