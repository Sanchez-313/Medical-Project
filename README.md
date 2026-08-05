# AzureMed Hub (Next.js RBAC platform)

Replaces the legacy PHP backend + dual Vite React SPAs (`Medical_Product`,
`Admin-Dashboard`) with a single Next.js App Router app: NextAuth credentials
auth, Prisma/MySQL, three-tier RBAC (Super Admin / Admin / Agent), and a
server-side Google AI image-detection proxy.

## Setup

```bash
cp .env.example .env       # fill in DATABASE_URL, NEXTAUTH_SECRET, GOOGLE_AI_*
npm install
npx prisma migrate dev --name init
npm run prisma:seed        # creates owner@azuremedhub.com / admin@... / agent@...
npm run dev
```

## What's implemented vs. left as follow-up

Implemented (see `../.claude/plans/fluttering-singing-bubble.md` for the full
architecture writeup):
- `prisma/schema.prisma` — full data model incl. `cost_price_ks` for real margin reporting.
- `lib/auth.ts`, `lib/rbac.ts`, `middleware.ts` — auth + role enforcement (path-level and query-level).
- `lib/stock.ts`, `lib/cartReservation.ts` — ported from `backend/src/Core/Stock.php` / `CartReservation.php`.
- Representative API routes: `/api/admin/owner/financials` (Super Admin only), `/api/admin/inventory` (role-filtered `select`), `/api/agent/sales` (Agent-scoped writes/reads), `/api/ai/detect` (Google AI proxy).
- Representative dashboard pages: role-filtered nav layout, owner financials page, shared overview page with server-side field masking.

Follow-up (same pattern, not yet built out): remaining CRUD pages (customers,
deliveries, reports UI + Recharts), porting the `Medical_Product` storefront
pages into `app/(storefront)`, and a data-migration script from
`backend/database/app.sqlite` into MySQL.
