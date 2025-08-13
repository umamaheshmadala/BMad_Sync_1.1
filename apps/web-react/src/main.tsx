import React from 'react';
import * as Sentry from '@sentry/react';
import { createRoot } from 'react-dom/client';
import App from './ui/App';
// Sentry init (no-op if DSN not provided)
try {
  // @ts-ignore
  const dsn = (import.meta as any)?.env?.VITE_SENTRY_DSN || '';
  if (dsn) {
    Sentry.init({
      dsn,
      tracesSampleRate: 0.0,
      replaysSessionSampleRate: 0.0,
      replaysOnErrorSampleRate: 0.0,
      beforeSend(event) {
        try {
          const reqId = (window as any)?.lastMeta?.x_request_id;
          if (reqId) {
            // @ts-ignore
            event.tags = { ...(event.tags || {}), 'x-request-id': reqId };
          }
        } catch {}
        // Remove potentially sensitive data
        if (event.request) {
          delete (event.request as any).cookies;
          delete (event.request as any).headers;
          delete (event.request as any).data;
        }
        return event;
      },
    });
  }
} catch {}
import './index.css';

const container = document.getElementById('root')!;
createRoot(container).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


