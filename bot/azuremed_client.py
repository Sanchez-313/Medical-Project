"""HTTP client for talking to the azuremed-hub website's API.

The bot never touches MySQL directly (there's no DB_* config anymore) —
every read/write goes through azuremed-hub's own Next.js API routes, so the
bot always shows the same prices/stock the storefront shows, and the site's
own validation/rate-limiting/business rules apply the same way whether a
customer used the website or Telegram.
"""
import os
import time
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:3000").rstrip("/")
BOT_API_SECRET = os.getenv("BOT_API_SECRET", "")

_client = httpx.AsyncClient(base_url=API_BASE_URL, timeout=10.0)


class AzuremedApiError(Exception):
    """Raised when the website API is unreachable or refuses a request."""


# --- Product catalog cache --------------------------------------------------
# GET /api/products is public and the whole active catalog is small (~90
# rows), so caching it in-process keeps every menu tap/search instant
# instead of round-tripping to the site on every keystroke, while still
# picking up real price/stock changes within a few minutes.
_CACHE_TTL_SECONDS = 300
_catalog_cache: dict = {"items": None, "fetched_at": 0.0}


async def get_catalog(force_refresh: bool = False) -> list[dict]:
    """Full active medicine catalog (id, name, category, description,
    image_url, selling_price_ks, stock_qty, status), cached for a few
    minutes. Falls back to the last good cache on a request failure so a
    transient site/network hiccup doesn't break browsing for someone already
    mid-session.
    """
    now = time.monotonic()
    is_stale = (
        force_refresh
        or _catalog_cache["items"] is None
        or (now - _catalog_cache["fetched_at"]) > _CACHE_TTL_SECONDS
    )
    if not is_stale:
        return _catalog_cache["items"]

    try:
        resp = await _client.get("/api/products")
        resp.raise_for_status()
        items = resp.json().get("data", [])
        _catalog_cache["items"] = items
        _catalog_cache["fetched_at"] = now
        return items
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Failed to refresh medicine catalog: %s", exc)
        if _catalog_cache["items"] is not None:
            return _catalog_cache["items"]
        raise AzuremedApiError(
            "ဝဘ်ဆိုဒ်နှင့် ချိတ်ဆက်မရပါ။ အနည်းငယ်စောင့်ပြီး ထပ်ကြိုးစားကြည့်ပါ။"
        ) from exc


def find_medicine(items: list[dict], medicine_id: int) -> Optional[dict]:
    return next((m for m in items if m.get("id") == medicine_id), None)


def _bot_headers() -> dict:
    return {"x-bot-secret": BOT_API_SECRET}


async def submit_support_query(chat_id: int, username: Optional[str], message: str) -> int:
    """POST a Telegram user's question to /api/support/telegram. Returns the new ticket id."""
    try:
        resp = await _client.post(
            "/api/support/telegram",
            json={"chat_id": chat_id, "username": username, "message": message},
            headers=_bot_headers(),
        )
        resp.raise_for_status()
        return resp.json()["data"]["id"]
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            raise AzuremedApiError(
                "မေးခွန်းများ တိုတိုတိုချင်း အလွန်များနေပါသည်။ မိနစ်အနည်းငယ်စောင့်ပြီး ထပ်ကြိုးစားပါ။"
            ) from exc
        logger.warning("Support submission rejected (%s): %s", exc.response.status_code, exc.response.text)
        raise AzuremedApiError("ဝဘ်ဆိုဒ်က တောင်းဆိုမှုကို လက်မခံပါ။ နောက်မှ ထပ်ကြိုးစားကြည့်ပါ။") from exc
    except httpx.HTTPError as exc:
        logger.warning("Failed to submit support query: %s", exc)
        raise AzuremedApiError("ဝဘ်ဆိုဒ်သို့ မေးခွန်းပို့၍မရပါ။ အင်တာနက်ချိတ်ဆက်မှု စစ်ဆေးပြီး ထပ်ကြိုးစားပါ။") from exc


async def get_my_tickets(chat_id: int) -> list[dict]:
    try:
        resp = await _client.get("/api/support/telegram", params={"chat_id": chat_id}, headers=_bot_headers())
        resp.raise_for_status()
        return resp.json().get("data", [])
    except httpx.HTTPError as exc:
        logger.warning("Failed to fetch tickets: %s", exc)
        raise AzuremedApiError("မေးခွန်းများကို ဆွဲယူ၍မရပါ။ ထပ်ကြိုးစားကြည့်ပါ။") from exc


async def place_order(
    chat_id: int,
    username: Optional[str],
    product_id: int,
    qty: int,
    payment_method: str,
    full_name: str,
    phone: str,
    city: str,
    address: str,
    payment_proof: Optional[tuple] = None,
) -> dict:
    """POST a Telegram-collected order to /api/orders/telegram. `payment_proof`,
    if given, is (filename, bytes, mime_type) for the KBZ Pay screenshot the
    customer sent as a photo message. Returns the created order's data
    (order_code, total_ks, etc.) on success.
    """
    data = {
        "chat_id": str(chat_id),
        "username": username or "",
        "product_id": str(product_id),
        "qty": str(qty),
        "payment_method": payment_method,
        "full_name": full_name,
        "phone": phone,
        "city": city,
        "address": address,
    }
    files = None
    if payment_proof:
        filename, content, mime_type = payment_proof
        files = {"payment_proof": (filename, content, mime_type)}

    try:
        resp = await _client.post("/api/orders/telegram", data=data, files=files, headers=_bot_headers())
        resp.raise_for_status()
        return resp.json()["data"]
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 429:
            raise AzuremedApiError(
                "အော်ဒါများ တိုတိုချင်း အလွန်များနေပါသည်။ မိနစ်အနည်းငယ်စောင့်ပြီး ထပ်ကြိုးစားပါ။"
            ) from exc
        # Surface the site's own validation message (e.g. "X only has N in
        # stock", "A KBZ Pay payment screenshot is required") rather than a
        # generic failure — these are actionable, unlike a 500.
        try:
            server_message = exc.response.json().get("message")
        except ValueError:
            server_message = None
        logger.warning("Order submission rejected (%s): %s", exc.response.status_code, exc.response.text)
        raise AzuremedApiError(server_message or "ဝဘ်ဆိုဒ်က အော်ဒါကို လက်မခံပါ။ ထပ်ကြိုးစားကြည့်ပါ။") from exc
    except httpx.HTTPError as exc:
        logger.warning("Failed to submit order: %s", exc)
        raise AzuremedApiError("ဝဘ်ဆိုဒ်သို့ အော်ဒါပို့၍မရပါ။ အင်တာနက်ချိတ်ဆက်မှု စစ်ဆေးပြီး ထပ်ကြိုးစားပါ။") from exc


async def submit_staff_answer(ticket_id: int, telegram_user_id: int, staff_response: str) -> int:
    """POST a staff member's typed answer (after tapping "✍️ Reply" on a
    ticket alert) to /api/support/telegram/answer. Returns the answered
    ticket's id. The site is the real authority on whether telegram_user_id
    is actually linked to a staff/admin account — a 403 here means it
    isn't, which callers should treat as "this button shouldn't have been
    tappable by this user" rather than an ordinary retry-able error.
    """
    try:
        resp = await _client.post(
            "/api/support/telegram/answer",
            json={"ticket_id": ticket_id, "telegram_user_id": telegram_user_id, "staff_response": staff_response},
            headers=_bot_headers(),
        )
        resp.raise_for_status()
        return resp.json()["data"]["id"]
    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 403:
            raise AzuremedApiError("❌ ဤအကောင့်သည် ဝန်ထမ်း/admin အဖြစ် link မလုပ်ထားပါ။") from exc
        if exc.response.status_code == 404:
            raise AzuremedApiError("❌ ဤ Ticket ကို ရှာမတွေ့ပါ။") from exc
        logger.warning("Staff answer rejected (%s): %s", exc.response.status_code, exc.response.text)
        raise AzuremedApiError("ဝဘ်ဆိုဒ်က ဖြေကြားချက်ကို လက်မခံပါ။ ထပ်ကြိုးစားကြည့်ပါ။") from exc
    except httpx.HTTPError as exc:
        logger.warning("Failed to submit staff answer: %s", exc)
        raise AzuremedApiError("ဝဘ်ဆိုဒ်သို့ ဖြေကြားချက်ပို့၍မရပါ။ ထပ်ကြိုးစားကြည့်ပါ။") from exc


async def aclose():
    await _client.aclose()
