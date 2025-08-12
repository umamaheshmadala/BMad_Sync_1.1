import { withRequestLogging } from '../../../packages/shared/logging';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';

export default withRequestLogging('users-dashboard-get', async (req: Request) => {
  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  if (!userId) return new Response(JSON.stringify({ ok: false, error: 'Missing userId' }), { status: 400 });

  const callerId = getUserIdFromRequest(req);
  if (!callerId) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
  if (callerId !== userId && !isPlatformOwner(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
  }

  // Placeholder scaffold data; wire to real aggregates later
  const payload = {
    ok: true,
    widgets: {
      wishlist_matches_count: 0,
      unread_notifications: 0,
      recent_activity: [],
    },
  };
  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
});

export const config = {
  path: '/api/users/:userId/dashboard',
};


