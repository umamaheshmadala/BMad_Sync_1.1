import { createSupabaseClient } from '../../../packages/shared/supabaseClient';

export default async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const businessId = parts[3] || '';
  if (!businessId) return new Response(JSON.stringify({ ok: false, error: 'Missing businessId' }), { status: 400 });

  const supabase = createSupabaseClient(true);
  const { data, error } = await supabase
    .from('business_reviews')
    .select('recommend_status')
    .eq('business_id', businessId);
  if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });

  let recommend = 0;
  let notRecommend = 0;
  for (const r of (data as any[]) || []) {
    if (r.recommend_status) recommend++; else notRecommend++;
  }

  return new Response(
    JSON.stringify({ ok: true, summary: { recommend, not_recommend: notRecommend } }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

export const config = {
  path: '/api/business/:businessId/analytics/reviews',
};
