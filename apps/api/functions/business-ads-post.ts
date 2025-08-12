import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { getUserIdFromRequest, isPlatformOwner } from '../../../packages/shared/auth';

export default async (req: Request) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  try {
    const callerUserId = getUserIdFromRequest(req);
    if (!callerUserId) return new Response(JSON.stringify({ ok: false, error: 'Unauthorized' }), { status: 401 });

    const supabase = createSupabaseClient(true) as any;

    // Resolve business by owner user id (or allow platform owner to specify via header for admin tooling)
    let businessId = '';
    const { data: biz } = await supabase
      .from('businesses')
      .select('id, owner_user_id')
      .eq('owner_user_id', callerUserId)
      .maybeSingle();
    if (biz?.id) businessId = biz.id as string;
    if (!businessId && isPlatformOwner(req)) {
      businessId = req.headers.get('x-business-id') || '';
    }
    if (!businessId) return new Response(JSON.stringify({ ok: false, error: 'Missing business context' }), { status: 400 });

    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : null;
    const imageUrl = typeof body?.image_url === 'string' ? body.image_url.trim() : null;
    const weight = Number.isFinite(Number(body?.weight)) ? Number(body.weight) : 1;
    const costPerDay = Number.isFinite(Number(body?.cost_per_day)) ? Number(body.cost_per_day) : 500;
    const startDate = body?.start_date ?? null;
    const endDate = body?.end_date ?? null;

    if (!title) return new Response(JSON.stringify({ ok: false, error: 'title is required' }), { status: 400 });

    const { error } = await supabase
      .from('ads')
      .insert({
        business_id: businessId,
        title,
        description,
        image_url: imageUrl,
        weight,
        cost_per_day: costPerDay,
        start_date: startDate,
        end_date: endDate,
      });
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Bad Request' }), { status: 400 });
  }
};

export const config = {
  path: '/api/business/ads',
};


