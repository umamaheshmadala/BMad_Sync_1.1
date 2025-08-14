# Summary
- Monorepo: `apps/web` (React/Vite), `apps/api` (Netlify/Supabase Edge Functions), `packages/shared` (types/utils)
- Core services: Supabase (Postgres, Auth, Storage, Realtime); Netlify functions for custom APIs/cron
- Realtime: Supabase Realtime channels; future queue for scale bursts
- Notifications: In-app (phase 1); Web Push via service worker (phase 2)
