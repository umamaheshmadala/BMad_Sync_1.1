# Non-Functional Requirements (NFR)

See `../prd.md` → section 7.2 for full details.

Highlights:
- Performance: <2s main screens; realtime updates
- Security: Supabase Auth; privacy posture placeholders
- Reliability: 99.9% uptime; backups/DR; fault tolerance (retries, circuit breakers)
- Observability: logging, monitoring, alerting; maintenance windows
- Accessibility & UX: modern UI, WCAG 2.1 AA aspirational
- Testability: seeds, mocks, E2E flake budget < 1%, CI < 10 min
