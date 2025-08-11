import { createSupabaseClient } from '../../../packages/shared/supabaseClient';

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const userId = parts[3] || '';
  try {
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
};

export const config = {
  path: '/api/users/:userId/wishlist',
};
