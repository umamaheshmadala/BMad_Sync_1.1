import { writePlatformConfig } from '../../../packages/shared/config';

export default async (req: Request) => {
  if (req.method !== 'PUT') return new Response('Method Not Allowed', { status: 405 });
  try {
    const body = await req.json();
    await writePlatformConfig(body);
    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'Bad Request' }), { status: 400 });
  }
};

export const config = {
  path: '/api/platform/config/runtime',
};
