# medicalbot

The Telegram bot the storefront's "Need Help?" button opens
(`components/NeedHelpButton.tsx` in the parent repo). Moved here (from an
unrelated local folder) so it deploys alongside the site it depends on —
see `../README.md`'s "Telegram bot integration" section for how the two
talk to each other.

It has no database of its own — everything it shows comes from the parent
app's own API (`API_BASE_URL`), and it holds no state beyond an in-process
cache and per-chat conversation step.

## Local dev

```bash
cp .env.example .env    # fill in BOT_TOKEN, API_BASE_URL, BOT_API_SECRET
pip install -r requirements.txt
python bot.py
```

Only ever run **one** copy at a time **per bot token** — Telegram only
allows one long-polling `getUpdates` connection per token. A second one
(e.g. this local process and the Railway deployment both polling with the
same token) doesn't fail gracefully: you get a `409 Conflict` error on
every poll, or Telegram silently splits updates unpredictably between the
two, breaking multi-step flows (search, ask-a-question, answering tickets,
placing an order) whenever a user's next message lands on the "wrong"
process. The bot refuses to start a second copy on its own machine (see
`_acquire_single_instance_lock` in `bot.py`), but that can't see a copy
already running elsewhere (Railway).

**Use a separate bot for local dev.** Create a second bot via @BotFather
(`/newbot`, free, no limit on how many you make) and put *that* token in
your local `.env`/`.env.docker` — never the same token production uses.
This also means `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` and the parent app's
own `BOT_TOKEN` (used by `lib/telegramNotify.ts` to push messages) need to
point at the dev bot too when testing locally — a `chat_id` is only valid
for the specific bot a customer messaged, so the notification-sending side
has to match whichever bot the conversation actually happened on.

If a token ever leaks (pasted somewhere, committed to git, shown in a log
you shared) — revoke it immediately: @BotFather → `/revoke` (or `/token`
for a fresh one), then update it wherever it's configured (this bot's env,
and the parent app's `BOT_TOKEN`/`BOT_API_SECRET` if those were affected
too).

## Production (Railway)

Deployed as a separate **worker** service (no HTTP port to expose — it's a
long-polling process) with this directory as its Root Directory. See
`../DEPLOYMENT.md`.
