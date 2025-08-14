# Security & Access
- Auth: Supabase Auth (role-based UI)
- RLS: Per-table policies (owner can read/write own rows; public read where appropriate; admin/service role for elevated ops)
- Secrets: Env vars in Netlify/Supabase; no secrets in repo
