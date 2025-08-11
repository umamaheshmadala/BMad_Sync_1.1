import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';

export default async (req: Request) => {
  const url = new URL(req.url);
  const parts = url.pathname.split('/');
  const storefrontId = parts[3] || '';
  if (!storefrontId) return new Response(JSON.stringify({ ok: false, error: 'Missing storefrontId' }), { status: 400 });

  const callerId = getUserIdFromRequest(req);
  if (!callerId) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

  const supabase = createSupabaseClient(true) as any;

  // Optional: verify caller owns the business for this storefront (best-effort, RLS also enforces)
  const { data: sf } = await supabase.from('storefronts').select('id,business_id').eq('id', storefrontId).maybeSingle();
  if (!sf) return new Response(JSON.stringify({ ok: false, error: 'Storefront not found' }), { status: 404 });
  const { data: biz } = await supabase
    .from('businesses')
    .select('id,owner_user_id')
    .eq('id', sf.business_id)
    .maybeSingle();
  const isOwner = biz && biz.owner_user_id === callerId;
  if (!isOwner && !isPlatformOwner(req)) {
    return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('storefront_products')
      .select('*')
      .eq('storefront_id', storefrontId);
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ ok: true, items: data || [] }), { headers: { 'Content-Type': 'application/json' } });
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const body = await req.json();
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) {
      return new Response(JSON.stringify({ ok: false, error: 'No items provided' }), { status: 400 });
    }

    const rows = items.map((p: any) => ({
      storefront_id: storefrontId,
      product_name: String(p.product_name || ''),
      product_description: p.product_description ?? null,
      product_image_url: p.product_image_url ?? null,
      category: p.category ?? null,
      subcategory_l1: p.subcategory_l1 ?? null,
      subcategory_l2: p.subcategory_l2 ?? null,
      display_order: typeof p.display_order === 'number' ? p.display_order : null,
      is_trending: !!p.is_trending,
      suggested: !!p.suggested,
    }));

    const { error } = await supabase.from('storefront_products').insert(rows);
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ ok: true, count: rows.length }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Bad Request' }), { status: 400 });
  }
};

export const config = {
  path: '/api/storefronts/:storefrontId/products',
};


