import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, getUserIdFromRequestAsync, isPlatformOwner, isPlatformOwnerAsync } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';

export default withRequestLogging('users-wishlist-post', async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  try {
    const callerId = await getUserIdFromRequestAsync(req);
    if (!callerId) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });
    if (callerId !== userId && !(await isPlatformOwnerAsync(req))) {
      return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
    }
    const body = await req.json();
    const { item_name, item_description } = body || {};
    if (!userId || typeof item_name !== 'string') {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid payload' }), { status: 400 });
    }
    // naive categorization placeholder
    const category = 'Shopping';
    const subcategory_l1 = 'General';
    const subcategory_l2 = 'Unspecified';

    const supabase = createSupabaseClient(true);
    const { error } = await supabase.from('wishlist_items').insert({
      user_id: userId,
      item_name,
      item_description,
      category,
      subcategory_l1,
      subcategory_l2,
    });
    if (error) {
      return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ ok: true, userId, item_name, item_description, category, subcategory_l1, subcategory_l2 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Bad Request' }), { status: 400 });
  }
});

export const config = {
  path: '/api/users/:userId/wishlist',
};
