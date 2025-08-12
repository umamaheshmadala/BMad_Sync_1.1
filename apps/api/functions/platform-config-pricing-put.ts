import { createSupabaseClient } from '../../../packages/shared/supabaseClient';
import { isPlatformOwner } from '../../../packages/shared/auth';
import { withRequestLogging } from '../../../packages/shared/logging';

export default withRequestLogging('platform-config-pricing-put', async (req: Request) => {
  if (req.method !== 'PUT') return new Response('Method Not Allowed', { status: 405 });
  if (!isPlatformOwner(req)) return new Response(JSON.stringify({ ok: false, error: 'Forbidden' }), { status: 403 });
  try {
    const body = await req.json();
    const pricing = typeof body === 'object' && body ? body : {};
    const supabase = createSupabaseClient(true) as any;
    const { error } = await supabase
      .from('platform_config')
      .upsert({ key_name: 'pricing.table', config_value: pricing }, { onConflict: 'key_name' } as any);
    if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || 'Bad Request' }), { status: 400 });
  }
});

export const config = {
  path: '/api/platform/config/pricing',
};


