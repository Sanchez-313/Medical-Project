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
value) for the support features to work — see `.env.example`. Note: it must
be in the real `.env`, not just `.env.example` — Next.js never reads the
latter at runtime.

### Answering tickets straight from Telegram

An admin/staff account can link their personal Telegram (`users.telegram_chat_id`)
to answer `customer_queries` from the medicalbot chat, instead of opening
`/staff/queries`. Tap-then-type — the same interaction pattern the bot
already uses for search/ask-a-question, not a reply-to-message gesture (an
earlier version required replying to a specific alert message, which was
confusing to actually use and got replaced):

1. New question comes in via `POST /api/support/telegram` → the site pushes
   a "🆕 Ticket #N" alert, with a "✍️ Reply" inline button carrying the
   ticket id, to whichever linked admin/staff account it finds
   (`lib/telegramNotify.ts`, using `BOT_TOKEN` — same token as the bot's own
   `.env`).
2. Staff taps that button. The bot asks them to type an answer, then posts
   it to `POST /api/support/telegram/answer` along with the ticket id and
   the replier's Telegram id.
3. That route verifies the replier's Telegram id actually belongs to an
   active admin/staff account (`users.telegram_chat_id` + role check).
   `BOT_API_SECRET` alone only proves the request came from *a* copy of the
   bot, not that the human typing was staff — this is the real authorization
   boundary (the bot can't hide the "✍️ Reply" button from a non-staff
   viewer, so this check has to happen server-side, not client-side).
4. On success, the answer is saved (`responded_by` resolves to that real
   staff account, so it's attributed the same way a `/staff/queries` answer
   would be) and pushed straight back to the customer's Telegram chat.

To link an account, set `users.telegram_chat_id` directly (there's no UI for
this yet — get the numeric id from something like `@userinfobot`). Only one
linked account is notified per ticket today — if a second admin/staff
account links their Telegram, only one of them gets the alert.

`lib/telegramNotify.ts` sends plain text, deliberately with no `parse_mode` —
every message here embeds unsanitized user-typed content (a customer's
question, a staff reply), and Telegram's legacy Markdown parser hard-fails
the whole send on a single stray `_`/`*`/`` ` ``/`[` in that text.
