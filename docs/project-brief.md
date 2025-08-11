# SynC — Project Brief

Version: 1.0  
Date: 2025-08-11

## Executive Summary
SynC is a user-friendly web application that connects users with Hyperlocal businesses, facilitates social interactions, and enables gamified coupon sharing and incentives. It bridges a key gap for physical stores: instantly reaching customers with updates and staying connected during non‑shopping periods—an area where e‑commerce excels. SynC enhances user engagement via a single channel for business discovery and digital coupon management, while giving businesses a targeted, cost‑effective marketing approach to drive acquisition, retention, and Customer Lifetime Value (CLTV).

## Problem Statement
Brick‑and‑mortar businesses struggle to instantly update customers on offerings and to stay connected during non‑shopping times, leading to reduced footfall despite the “feel the product” value proposition. E‑commerce businesses excel at instant updates, offers, and promotions. SynC addresses this imbalance.

## Proposed Solution
Provide a unified platform for discovery, engagement, and rewards that leverages social features and gamified coupon sharing. Users explore businesses, receive relevant updates, and manage digital coupons. Businesses gain a “bullseye marketing” channel to broaden reach, acquire customers at lower CAC, and grow CLTV. Digital storefronts, targeted promotions, analytics, and gamification (e.g., identifying city‑level “Drivers”) are core pillars.

## Target Users
- Consumers: Seek deals, instant updates, relevant offers, and social engagement. Goals: explore businesses, reduce window shopping, collect/use digital coupons, engage with friends.
- Hyperlocal Business Owners: Want digital storefronts and instant updates (sales/EOSS/offers), targeted marketing with minimal spend. Goals: broaden target area/demographics, lower CAC, increase CLTV.

## Goals and Success Metrics
### Business Objectives
- Increase user engagement with Hyperlocal stores in cities
- Reduce window shopping and broaden business reach with bullseye marketing
- Minimize CAC and increase CLTV
- Revenue streams: coupon generation, promotional banners, push notifications, search ads
- Reduce marketing dependency on social media/influencers/cold marketing; reduce spam reviews/impulsive feedback

### User Success Metrics
- Users explore businesses, receive focused updates, manage/share/redeem digital coupons
- Social networking with friends around shopping behaviors
- Genuine recommendations with lightweight reviews

### Key Performance Indicators (KPIs)
- CAC reduction: target ₹400–600 per customer (30–50% lower than baseline)
- Footfall: +15–25% within 6 months for participating businesses
- Retention: users 75%, businesses 80%
- Short‑term (3–6 mo): 1k active users (2–3 cities), 50 businesses; DAU 15% / MAU 60%
- Medium‑term (6–12 mo): 5k users (5 cities), 200 businesses; ₹24k baseline monthly revenue from coupons (₹2 × 1,000)
- Long‑term (12–24 mo): 10k+ users, 500+ businesses, 10+ cities, CAC < ₹500

## Scope
### MVP (Must‑have)
- Users: Auth and profiles (Supabase Auth/Storage), dashboard with nav/search/city, coupon wallet, wishlist, favorites, feedback (recommend/don’t recommend), responsive web (React + Vite + Tailwind)
- Social: Find friends; requests/accept/decline; activity feed; share/accept/discard coupons (caps and lifecycle tracking)
- Coupons: Discovery and in‑store redemption; wallet updates; trending offers and savings advisor (P2 important)
- Businesses: Auth; onboarding (category/target areas/demographics/avg ticket seasons); digital storefronts (branding, location, offers, contact, trending products suggestions); dashboard (offers, analytics, recommendations, identify “Drivers”)
- Platform Owner: Dashboard for activity and monetization streams (coupon generation, ads, banners, push notifications)

### Out of Scope (MVP)
- In‑app chat in contacts sidebar; public coupon sharing (phase 2)
- AI agent features for wishlist events; video‑rich storefronts; user‑initiated event hosting
- Star ratings (use simple recommend/don’t recommend); manual check‑ins (prefer GPS/coupon redemption)
- KYC, mobile/WhatsApp OTPs, multi‑city per user/business (defer), detailed pricing tiers

### MVP Success Criteria
- SynC connects users with Hyperlocal businesses; social engagement and digital coupons working end‑to‑end
- Businesses broaden target reach with minimal spend; monetization streams operational
- Valid user flows/navigation/inputs with fallbacks; fast loads (<2s main screens); real‑time updates for social/business activity
- 99.9% uptime; secure auth and data privacy

## Market Research
Research is integrated throughout this document (qualitative and quantitative across consumers and business owners, competitive analysis, and triangulation). Detailed raw artifacts available upon request; brief leverages synthesized insights to inform goals, scope, and KPIs.

## Technical Assumptions (Initial)
- Repository: Monorepo (`apps/web`, `apps/api`, `packages/shared`)
- Frontend: React, Vite, Tailwind; UI components via Shadcn; responsive web first
- Backend: Serverless (Supabase Edge Functions and Netlify functions)
- Database/Auth/Storage: Supabase (managed Postgres, Auth, Storage)
- Realtime: Supabase Realtime or pub/sub layer; plan for 10k+ concurrent users
- CI/CD: Simple pipelines per workspace; incremental hardening
- Testing: Full pyramid (unit, integration, E2E) to support reliability and “no assumptions” handoffs

## Risks and Areas Requiring Deeper Investigation
- Realtime at scale (10k+ concurrent): websocket/pub‑sub architecture and cost/perf trade‑offs
- Gamification/“Driver” status computation and dynamic weightings (consistency and performance)
- Categorization accuracy (wishlist and product taxonomy); possible ML/AI refinement post‑MVP
- Coupon lifecycle and fraud prevention; transactional integrity

## Epics Overview (High‑Level)
- Epic 1: Foundational Platform & Onboarding — core repo, auth, user and business profiles
- Epic 2: Digital Storefronts & Discovery — storefront creation, product display, user personalization
- Epic 3: Gamified Coupon Lifecycle & Social — offers, coupons, wallet, sharing, redemption, activity
- Epic 4: Analytics, Targeted Marketing & Monetization — dashboards, targeting, revenue tracking
- Epic 5: Engagement & Notifications — feedback/reviews, realtime notifications, preferences

Note: Detailed stories/acceptance criteria will be formalized in the PRD and architecture documents.

## Non‑Functional Requirements (Initial)
- Performance: <2s main screens; realtime updates
- Security & Privacy: Supabase Auth; privacy posture (GDPR/CCPA placeholder)
- Scalability: 10k+ concurrent users (serverless, modular backend)
- Reliability: 99.9% uptime; backups/DR
- Accessibility: Modern, visually appealing; WCAG 2.1 AA aspirational where feasible
- Observability & Ops: Logging, monitoring/alerting, maintenance windows
- Resilience: Retries with backoff, circuit breakers, graceful degradation

## Open Decisions and Notes (from stakeholder inputs)
1) Theme: Consider Shadcn theme (e.g., tweakcn cosmic‑night)  
2) Components: Curate component list (Shadcn/reactbits/etc.) for final selection  
3) Page Layout: Propose component placement per screen for modern appeal  
4) Login Flow: If interests already chosen, successful login redirects to dashboard  
5) Cities: Interest/city lists focused on Indian Tier 1/2/3 cities (available across onboarding and dashboard)  
6) Interest Categories (initial draft): Active Life; Arts & Entertainment; Automotive; Beauty & Spas; Education; Event Planning & Services; Financial Services; Food; Health & Medical; Home Services; Hotels & Travel; Local Flavor; Local Services; Mass Media; Nightlife; Pets; Professional Services; Public Services & Government; Real Estate; Religious Organizations; Restaurants; Shopping  
7) Dev UX: Local dev opens in Chrome Incognito to avoid cache  
8) IDE Guidance: Provide no‑code‑friendly explanations for changes in each story  
9) Data Modeling: Design Supabase schema and relationships during planning; keep ADRs  
10) Story Outcomes: After each story, clearly list what is visible in the frontend and how to access

## Appendices and References
- A. Research Summary: Integrated into this brief
- B. Stakeholder Input: Incorporated via explicit decisions above
- C. References: Initial “BUSINESS IDEA” + subsequent clarifications from stakeholder sessions

## Change Log (Brief)
- 2025‑08‑11 v1.0 — Initial project brief created from stakeholder idea and integrated research

---
Next: Create PRD (`docs/prd.md`) from this brief, then Front‑End Spec (`docs/front-end-spec.md`), then Full‑Stack Architecture (`docs/fullstack-architecture.md`).


