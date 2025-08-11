# SynC — Product Requirements Document (PRD)

Version: 1.0  
Date: 2025-08-11  
Owner: Platform Owner / PM  
Status: Draft

## 1. Overview
SynC is a full‑stack web application connecting consumers with Hyperlocal businesses through discovery, social interactions, and a gamified coupon ecosystem. It addresses the retail gap of instant customer reach during non‑shopping times by providing a single channel for business updates and digital coupon management, while offering businesses targeted, cost‑effective customer acquisition and retention.

This PRD is generated from the Project Brief (`docs/project-brief.md`) and integrated market research provided by the stakeholder.

## 2. Problem & Solution
- Problem: Physical stores struggle to instantly update and stay connected with customers outside shopping moments, reducing footfall compared to e‑commerce which excels at instant offers/notifications.
- Solution: A unified platform for discovery, engagement, and rewards, with social features and gamified coupon sharing, digital storefronts, targeted promotions, analytics, and a “Driver” program to stimulate organic growth and retention.

## 3. Goals and Success Metrics
### 3.1 Business Objectives
- Increase engagement with Hyperlocal stores; reduce window shopping
- Broaden reach via bullseye marketing; minimize CAC; increase CLTV
- Monetize via coupon generation, promotional banners, push notifications, and search ads
- Reduce marketing dependency on influencers/cold marketing; reduce spam reviews

### 3.2 KPIs (with baselines and targets)
- CAC: Target ₹400–600 per acquisition (30–50% lower than typical baselines)
- Footfall: +15–25% within 6 months for participating businesses
- Retention: Users 75%, Businesses 80%
- Short‑term (3–6 mo): 1,000 active users (2–3 cities), 50 businesses; DAU 15%, MAU 60%
- Medium‑term (6–12 mo): 5,000 users (5 cities), 200 businesses; ₹24k/month baseline coupon revenue (₹2 × 1,000)
- Long‑term (12–24 mo): 10k+ users, 500+ businesses, 10+ cities, sustainable CAC < ₹500

## 4. In Scope / Out of Scope (MVP)
### 4.1 MVP Scope (Must‑have)
- Consumers: Supabase Auth; profile; dashboard (nav/search/city/avatar/notifications/wishlist/ads/coupon wallet/contacts sidebar); wishlist; favorites; feedback (recommend/don’t); responsive web (React, Vite, Tailwind)
- Social: Find friends; friend requests accept/decline; activity feed; coupon share/accept/decline/discard with lifecycle tracking and daily caps
- Coupons: Discovery and in‑store redemption; wallet updates; trending offers and savings advisor (P2 important)
- Businesses: Supabase Auth; onboarding (category/subcategory/target areas/demographics/avg ticket seasons); storefronts (branding, location, offers, contact, trending products suggestions); business dashboard (offers, analytics, recommendations, identify “Drivers”)
- Platform Owner: Dashboard; revenue tracking (coupon generation, banners, push notifications, search ads)
- Billing: Dummy mode for MVP (no live Razorpay). Billing UI present; payments disabled until activation flag is set by owner.

### 4.2 Out of Scope for MVP (Deferred)
- In‑app chat in contacts sidebar; public coupon sharing (phase 2)
- AI agent features for wishlist events; video‑rich storefronts; user‑initiated events hosting
- Star ratings (use recommend/don’t); manual check‑ins (prefer GPS or coupon redemption triggered)
- KYC; mandatory mobile/WhatsApp OTP; multi‑city per user/business; detailed multi‑tier pricing

## 5. Users and Personas
- Consumers: Deal seekers wanting relevant updates, easy couponing, and social engagement
- Hyperlocal Business Owners: Want instant reach/updates, low‑cost targeted marketing, and retention
- Platform Owner: Manages visibility, quality, pricing, and revenue streams

## 6. Assumptions and Constraints
- Web‑first, responsive design; Indian Tier 1/2/3 cities list during onboarding and dashboard
- If user already chose interests previously, successful login redirects directly to dashboard
- Local dev opens in Chrome Incognito by default to avoid caching during testing
- Monorepo structure; serverless backend; Supabase (DB/Auth/Storage/Realtime)
- Testability: Each story must include unit, integration, and critical E2E tests; provide deterministic seeds and mockable services (billing, notifications).

## 7. Detailed Requirements
### 7.1 Functional Requirements (FR)
Priority legend: P1 = Core MVP, P2 = Important (post‑MVP within near term)

1. FR1 (P1): User sign up/login/logout via Supabase Auth
2. FR2 (P1): User profile management: name, preferred name, avatar, contact info
3. FR3 (P1): Display user online/offline social presence
4. FR4 (P1): User dashboard with nav/search/city selection (defaults to sign‑up city), avatar, profile dropdown, notifications, wishlist, promotional ads, coupon wallet, contacts sidebar
5. FR5 (P2): Find friends by name/contact/email
6. FR6 (P2): Friend system: requests, accept/decline, most‑interacted favorites
7. FR7 (P2): Activity feed: check‑ins (GPS or coupon redemption), coupon redemptions, social actions
8. FR8 (P2): Notifications for friend requests, offer updates, friends’ activity
9. FR9 (P2): Share/accept/discard coupons with caps (3 per friend/day) [Dep: FR5, FR6]
10. FR10 (P1): Digital coupon wallet
11. FR11 (P1): Coupon discovery and in‑store redemption
12. FR12 (P1): Wallet updates: expiry, friend shares
13. FR13 (P2): Hot coupon offers and savings advisor
14. FR14 (P1): Wishlist (manual input)
15. FR15 (P2): Favorite businesses
16. FR16 (P2): Favorite coupons
17. FR17 (P2): Feedback: recommend/don’t recommend
18. FR18 (P2): Brief review up to 30 words (needs FR42, FR43)
19. FR19 (P1): Responsive web (React, Vite, Tailwind)
20. FR20 (P1): Business Auth via Supabase
21. FR21 (P1): Business profile management: name, address, Google location, contact, open/close, holidays, logo
22. FR22 (P1): Business online/offline (Open/Close) presence
23. FR23 (P1): Business model fields: category, subcategory, target areas, demographics, average ticket, seasons
24. FR24 (P1): Business profile pages (digital storefronts)
25. FR25 (P1): Top trending products list on storefronts, with suggestions; replaced items stored for future use
26. FR26 (P2): Show available coupons to storefront visitors
27. FR27 (P2): Show trending offers on storefronts
28. FR28 (P1): Business dashboard for profile/offers/analytics
29. FR29 (P1): Businesses view customer engagement and feedback
30. FR30 (P2): Identify/analyze “Drivers” (top contributors) [Dep: FR59]
31. FR31 (P1): Platform Owner dashboard holistic view
32. FR32 (P1): Revenue from coupon generation (₹2/coupon)
33. FR33 (P1): Revenue from promotional banners (₹500/banner/day)
34. FR34 (P1): Revenue from push notifications
35. FR35 (P1): Revenue from search result first place (₹500/day)
36. FR36 (P2): Users choose interests (focused updates)
37. FR37 (P2): Users update interests anytime
38. FR38 (P2): Enforce minimum five interests at first login
39. FR39 (P2): Follow businesses for instant updates
40. FR40 (P2): From wishlist item, jump to relevant businesses [Dep: FR14, FR25]
41. FR41 (P1): Use digital coupons at physical stores
42. FR42 (P1): Only GPS‑based and redemption‑triggered check‑ins (prevent fake reviews)
43. FR43 (P1): Auto check‑in on redemption
44. FR44 (P2): Businesses publish offers, share coupons/promotions by demographics
45. FR45 (P2): Businesses update utilized coupons
46. FR46 (P2): Businesses issue coupons to selected demographics [Dep: FR23]
47. FR47 (P2): Businesses send notifications to customers
48. FR48 (P2): Businesses show ads in the app (costed)
49. FR49 (P2): Coupon generation with T&Cs and cost; distribution customization [Dep: FR32]
50. FR50 (P2): Feedback collected only as recommend/don’t recommend
51. FR51 (P2): Sender sees who redeemed shared coupon if a direct friend [Dep: FR9]
52. FR52 (P2): Notify original receiver if n‑th connection redeems a shared coupon [Dep: FR9]
53. FR53 (P2): Track coupon performance end‑to‑end [Dep: FR11, FR45]
54. FR54 (P2): New unique identity when coupon shared; original nullified; lineage retained [Dep: FR9]
55. FR55 (P2): Businesses may boost a live coupon/offer; cannot cancel/pause/expire (except force majeure)
56. FR56 (P2): Follow business without direct notifications; enable/disable notifications
57. FR57 (P2): Real‑time notifications with deep links; max 20‑word messages
58. FR58 (P2): Track views/clicks/impressions/engagement for ads, offers, storefront visits, top products
59. FR59 (P2): Identify “Drivers” via equal weighting of activities
60. FR60 (P2): Display “shining gold ring” avatar for Drivers
61. FR61 (P2): Businesses can target Drivers
62. FR62 (P2): Unique coupon code derived from business ID and receiver ID; track journey [Dep: FR49]
63. FR63 (P2): Single‑use coupon enforcement [Dep: FR11]
64. FR64 (P1): Auth methods: Email/password, Mobile/OTP, and social login (OAuth)
65. FR65 (P1): Password reset and email verification
66. FR66 (P1): Platform Owner can change business visibility or block spam
67. FR67 (P1): Platform Owner dashboard includes advanced revenue tracing
68. FR68 (P2): Store replaced trending products as backup
69. FR69 (P1): Billing dummy mode toggle (owner) that disables payment capture and enables sandbox receipts.

### 7.2 Non‑Functional Requirements (NFR)
1. NFR1: Main screens load < 2 seconds
2. NFR2: Real‑time updates for social and business activity
3. NFR3: Secure authentication using Supabase
4. NFR4: Data privacy and compliance posture (GDPR/CCPA placeholder)
5. NFR5: Backend supports 10,000+ concurrent users
6. NFR6: Modular backend (Supabase, serverless functions)
7. NFR7: 99.9% uptime
8. NFR8: Automated backups and disaster recovery
9. NFR9: Consistent UI color scheme (see `constants/Colors.ts`)
10. NFR10: Modern, visually appealing UI; WCAG 2.1 AA aspirational
11. NFR11: Notification throttling/grouping best practices; owner can adjust dynamically
12. NFR12: Business account recovery with verification and 2FA per best practices
13. NFR13: Resource utilization thresholds (CPU < 70%, memory < 80%)
14. NFR14: Security testing: SAST, DAST, vulnerability scans, and pen‑test before major releases
15. NFR15: Fault tolerance: retries with backoff, circuit breakers, graceful degradation
16. NFR16: Observability: structured logging, centralized monitoring/alerting; planned maintenance windows
17. NFR17: Testability: deterministic seeds and isolated mocks; E2E flake budget < 1%; CI time < 10 min.

## 8. UX and UI
### 8.1 Design Goals
- Modern, user‑friendly, engaging; single‑window to explore businesses, social interactions, and coupon flows
- Real‑time activity emphasis; interest‑driven personalization

### 8.2 Core Screens
- User Dashboard; Business Storefronts; Coupon Wallet; Friend Profiles & Activity Feed; Wishlist & Favorites; Feedback/Reviews; User Profile; Business Profile; Platform Owner Dashboard; Auth

### 8.3 Accessibility & Branding
- Visual appeal prioritized; WCAG 2.1 AA aspirational
- Theme: dark, neon‑accent aesthetic inspired by provided reference image (cosmic‑night vibe). Lock theme early for comps.
- Consistent color scheme (see `constants/Colors.ts`) derived from reference image: deep charcoal backgrounds, purple/indigo gradients, soft glows; Shadcn components.

### 8.4 Interests and Cities
- Present Indian Tier 1/2/3 cities during onboarding and dashboard
- Interest categories (initial list): Active Life; Arts & Entertainment; Automotive; Beauty & Spas; Education; Event Planning & Services; Financial Services; Food; Health & Medical; Home Services; Hotels & Travel; Local Flavor; Local Services; Mass Media; Nightlife; Pets; Professional Services; Public Services & Government; Real Estate; Religious Organizations; Restaurants; Shopping

## 9. Analytics and Monetization
- Business analytics: weekly summaries of reviews, coupon utilization, peer trends, marketing effectiveness; recommendations
- Targeted coupon issuance to demographics, interests, location, past behavior, Driver status; group‑based targeting (no individual Driver identity exposure)
- Monetization and Billing:
  - Rates (seed): ₹2/coupon; ₹500/day promotional banner; ₹500/day search first place; push notifications costed
  - Processor: Razorpay (postpaid monthly). If cumulative charges > ₹20,000 before cycle end, immediate payment required; further services frozen until cleared. Show available credit to businesses.

## 10. Risks and Technical Notes
- Realtime scalability with websockets/pub‑sub and queues (Supabase Realtime or adjunct)
- Gamification scoring and dynamic weights for “Driver” status
- Taxonomy and categorization accuracy; potential ML/AI post‑MVP
- Coupon lifecycle integrity and anti‑fraud; transactional consistency

## 11. Story Outcomes Map (What becomes visible after each story)
This section summarizes user‑visible outcomes so non‑coders can verify progress.

- Story 1.1 (Repo & Setup): Monorepo created with `apps/web`, `apps/api`, `packages/shared`; home page loads; README with setup steps
- Story 1.2 (User Auth): Login/Sign‑up pages; can create account and access an authenticated placeholder dashboard
- Story 1.3 (User Profile): Profile form and view; avatar upload; data persists in Supabase
- Story 1.4 (Business Auth): Business login/sign‑up; access to business dashboard shell
- Story 1.5 (Business Profile): Business profile form; storefront placeholder visible with profile basics
- Story 2.1 (Storefront MGMT): Storefront editor; open/close toggle; banner upload; theme selection
- Story 2.2 (Products Display): Products grid on storefront (4–10 items); suggestions badge for trending picks
- Story 2.3 (City & Interests): On first login select city + 5+ interests; profile settings page updates these later
- Story 2.4 (Dashboard Personalization): Dashboard shows hot offers/trending and targeted ads; city selector; ad preferences
- Story 2.5 (Favorites): Favorites sections on dashboard/wallet; toggle to add/remove
- Story 2.6 (Wishlist): Add items; auto‑categorized; click item to navigate to search with relevant businesses
- Story 3.1 (Offers/Coupons): Business can create offers/coupons; coupons visible on storefront; billing model prepared
- Story 3.2 (Coupon Collection): Users add coupons to wallet; wallet shows collected items
- Story 3.3 (Social Presence & Find Friends): Online status and search by name/contact/email
- Story 3.4 (Friend Requests & Feed): Accept/decline/block; basic feed showing social events
- Story 3.5 (Coupon Sharing): Share coupon to friend (cap rules); receiver accepts/declines; notifications and ownership transfer; cancel pending share
- Story 3.6 (Redemption & Auto Check‑in): Redeem with unique code; auto check‑in; redirect to storefront; option to review
- Story 3.7 (GPS Check‑in): GPS proximity based check‑in, enabling reviews
- Story 3.8 (Driver Status): Driver badge visible on profile for top 10% in city
- Story 4.1–4.2 (Analytics): Business analytics dashboard with summaries and trends; recommendations list
- Story 4.3–4.4 (Targeting & Ads): Targeted issuance UI; ads management; banners appear in user dashboard
- Story 4.5–4.6 (Owner & Pricing): Owner dashboard revenue tracing; pricing configuration panel; business visibility controls
- Story 5.1–5.6 (Feedback & Notifications): Review form (recommend/don’t, 30 words); real‑time notifications; preferences and throttling; wishlist‑offer match notifications

## 12. Data Model and APIs (Planning Snapshot)
- Supabase DB (initial entities): Users, Businesses, Storefronts, StorefrontProducts, BusinessFollows, Friends, UserCoupons, Coupons, CouponShares, UserActivities, BusinessReviews, Notifications, Ads, Promotions, PlatformConfig, RevenueTracking, WishlistItems, WishlistMatches
- Auth: Supabase Auth for Users and Businesses (distinct roles)
- APIs: REST or serverless endpoints (Netlify functions / Supabase Edge Functions) documented via OpenAPI; E2E tests for critical flows
- ADRs: Record decisions for technology choices, real‑time architecture, and monetization models

## 13. Acceptance & Validation
- Each story includes acceptance criteria (see Epic sections in Appendix A)
- “Local Testability” endpoints and queries are defined to allow developers to verify with curl/Postman and SQL checks

## 14. Open Decisions
1) Component add‑ons list (reactbits etc.)
2) Publish v1 JSONs for Indian Tier1/2/3 cities and 23 interest categories (frozen)
3) Realtime scale guardrails and queue thresholds
4) Driver scoring: owner‑controlled recalculation (ad‑hoc/scheduled); start with equal weights; weights configurable
5) Marketing policy for boosting vs. pausing/canceling offers (force majeure handling)

## 15. Appendix A — Epics and Key Stories
- Epic 1: Foundational Platform & Core User/Business Onboarding — Stories 1.1–1.5 (full acceptance criteria as provided by stakeholder)
- Epic 2: Digital Storefronts & Basic Discovery — Stories 2.1–2.6
- Epic 3: Gamified Coupon Lifecycle & Social Sharing — Stories 3.1–3.8
- Epic 4: Analytics, Targeted Marketing & Platform Monetization — Stories 4.1–4.6
- Epic 5: Enhanced Engagement & Notification System — Stories 5.1–5.6

Note: Detailed story acceptance criteria and local testability instructions mirror the stakeholder’s provided descriptions and should be sharded for IDE workflows as needed.

## 16. Appendix B — Market Research Summary
Integrated into brief and PRD: qualitative interviews/focus groups; observational shop‑along; intercept and online surveys; competitive analyses; sampling/triangulation; limitations noted for proprietary datasets.

## 17. Change Log
- 2025‑07‑18 v1.0 — Initial PRD creation (from sessions)
- 2025‑07‑18 v1.1 — Expanded Goals and Background Context
- 2025‑07‑22 v1.2 — Incorporated final clarifications
- 2025‑08‑11 v1.3 — Consolidated PRD generated from current brief; prepared for sharding

---
Next: UX Expert to produce Front‑End Specification (`docs/front-end-spec.md`) from this PRD; Architect to produce Full‑Stack Architecture (`docs/fullstack-architecture.md`); PO to run validation checklist and shard documents for IDE development.
