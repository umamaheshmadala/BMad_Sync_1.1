import { getClientIp } from './http';

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


