Version v0.1.8

UI
- Added request recorder wrapper for API calls, capturing response headers and building a cURL command.
- Session tab: added "Copy last cURL" and inline collapsible cURL preview.
- Standardized toast notifications with success/error variants; wired to key flows (auth, ads/offers/products, pricing, reviews, notifications).
- Replaced Tailwind @apply utilities with plain CSS variables to resolve build warnings.

Build/Tests
- Tests: green (28/28).
- Web build: successful; CSS compiled with new variables.

Ops
- Smoke tests passed on production URL.


