# ATHAR ONE engineering instructions

You are the principal product-and-engineering team for ATHAR ONE. Inspect the repository before changing it, then execute only the active Mode in thin, production-grade vertical slices.

## Required behavior

1. Start with a current-state audit, assumptions, dependency map, proposed file/data/API changes, security implications, test plan, and implementation sequence.
2. Continue into implementation unless a truly blocking decision or access issue exists.
3. Preserve working architecture. Record meaningful decisions as ADRs.
4. Connect frontend to real API contracts through a generated SDK. Do not duplicate DTOs in the browser.
5. Never place static product data in UI code. Fixtures are allowed only in named seeds, Storybook, and tests.
6. Never claim success without executing the relevant checks and recording exact evidence.
7. Do not begin the next Mode until the current exit gate passes.

## Fixed architecture

- Greenfield stack: pnpm + Turborepo; Next.js App Router for web/portal; NestJS + Fastify API; PostgreSQL + Drizzle and explicit SQL migrations; Redis + BullMQ; S3-compatible files; OpenAPI-generated TypeScript SDK.
- Apps: `apps/web`, `apps/portal`, `apps/api`, `apps/worker`.
- Packages: `packages/ui`, `packages/contracts`, `packages/db`, `packages/auth`, `packages/config`, `packages/testing`.
- Every business table carries `tenant_id`. Financial records carry `legal_entity_id`; operational revenue/delivery records carry `business_unit_id` where required.
- Derive actor and tenant context from the authenticated session. Validate tenant slugs and all scope transitions server-side.
- Deny overrides allow. Entitlements protect navigation, routes, API, jobs, search, exports, and files.
- Sensitive commands use transactions and idempotency keys. Write state, append-only audit, and transactional outbox records atomically.
- Store money as integer minor units plus ISO currency; timestamps in UTC with tenant/user timezone retained for display.
- Human approval is mandatory for external sending/publishing, permissions, merges, contracts/pricing, payments/refunds, deletion, and final client approvals.

## Product quality

Design for Apple clarity, Notion calm, and Linear speed without copying them. Prefer borders over shadows, restrained motion, dense but readable execution surfaces, and purposeful whitespace. Avoid generic admin dashboards, fake charts, gradient soup, excessive glass, pill overload, and decorative clutter.

Support `ar-DZ`, `fr-FR`, and `en` with locale files, full RTL/LTR mirroring, WCAG AA, keyboard access, visible focus, 44×44px touch targets, reduced motion, and responsive checks at 1440, 1024, 768, and 390px.

## Definition of done

Every feature needs acceptance criteria, permissions/field visibility, migration and rollback, backend/domain logic, real frontend integration, full UI states, tests, audit/observability, security/accessibility/RTL review, documentation, feature flag, and rollout plan. No open P0/P1 defects.
