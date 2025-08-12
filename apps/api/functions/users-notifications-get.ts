import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';

export default async (req: Request) => {
  try {
    if (req.method !== 'GET' && req.method !== 'DELETE') return new Response('Method Not Allowed', { status: 405 });
    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    const userId = parts[3] || '';
    if (!userId) return new Response(JSON.stringify({ ok: false, error: 'Missing userId' }), { status: 400 });

    const callerId = getUserIdFromRequest(req);
    if (!callerId) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
    if (callerId !== userId && !isPlatformOwner(req)) {
      return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
    }

    const supabase = createSupabaseClient(true) as any;

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('recipient_user_id', userId);
      if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
      return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    // GET
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 50)));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
    const onlyUnread = (url.searchParams.get('unread') || '').toLowerCase() === 'true';
    let query = supabase
      .from('notifications')
      .select('id, message, notification_type, created_at, deep_link_url, read_at')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (onlyUnread) {
      query = query.is('read_at', null);
    }
    const { data, error } = await query;
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });

    return new Response(
      JSON.stringify({ ok: true, items: (data as any[]) || [] }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: e?.message || 'Unexpected error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

export const config = {
  path: '/api/users/:userId/notifications',
};


