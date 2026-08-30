# ATHAR ONE — Global Master Prompt

## Mission

Build one production-grade platform with one chassis and one engine. ATHAR ONE Core is the commercial base product. Agency, Software, Studio, Academy, Group, AI, and Enterprise are modular editions activated by entitlements, configuration, templates, permissions, and feature flags—not forks or separate customer databases.

## Delivery contract

- Inspect, plan, implement, migrate, seed, test, render, inspect, and document.
- Work one Mode at a time in thin vertical slices.
- Select conservative scalable defaults and record them in ADRs when details are missing.
- Do not stop after planning unless access or a dangerous decision blocks execution.
- No mock frontend disconnected from the API and no hard-coded operational data.
- No success claim without command output and visual evidence.

## Security and reliability invariants

- Multi-tenancy from migration one; zero cross-tenant leakage.
- RBAC + scoped ABAC in API; PostgreSQL RLS as defense in depth.
- Append-only sensitive audit with actor, tenant, scope, timestamp, request/correlation IDs, safe before/after metadata, and source.
- Transactional outbox and idempotent background workers with retries, backoff, dead-letter handling, and observability.
- Secure sessions, MFA-ready boundaries, revocation, CSRF/XSS/injection defenses, rate limiting, signed URLs, secret management, webhook verification, least privilege, encrypted backups, and restore drills.
- Permission-filter context before AI retrieval; defend against prompt injection in imported/user content; never expose hidden fields, raw prompts, secrets, chain-of-thought, or other-tenant content.

## Frontend/backend contract

Browser → generated SDK/BFF → API application service → domain → repository/PostgreSQL. Validate requests at the boundary and invariants in the domain. Standardize errors, pagination, sorting/filtering, request IDs, optimistic concurrency, idempotency, query keys, cache invalidation, rollback, and feedback. Fail CI on contract drift.

## Product shell and design

Provide tenant/group and unit switching, global search, command palette, quick create, notifications, help/knowledge, profile/security, role-aware navigation, Home, Control Tower, My Work, permission denied, not found, and offline/retry states.

Tokens: canvas `#FFFFFF`, soft surface `#F9F8F7`, secondary surface `#F0EFED`, border `#E6E5E3`, text `#2C2C2B`, secondary text `#7D7A75`, accent `#2783DE`, positive `#46A171`, warning `#D5803B`, risk `#E56458`. Use an intentional dark mode, 8px rhythm, 8–12px radii, and at most two font families including a high-quality Arabic font.

Every screen needs purposeful loading, empty, error, denied, offline/retry, and success states. Motion is 160–240ms, uses opacity/transform, respects reduced motion, and exists only to clarify causality or continuity.

## Localization and accessibility

Support Arabic `ar-DZ`, French `fr-FR`, and English from day one. No hard-coded user-facing strings. Full RTL/LTR mirroring for navigation, drawers, tables, pagination, icons, charts, and mixed content. Meet WCAG AA with semantic HTML, keyboard navigation, focus visibility, screen-reader labels, and 44×44px minimum touch targets.

## Core business chain preserved for later Modes

Lead → Sale → Quote → Contract → Invoice → Payment → Client Activation → Engagement/Project → Tasks → Deliverable Version → Internal QA → Client Approval → Report → Renewal.

## Output required for every Mode

1. Current-state audit and dependency map.
2. ADRs.
3. Domain model/ERD and versioned migrations.
4. Permission matrix and threat notes.
5. OpenAPI and generated client.
6. UX architecture, flows, states, and responsive behavior.
7. Production implementation and named demo fixtures.
8. Automated tests and exact results.
9. Inspected screenshots for critical desktop/mobile routes.
10. Setup, operations, and handoff documentation.
11. Exit-gate PASS/FAIL report with evidence and remaining risks.
