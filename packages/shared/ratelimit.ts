import { getClientIp } from './http';
import { createSupabaseClient } from './supabaseClient';
import { isFeatureEnabled } from './env';

export type RateLimitOptions = {
	limit: number; // max requests per window
	windowMs: number; // window size in milliseconds
};

type Counter = { count: number; resetAt: number };
const counters: Map<string, Counter> = new Map();

export function withRateLimit(name: string, opts: RateLimitOptions, handler: (req: Request) => Promise<Response> | Response) {
	const { limit, windowMs } = opts;
	return async (req: Request) => {
		const ip = getClientIp(req);
		const key = `${name}:${ip}`;
		const now = Date.now();
    if (isFeatureEnabled('FEATURE_SHARED_RATELIMIT')) {
      const res = await incrementSharedCounter(key, limit, windowMs, now);
      if (res.blocked) {
        return rateLimitExceededResponse(limit, res.resetAt, now);
      }
      const resp = await handler(req);
      return attachRateHeaders(resp, limit, res.remaining, res.resetAt);
    }
    let entry = counters.get(key);
    if (!entry || now >= entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      counters.set(key, entry);
    }
    entry.count += 1;
    const remaining = Math.max(0, limit - entry.count);
    if (entry.count > limit) {
			const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000);
      return new Response(
        JSON.stringify({ ok: false, error: 'Rate limit exceeded' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'RateLimit-Limit': String(limit),
            'RateLimit-Remaining': String(0),
            'RateLimit-Reset': String(Math.ceil(entry.resetAt / 1000)),
            'Retry-After': String(retryAfterSec),
          },
        }
      );
		}
    const res = await handler(req);
    const headers = new Headers(res.headers);
    headers.set('RateLimit-Limit', String(limit));
    headers.set('RateLimit-Remaining', String(remaining));
    headers.set('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
    // Preserve Response body correctly
    const body = await (res as any).text?.() ?? undefined;
    return new Response(body, { status: res.status, headers });
	};
}

type SharedResult = { remaining: number; resetAt: number; blocked: boolean };

async function incrementSharedCounter(key: string, limit: number, windowMs: number, now: number): Promise<SharedResult> {
  const supabase = createSupabaseClient(true) as any;
  const windowStartSec = Math.floor(now / 1000);
  const resetAt = now + windowMs;
  // Use a table `rate_limits` with columns: key text PK, window_start int, count int
  // Upsert increment by 1, resetting window if older than windowMs
  const { data: existing } = await supabase
    .from('rate_limits')
    .select('key, window_start, count')
    .eq('key', key)
    .maybeSingle();
  let newCount = 1;
  let newWindowStart = windowStartSec;
  if (existing && typeof existing.window_start === 'number' && (windowStartSec - existing.window_start) * 1000 < windowMs) {
    newCount = (existing.count || 0) + 1;
    newWindowStart = existing.window_start;
  }
  const upsertPayload = { key, window_start: newWindowStart, count: newCount };
  await supabase.from('rate_limits').upsert(upsertPayload, { onConflict: 'key' });
  const remaining = Math.max(0, limit - newCount);
  const blocked = newCount > limit;
  return { remaining, resetAt, blocked };
}

function attachRateHeaders(res: Response, limit: number, remaining: number, resetAtMs: number): Response {
  const headers = new Headers(res.headers);
  headers.set('RateLimit-Limit', String(limit));
  headers.set('RateLimit-Remaining', String(remaining));
  headers.set('RateLimit-Reset', String(Math.ceil(resetAtMs / 1000)));
  const body = (res as any).text ? undefined : undefined;
  return new Response((res as any).body, { status: res.status, headers });
}

function rateLimitExceededResponse(limit: number, resetAtMs: number, now: number): Response {
  const retryAfterSec = Math.ceil((resetAtMs - now) / 1000);
  return new Response(
    JSON.stringify({ ok: false, error: 'Rate limit exceeded' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'RateLimit-Limit': String(limit),
        'RateLimit-Remaining': String(0),
        'RateLimit-Reset': String(Math.ceil(resetAtMs / 1000)),
        'Retry-After': String(retryAfterSec),
      },
    }
  );
}


