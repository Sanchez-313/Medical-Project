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

Only ever run **one** copy at a time — Telegram splits updates unpredictably
between multiple long-polling processes on the same token, which silently
breaks multi-step flows (search, ask-a-question, answering tickets). The
bot refuses to start a second copy on its own (see `_acquire_single_instance_lock`
in `bot.py`), but that only catches copies started *after* the first — it
won't warn you about one already running in another window.

## Production (Railway)

Deployed as a separate **worker** service (no HTTP port to expose — it's a
long-polling process) with this directory as its Root Directory. See
`../DEPLOYMENT.md`.
