## v0.1.5

Highlights
- Notifications E2E: persist on wishlist matches; list, mark-all-read, mark item read, clear
- Unified route: GET/DELETE on `/api/users/:userId/notifications`
- Unread fix: use `.is('read_at', null)`; schema adds `read_at`
- Netlify: publish `apps/web-react/dist`; SPA fallback scoped to `/react/*`
- UI: better empty/error states; label v0.1.5
- Tests: mock supabase supports `.is()`; 21/21 green

URLs
- UI: https://tiny-bombolone-8f8acf.netlify.app/react
- Seed: POST https://tiny-bombolone-8f8acf.netlify.app/api/tests/seed


