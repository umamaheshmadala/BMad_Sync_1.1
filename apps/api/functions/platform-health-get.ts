import { isFeatureEnabled } from '../../../packages/shared/env';

export default async () => {
  const payload = {
    ok: true,
    version: '0.1.8',
    time: new Date().toISOString(),
    features: {
      FEATURE_SUPABASE_AUTH: isFeatureEnabled('FEATURE_SUPABASE_AUTH'),
      FEATURE_DEV_AUTH: isFeatureEnabled('FEATURE_DEV_AUTH'),
      FEATURE_SHARED_RATELIMIT: isFeatureEnabled('FEATURE_SHARED_RATELIMIT'),
    },
  };
  return new Response(JSON.stringify(payload), { headers: { 'Content-Type': 'application/json' } });
};

export const config = {
  path: '/api/platform/health',
};


