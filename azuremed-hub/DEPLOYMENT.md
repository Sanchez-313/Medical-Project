# Deploying to Railway (24/7 hosting)

This deploys three pieces from this one repo: the Next.js site, the
`medicalbot` Telegram bot (as a background worker — it long-polls Telegram,
it doesn't need an HTTP port), and a managed MySQL database.

Steps marked **(you)** need your own Railway account/browser — nothing here
can be scripted from outside it. Steps marked **(local)** you run on this
machine first.

## 0. Commit and push the prepared code

**(local)**
```bash
git push origin main
```
Review the commit on GitHub before connecting Railway. If you use a separate
deployment branch instead of `main`, select that branch in the Railway
service source settings.

## 1. Create the Railway project

**(you)**
1. Go to [railway.app](https://railway.app), sign up, verify your account (needed even on the Hobby plan for anti-abuse reasons).
2. **New Project** → **Deploy from GitHub repo** → pick `dravenkai/Medical-Management-Project`, authorize Railway if prompted.
3. Rename the service to `azuremed-web`.
4. In **Settings**, set **Root Directory** to `/azuremed-hub`.
5. If Railway asks for a config-file path, use `/azuremed-hub/railway.json`.

## 2. Add MySQL

**(you)**
1. In the same project, **New** → **Database** → **Add MySQL**.
2. Once it's up, open its **Variables** tab and note it exposes things like `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` — you don't need to copy these by hand, the next step references them directly.

## 3. Configure the web service

**(you)** — in the `azuremed-web` service → **Variables** tab, add:

```
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASS=${{MySQL.MYSQLPASSWORD}}
DB_NAME=${{MySQL.MYSQLDATABASE}}

NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXTAUTH_URL=<filled in after step 5, once you have a domain>

BOT_API_SECRET=<same value you'll put in the bot service's env — generate with: openssl rand -hex 32>
BOT_TOKEN=<from @BotFather — same value the bot service uses>
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=<your bot's @username, no @>

GOOGLE_AI_ENDPOINT=<optional — leave unset if you're not using AI detection>
GOOGLE_AI_API_KEY=<optional>
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<optional — see .env.example>
RECAPTCHA_SECRET_KEY=<optional>
SMTP_HOST=<optional — password-reset emails log to console if unset>
SMTP_PORT=587
SMTP_USER=<optional>
SMTP_PASS=<optional>
SMTP_FROM=AzureMed Hub <no-reply@azuremedhub.com>
RAILWAY_RUN_UID=0
```

`${{MySQL.VAR}}` is Railway's own syntax for referencing another service's
variable — type it literally, Railway resolves it at deploy time. Use the
**exact same** `BOT_API_SECRET` and `BOT_TOKEN` values you're about to put
in the bot service in step 6 — a mismatch here silently breaks "Ask a
question"/"My tickets" the same way it did in local dev (see the "why did
this fail" history in this repo's commits if curious).

Railway sets `PORT`; the checked-in Dockerfile builds the standalone Next.js
server and starts it with `node server.js`.

## 4. Persist uploaded images (Volume)

Product photos, ad slides, AI-detection uploads, and payment-proof
screenshots all get written to `public/uploads/...` on disk
(`app/api/admin/medicines/route.ts` and similar). Without a Volume, that
directory resets on every redeploy.

**(you)** In `azuremed-web` → **Settings** → **Volumes** → **New Volume**:
- Mount path: `/app/public/uploads`

Railway mounts volumes as root. The `RAILWAY_RUN_UID=0` web-service variable
above lets the Docker deployment write runtime uploads to this mount.

## 5. Domain

**(you)** Railway gives every service a free `*.up.railway.app` subdomain —
`azuremed-web` → **Settings** → **Networking** → **Generate Domain**. That's
enough to go live immediately; a custom domain is optional and can be added
the same place later.

Once you have the domain (Railway's free one or your own), go back and set:
- `NEXTAUTH_URL` = `https://<that-domain>`

## 6. Configure the bot service

**(you)**
1. In the project, **New** → **GitHub Repo** → same repo again.
2. In its **Settings**, set **Root Directory** to `/azuremed-hub/bot`. If
   Railway asks for a config-file path, use
   `/azuremed-hub/bot/railway.json`. Railway builds the bot Dockerfile and
   runs `python bot.py`.
3. Under **Settings** → **Deploy**, there may be a "generate a domain /
   expose a port" prompt — **skip it**. This service never listens on a
   port; it's a long-polling worker, not a web server. If Railway insists
   on treating it as a web service, add `RAILWAY_HEALTHCHECK_TIMEOUT_SEC`
   removal / mark it explicitly as a worker in service settings (exact UI
   wording changes over time — the key point is it needs no public network
   binding).
4. **Variables** tab:
   ```
   BOT_TOKEN=<same value as the web service>
   API_BASE_URL=<the domain from step 5, e.g. https://azuremed-web-production.up.railway.app>
   SITE_URL=<the same public https:// domain; used by product, shopping, and AI buttons>
   BOT_API_SECRET=<same value as the web service>
   ```

## 7. Apply the schema, then migrate your real data

**(local)** Point this machine's `.env` at Railway's MySQL temporarily —
`azuremed-web`'s Variables tab shows the resolved connection details, or use
the MySQL service's own **Connect** tab for a public-facing host/port (the
`${{MySQL.MYSQLHOST}}` reference syntax only works *between* Railway
services, not from your laptop — you need the actual public hostname/port
Railway shows you there).

```bash
# In azuremed-hub/.env, temporarily set DB_HOST/DB_PORT/DB_USER/DB_PASS/DB_NAME
# to Railway's MySQL public connection info (from its Connect tab), then:

npm run db:schema        # creates all tables on the new database

# Bring over your real local data (products, your admin account, your
# linked Telegram id, everything) instead of starting empty:
#   1. First, temporarily point .env back at your LOCAL database and run:
node scripts/migrateData.js dump > azuremed_hub_dump.sql
#   2. Then point .env at Railway's MySQL again and run:
node scripts/migrateData.js restore azuremed_hub_dump.sql

# Afterward, revert .env back to your local DB_* values for local dev.
```

`azuremed_hub_dump.sql` contains real data (password hashes, customer
info) — don't commit it. Delete it once the restore succeeds.

## 8. Verify

- Visit the web service's domain — storefront should load, showing your
  real 123 products.
- Log in as `dravenkai2@gmail.com` — should reach `/admin` with all your
  data intact.
- Open Telegram, message the bot, `/start` — categories should match the
  site.
- Submit a test question through the bot's "❓ Ask a question" — the
  "🆕 Ticket #N" alert with the "✍️ Reply" button should arrive in your
  Telegram (you're still linked via `telegram_chat_id` from the migrated
  data).

## Rotate secrets before calling this "production"

Several secrets in your local `.env` history were exposed in plaintext at
some point during development (the bot token was hardcoded in source
early on; see `bot/README.md` and this repo's commit history). Before
relying on this for real customers:
- Rotate `BOT_TOKEN` via @BotFather one more time and update it in both
  Railway services.
- Generate a fresh `BOT_API_SECRET` and `NEXTAUTH_SECRET` rather than
  reusing the ones from local dev.
