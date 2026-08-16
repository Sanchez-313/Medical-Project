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

## Telegram bot integration

The storefront's "Need Help?" button (`components/NeedHelpButton.tsx`) opens
`@medicalbot` on Telegram (`../Telegram-bot/medicalbot`). That bot talks to
this app over HTTP, not to MySQL directly:

- `GET /api/products` — same public endpoint the storefront uses, so the
  bot's medicine search/pricing/stock always matches the live catalog.
- `POST` / `GET /api/support/telegram` — lets a Telegram user submit a
  support question and check its status, without a website login. Gated by
  a shared secret (`BOT_API_SECRET`, sent as the `x-bot-secret` header) since
  there's no session to check. Submitted questions show up in
  `/staff/queries` like any other, attributed to a dedicated inactive
  "Telegram Bot" service account (`lib/telegramBot.ts`) with the real
  asker's chat id/username kept on the row (`customer_queries.telegram_*`).

Set `BOT_API_SECRET` in both this app's `.env` and the bot's `.env` (same
value) for the support features to work — see `.env.example`.
