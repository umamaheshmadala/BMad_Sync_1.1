import { withRequestLogging } from '../../../packages/shared/logging';

export default withRequestLogging('business-signup', async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  // Scaffold: proxy to Supabase could be added; for MVP return ok
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
});

export const config = {
  path: '/api/business/signup',
};


