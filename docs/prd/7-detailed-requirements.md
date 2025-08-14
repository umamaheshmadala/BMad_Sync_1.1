# 7. Detailed Requirements
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
