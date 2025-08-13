import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';
import { withErrorHandling } from '../../../packages/shared/errors';
import { withRateLimit } from '../../../packages/shared/ratelimit';
import { json } from '../../../packages/shared/http';

export default withRateLimit('business-analytics-reviews-get', { limit: 120, windowMs: 60_000 }, withErrorHandling(async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const businessId = parts[3] || '';
  if (!businessId) return json({ ok: false, error: 'Missing businessId' }, { status: 400 });

  // Access control: owner of the business or platform owner
  const callerId = getUserIdFromRequest(req);
  const supabase = createSupabaseClient(true) as any;
  const biz = await supabase.from('businesses').select('owner_user_id').eq('id', businessId).maybeSingle();
  if (biz?.error) return json({ ok: false, error: biz.error.message }, { status: 500 });
  const ownerId = biz?.data?.owner_user_id as string | undefined;
  if (!(isPlatformOwner(req) || (callerId && ownerId && callerId === ownerId))) {
    return json({ ok: false, error: 'Forbidden' }, { status: 403 });
  }
  const { data, error } = await supabase
    .from('business_reviews')
    .select('recommend_status')
    .eq('business_id', businessId);
  if (error) return json({ ok: false, error: error.message }, { status: 500 });

  let recommend = 0;
  let notRecommend = 0;
  for (const r of (data as any[]) || []) {
    if (r.recommend_status) recommend++; else notRecommend++;
  }

  return json({ ok: true, summary: { recommend, not_recommend: notRecommend } }, {
    headers: {
      'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
      'Netlify-CDN-Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=120',
    },
  });
}));

export const config = {
  path: '/api/business/:businessId/analytics/reviews',
};
