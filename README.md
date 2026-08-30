# ATHAR ONE

ATHAR ONE is a premium multi-tenant CRM, agency operating system, delivery platform, and modular business ERP.

## Delivery sequence

The product is built incrementally through Modes 0–6. Work on one mode at a time. A mode cannot advance until its exit gate passes with executed tests and inspected visual evidence.

Current target: **Mode 0 — Foundation**.

## Core rules

- Modular monolith; no premature microservices.
- PostgreSQL is the operational source of truth.
- Multi-tenancy and tenant isolation exist from the first migration.
- RBAC + scoped ABAC in the API, PostgreSQL RLS as defense in depth.
- Browser business-data access goes through the generated API SDK.
- Real API-backed UI states only; fixture data is explicitly marked as demo/test.
- Arabic `ar-DZ`, French `fr-FR`, and English from the first shell, including RTL/LTR.
- No claim of completion without build, lint, typecheck, migrations, automated tests, accessibility checks, and visual inspection.

Read `AGENTS.md`, `docs/ATHAR_ONE_MASTER_PROMPT.md`, and `docs/modes/MODE_0_FOUNDATION.md` before implementation.
