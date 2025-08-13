import { json } from './http';

export class HttpError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export type RequestHandler = (req: Request) => Promise<Response> | Response;

export function withErrorHandling(handler: RequestHandler): RequestHandler {
  return async (req: Request) => {
    try {
      return await handler(req);
    } catch (e: any) {
      if (e instanceof HttpError) {
        return json({ ok: false, error: e.message, code: e.code }, { status: e.status });
      }
      return json({ ok: false, error: e?.message || 'Unexpected error' }, { status: 500 });
    }
  };
}


