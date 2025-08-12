import { withRequestLogging } from '../../../packages/shared/logging';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';

export default withRequestLogging('users-favorites-business-post', async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  if (!userId) return new Response(JSON.stringify({ ok: false, error: 'Missing userId' }), { status: 400 });

  const callerId = getUserIdFromRequest(req);
  if (!callerId) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  if (callerId !== userId && !isPlatformOwner(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const businessId = (body && body.business_id) ? String(body.business_id) : '';
  if (!businessId) return new Response(JSON.stringify({ ok: false, error: 'Missing business_id' }), { status: 400 });

  // Scaffold: return accepted; persistence to be implemented with DB table `favorite_businesses`
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
});

export const config = {
  path: '/api/users/:userId/favorites/business',
};


