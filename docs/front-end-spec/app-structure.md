# App Structure
- Layouts: `RootLayout` (shell), `DashboardLayout` (auth-guarded)
- Routing (example):
  - `/` Landing (minimal)
  - `/auth/login`, `/auth/signup`, `/auth/reset`
  - `/onboarding/city-interests` (first login only; skip if interests exist)
  - `/dashboard` (user default after login)
  - `/dashboard/wallet`
  - `/dashboard/wishlist`
  - `/dashboard/favorites`
  - `/dashboard/friends`
  - `/business/:businessId` (storefront)
  - `/business/portal` (business dashboard)
  - `/owner` (platform owner dashboard)
  - `/search` (discovery)
