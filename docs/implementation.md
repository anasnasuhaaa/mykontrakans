# Implementation log

## Stage 0 — Existing project audit

- npm (`package-lock.json`), Next.js 16.3.5, React 19.2.8, TypeScript strict, App Router at `app/`.
- Tailwind CSS 4 via PostCSS; Lucide and Sonner installed.
- `@shadcn/ui` dependency exists, but no generated components or `components.json` yet.
- No database, authentication, forms, environment handling or business logic. Existing page is the Create Next App starter.
- No QRIS image or environment file supplied. Real integration verification requires owner-provided Neon, Resend, Blob configuration and `public/qris.jpg`.
- Preserve existing dependencies and folder structure. Add Prisma 6 (stable driver-adapter support), Neon adapter, Zod, bcrypt, Resend, Blob, next-themes, Recharts, date utilities, shadcn primitives and test tooling.
- Use React 19 action state + reusable Zod schemas rather than adding an unnecessary form dependency.
- Read installed Next.js documentation: async cookies/params, `proxy.ts` replaces deprecated middleware, authorize each server action and data access (layout/proxy alone are insufficient).
- Architecture: opaque random database sessions, hashed single-use invitations, integer IDR ledger, immutable payment submissions, atomic review with unique payment income, explicit monthly generation, Jakarta calendar boundaries.
- All stages receive separate commits; no push or deployment.

Stage 0 verification: `npm run lint`, `npm run typecheck`, and `npm run build` passed. Development server returned HTTP 200 on `/`. One dependency install hit ECONNRESET; retry succeeded.

## Stage 1 — Database & core models

Prisma schema, initial SQL migration, singleton Neon adapter, category/settings seed, optional administrator seed and `.env.example` added. Model includes database-backed sessions and rate-limit attempts alongside all required financial entities. Unique period, member/period, token and payment-income constraints preserve identity; relational deletes restrict financial history loss.

`prisma validate` passed with a syntactically valid local placeholder URL (no database connection). `db:migrate` and `db:seed` were attempted and **blocked because DATABASE_URL is not configured** (Prisma P1012). No database was modified. Apply migration and seed after configuring a real Neon database.

## Verification policy

Run lint, typecheck and production build before each stage commit. Add domain and integration tests as features become available. Record external checks honestly: a successful build is not proof of live Neon, email or storage connectivity. Never substitute mock production analytics or a fake payable QRIS.
