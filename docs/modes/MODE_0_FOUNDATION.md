# Mode 0 — Foundation

## Goal
Create a secure, polished, production-ready chassis reusable by every later module. Execute Mode 0 only.

## Implement

1. Monorepo: `apps/web`, `apps/portal`, `apps/api`, `apps/worker`; `packages/ui`, `contracts`, `db`, `auth`, `config`, `testing`; strict TypeScript and unified scripts.
2. Validated environments for local, development, staging, pilot, production, and demo/sandbox; never commit secrets.
3. CI/CD with caching, lint, formatting, typecheck, tests, migration validation, security scanning, builds, previews, and controlled production deployment.
4. Identity/tenancy: users, tenants, optional groups, legal entities, business units, departments, teams, locations, memberships, invitations, sessions, and entitlements.
5. Authorization: permissions, roles, scoped bindings, stronger-deny behavior, field masking, API guards/policies, RLS, and automated matrix/isolation tests.
6. Append-only audit queryable only by authorized auditors.
7. Transactional outbox, worker skeleton, idempotency, feature flags, storage adapter, notification interfaces, credential references, health/readiness, logs, traces, and error reporting.
8. Premium design system: tokens, type, spacing, themes, RTL/LTR, accessible forms/buttons/inputs/menu/tables/status/drawers/dialogs/toasts/skeletons/empty/error/chart shell, plus Storybook or equivalent.
9. Real authenticated shell: invitation acceptance, tenant/unit switchers, role-aware navigation, search, command palette, quick create, notifications, profile/security, Home, Control Tower, My Work, denied, not-found, and offline/retry.
10. OpenAPI and generated SDK; authenticated request context; standard errors/pagination/correlation IDs; one real tenant-settings read/write flow.
11. Fixtures: two tenants, one group/four units, founder, unit manager, finance admin, member, contractor, and client. Test data must be marked and excluded from metrics.
12. Documentation: architecture, boundaries, setup, migrations, testing, RLS, permission matrix, observability, and deployment runbook.

## Security proof

- Tenant A cannot read or write Tenant B via parameters, guessed IDs, direct URLs, workers, search, exports, or file URLs.
- Five representative roles receive exactly intended actions and fields.
- A disabled module stays inaccessible through guessed routes and API calls.

## Visual proof

Inspect—not merely render—critical routes at 1440, 1024, 768, and 390px in light/dark, Arabic RTL, and an LTR locale. Check main/loading/empty/error/denied/validation/dialog/drawer/long/dense states; keyboard navigation, focus, screen-reader labels, table semantics, modal focus trap, command palette, and directional behavior. Fix overlaps, clipping, overflow, poor contrast, undersized targets, generic template patterns, and decorative clutter.

## Exit gate

PASS only when tenant isolation and selected role matrix pass 100%; migrations apply and roll back; CI is green; shell is usable in Arabic, French, and English; frontend uses generated API client; and no business table is exposed directly to the browser.

At completion report a PASS/FAIL evidence table, exact commands, screenshots inspected, unresolved risks, and recommended first Mode 1 slice. Do not start Mode 1.
