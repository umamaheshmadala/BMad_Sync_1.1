import { readPlatformConfig } from '../../../packages/shared/config';

export default async () => {
  const cfg = await readPlatformConfig();
  return new Response(JSON.stringify(cfg), { headers: { 'Content-Type': 'application/json' } });
};

export const config = {
  path: '/api/platform/config',
};
