"""medicalbot — the Telegram bot opened by azuremed-hub's storefront
"Need Help?" widget (components/NeedHelpButton.tsx in that repo).

Everything the bot shows comes from the live azuremed-hub website over HTTP
(see azuremed_client.py) instead of a hardcoded medicine list, so prices,
stock, and categories here always match what a customer sees on the site.
Support questions asked here land in the same /staff/queries inbox staff
already use for the storefront's Support page.
"""
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
    MessageHandler,
    filters,
)
from telegram.constants import ParseMode
from telegram.error import BadRequest, TelegramError
import os
import time
import logging
from dotenv import load_dotenv

# Must run before importing azuremed_client — that module reads
# API_BASE_URL/BOT_API_SECRET from the environment at import time, so
# loading .env after the import would leave it seeing an empty environment
# (this is why BOT_API_SECRET was reported as "not set" even when it was
# filled in in .env).
load_dotenv()

import azuremed_client as api

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

SITE_URL = os.getenv("SITE_URL", api.API_BASE_URL)

STATUS_LABELS = {
    "normal": "✅ ရရှိနိုင်ပါသည်",
    "low": "⚠️ လက်ကျန်နည်းနေပါပြီ",
    "expired": "❌ လက်ရှိမရရှိပါ",
}

# Common Myanmar search terms mapped to the English catalog keywords they
# should match against — the site's `medicines.name`/`category` are English,
# but most customers here type Myanmar. This is a convenience layer on top
# of live data, not a second source of truth: everything else (price,
# stock, description) always comes straight from the API.
SEARCH_ALIASES = {
    "ပါရာစီတမော": "paracetamol",
    "အဖျား": "paracetamol",
    "ခေါင်းကိုက်": "paracetamol",
    "ပဋိဇီဝ": "amoxicillin antibiotic",
    "ရောင်ရမ်း": "ibuprofen",
    "နာကျင်": "ibuprofen pain",
    "အစာအိမ်": "omeprazole stomach",
    "ဗီတာမင်": "vitamin",
    "ချောင်းဆိုး": "cough",
}

TICKET_STATUS_LABELS = {
    "open": "🕓 စောင့်ဆိုင်းနေဆဲ",
    "answered": "✅ ဖြေကြားပြီး",
    "closed": "🔒 ပိတ်ထားသည်",
}


def format_price(ks: int) -> str:
    return f"{ks:,} Ks"


def is_telegram_button_url(url: str) -> bool:
    """Telegram rejects inline URL buttons that aren't https:// (plain
    http://, and in particular http://localhost during local dev, get a
    400 "wrong http url" on every send). Skip the button entirely rather
    than crash when SITE_URL is a local dev address.
    """
    return url.startswith("https://")


def cache_busted(url: str) -> str:
    """Telegram's in-app WebView can cache a page by its exact URL string on
    the client side, independent of whatever Cache-Control the server sends
    (see next.config.js on the azuremed-hub side for the server half of this
    fix) — reopening the same link kept showing whatever build was live the
    first time it was tapped, even long after a fresh Railway deploy.
    Appending a per-tap timestamp makes every open a distinct URL, forcing a
    real fetch instead of a cached hit.
    """
    separator = "&" if "?" in url else "?"
    return f"{url}{separator}_t={int(time.time())}"


def main_menu_keyboard() -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton("📊 ဆေးအမျိုးအစား", callback_data="categories")],
        [InlineKeyboardButton("💊 ဆေးအမည်ရှာ", callback_data="search")],
        [InlineKeyboardButton("❓ မေးခွန်းမေးရန်", callback_data="ask_question")],
        [InlineKeyboardButton("🗂 ကျွန်ုပ်၏မေးခွန်းများ", callback_data="my_tickets")],
    ]
    if is_telegram_button_url(SITE_URL):
        rows.append([InlineKeyboardButton("🌐 ဝဘ်ဆိုဒ်သို့ သွားရန်", url=cache_busted(SITE_URL))])
    rows += [
        [InlineKeyboardButton("ℹ️ Bot အသုံးပြုနည်း", callback_data="help")],
        [InlineKeyboardButton("🧹 စကားအားလုံး ရှင်း", callback_data="clear")],
    ]
    return InlineKeyboardMarkup(rows)


WELCOME_TEXT = """
🔥 *AzureMed Hub — ဆေးဖက်ဝင်အချက်အလက် Bot* 🔥

⚠️ *အရေးကြီးသတိပေးချက်*:
✅ ဤ Bot သည် ဆေးဆိုင်ရဲ့ *လက်ရှိစျေးနှုန်း/လက်ကျန်ကို* ပြသပေးရုံသာဖြစ်သည်
✅ **ဆေးမသောက်မီ ဆရာဝန်နှင့် တိုင်ပင်ပါ**
✅ ပြဿနာရှိပါက "❓ မေးခွန်းမေးရန်" ကို နှိပ်ပြီး ဝန်ထမ်းများထံ တိုက်ရိုက်မေးနိုင်ပါသည်

📋 *ရွေးချယ်မှုများ*:
"""


class MedicineBot:
    def __init__(self):
        # Per-user conversation state for the free-text steps (search /
        # asking a question). In-memory and per-process, same tradeoff the
        # original bot made — restart clears it, but nothing important is
        # lost, since tickets/catalog data live on the website, not here.
        self.user_sessions: dict[int, dict] = {}

    async def _send_or_edit(self, update: Update, context: ContextTypes.DEFAULT_TYPE, text, reply_markup,
                             delete_previous=True):
        chat_id = update.effective_chat.id
        if delete_previous and update.callback_query:
            try:
                await update.callback_query.edit_message_text(
                    text, parse_mode=ParseMode.MARKDOWN, reply_markup=reply_markup
                )
                return
            except BadRequest as exc:
                # "Message is not modified" (re-tapping the same menu) is
                # harmless and expected; anything else, fall through and
                # send a fresh message so the user isn't stuck.
                if "not modified" not in str(exc).lower():
                    logger.warning("edit_message_text failed, sending new message instead: %s", exc)
        msg = await context.bot.send_message(
            chat_id=chat_id, text=text, parse_mode=ParseMode.MARKDOWN, reply_markup=reply_markup
        )
        context.chat_data.setdefault("messages", []).append(msg.message_id)

    async def main_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE, delete_previous=True):
        await self._send_or_edit(update, context, WELCOME_TEXT, main_menu_keyboard(), delete_previous)

    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        context.chat_data.setdefault("messages", []).append(update.message.message_id)
        self.user_sessions.pop(update.effective_user.id, None)
        await self.main_menu(update, context, delete_previous=False)

    async def super_clear(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        chat_id = update.effective_chat.id
        for msg_id in context.chat_data.get("messages", []):
            try:
                await context.bot.delete_message(chat_id=chat_id, message_id=msg_id)
            except TelegramError:
                pass  # already deleted / too old to delete — fine either way
        context.chat_data.clear()
        self.user_sessions.pop(update.effective_user.id, None)
        await self.main_menu(update, context, delete_previous=False)

    # ---- Catalog (live from the website) ---------------------------------

    async def category_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()
        await self._render_categories(query, context)

    async def _render_categories(self, query, context: ContextTypes.DEFAULT_TYPE):
        """Renders the category list onto an already-answered callback query.
        Split out from category_menu so callers that already called
        query.answer() (e.g. the stale-index fallback below) don't answer
        the same callback query twice — Telegram rejects the second call.
        """
        try:
            items = await api.get_catalog()
        except api.AzuremedApiError as exc:
            await self._show_api_error(query, str(exc))
            return

        counts: dict[str, int] = {}
        for item in items:
            counts[item["category"]] = counts.get(item["category"], 0) + 1
        categories = sorted(counts)
        # Store the ordered list so callback_data can just be an index —
        # avoids Telegram's 64-byte callback_data limit for long/unusual
        # category names instead of trying to encode the name itself.
        context.chat_data["categories"] = categories

        if not categories:
            await query.edit_message_text(
                "❌ လက်ရှိတွင် ဆေးများ မရှိသေးပါ။",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")]]),
            )
            return

        keyboard = [
            [InlineKeyboardButton(f"{cat.title()} ({counts[cat]}ဆေး)", callback_data=f"cat_{i}")]
            for i, cat in enumerate(categories)
        ]
        keyboard.append([InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")])

        await query.edit_message_text(
            "📊 *ဆေးအမျိုးအစား*:\nအောက်ပါ အမျိုးအစားများမှ ရွေးပါ:",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup(keyboard),
        )

    async def category_medicines(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()

        categories = context.chat_data.get("categories") or []
        try:
            index = int(query.data.split("_", 1)[1])
            category = categories[index]
        except (ValueError, IndexError):
            # Stale button from a previous session (bot restarted, cache
            # expired) — send them back to a fresh category list instead of
            # crashing on a dead index. query.answer() already happened
            # above, so render directly rather than going through
            # category_menu (which would try to answer it again).
            await self._render_categories(query, context)
            return

        try:
            items = await api.get_catalog()
        except api.AzuremedApiError as exc:
            await self._show_api_error(query, str(exc))
            return

        meds = [m for m in items if m["category"] == category]
        keyboard = [[InlineKeyboardButton(m["name"], callback_data=f"med_{m['id']}")] for m in meds]
        keyboard.append([InlineKeyboardButton("🔙 အမျိုးအစား", callback_data="categories")])
        keyboard.append([InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")])

        await query.edit_message_text(
            f"💊 *{category.title()}* ဆေးများ:\nအောက်ပါဆေးများမှ ရွေးပါ:",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup(keyboard),
        )

    async def medicine_info(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()

        medicine_id = int(query.data.split("_", 1)[1])
        try:
            items = await api.get_catalog()
        except api.AzuremedApiError as exc:
            await self._show_api_error(query, str(exc))
            return

        medicine = api.find_medicine(items, medicine_id)
        if not medicine:
            await query.edit_message_text(
                "❌ ဤဆေးကို ဝဘ်ဆိုဒ်တွင် ရှာမတွေ့တော့ပါ (ရောင်းကုန်သွားနိုင်သည်)။",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")]]),
            )
            return

        status_label = STATUS_LABELS.get(medicine["status"], medicine["status"])
        description = medicine.get("description") or "အသေးစိတ်အချက်အလက် မထည့်သွင်းရသေးပါ"

        info_text = f"""
💊 *{medicine['name']}*
🗂 {medicine['category'].title()}

📋 *အကြောင်းအရာ*:
{description}

💰 *စျေးနှုန်း*: {format_price(medicine['selling_price_ks'])}
📦 *လက်ကျန်*: {status_label}

👨‍⚕️ *ဆေးမသောက်မီ ဆရာဝန်နှင့် တိုင်ပင်ပါ*
        """

        keyboard = []
        if is_telegram_button_url(SITE_URL):
            keyboard.append(
                [InlineKeyboardButton("🛒 ဝဘ်ဆိုဒ်တွင် ကြည့်ရန်", url=cache_busted(f"{SITE_URL}/products/{medicine['id']}"))]
            )
        keyboard += [
            [InlineKeyboardButton("🔍 ဆက်ရှာ", callback_data="search")],
            [InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")],
        ]

        await query.edit_message_text(
            info_text, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(keyboard)
        )

    async def search_prompt(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()

        text = "💊 *ဆေးအမည်ရိုက်ပါ*\n\n*ဥပမာ: paracetamol, amoxicillin, ဗီတာမင်*\n\n❌ ပယ်ဖျက်ရန် /start"
        keyboard = [
            [InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")],
            [InlineKeyboardButton("❌ ပယ်ဖျက်", callback_data="cancel")],
        ]
        await query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(keyboard))
        self.user_sessions[update.effective_user.id] = {"step": "searching"}

    async def handle_search(self, update: Update, context: ContextTypes.DEFAULT_TYPE, text: str):
        context.chat_data.setdefault("messages", []).append(update.message.message_id)

        needle = text.lower().strip()
        needle = SEARCH_ALIASES.get(text.strip(), needle)

        try:
            items = await api.get_catalog()
        except api.AzuremedApiError as exc:
            await update.message.reply_text(str(exc))
            return

        terms = needle.split()
        matches = [
            m
            for m in items
            if any(
                term in m["name"].lower() or term in m["category"].lower() or term in (m.get("description") or "").lower()
                for term in terms
            )
        ]

        if not matches:
            keyboard = [
                [InlineKeyboardButton("🔍 ပြန်ရှာ", callback_data="search")],
                [InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")],
            ]
            await update.message.reply_text(
                "❌ ဆေး မတွေ့ရှိပါ။\nဆေးအမည် ပြန်ရိုက်ပါ\n*ဥပမာ: paracetamol*",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup(keyboard),
            )
            return

        if len(matches) == 1:
            medicine = matches[0]
            keyboard = [
                [InlineKeyboardButton(f"✅ {medicine['name']} ကြည့်ရန်", callback_data=f"med_{medicine['id']}")],
                [InlineKeyboardButton("🔍 ဆက်ရှာ", callback_data="search")],
                [InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")],
            ]
            await update.message.reply_text(
                f"✅ *တွေ့ရှိသည်*: {medicine['name']}\nဒီဆေး အချက်အလက် ကြည့်မလား?",
                parse_mode=ParseMode.MARKDOWN,
                reply_markup=InlineKeyboardMarkup(keyboard),
            )
            return

        keyboard = [[InlineKeyboardButton(m["name"], callback_data=f"med_{m['id']}")] for m in matches[:10]]
        keyboard.append([InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")])
        await update.message.reply_text(
            f"🔎 *{len(matches)} ခု တွေ့ရှိသည်* — ရွေးချယ်ပါ:",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup(keyboard),
        )

    # ---- Support tickets (writes into the site's customer_queries) -------

    async def ask_question_prompt(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()

        if not api.BOT_API_SECRET:
            await query.edit_message_text(
                "❌ ဤအင်္ဂါရပ်ကို လောလောဆယ် ပိတ်ထားပါသည်။",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")]]),
            )
            return

        text = "❓ *မေးလိုသည့်မေးခွန်းကို ရိုက်ထည့်ပါ*\n\nဝန်ထမ်းများက မကြာမီ ပြန်ဖြေပေးပါမည်။\n\n❌ ပယ်ဖျက်ရန် /start"
        keyboard = [[InlineKeyboardButton("❌ ပယ်ဖျက်", callback_data="cancel")]]
        await query.edit_message_text(text, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(keyboard))
        self.user_sessions[update.effective_user.id] = {"step": "asking"}

    async def handle_question(self, update: Update, context: ContextTypes.DEFAULT_TYPE, text: str):
        context.chat_data.setdefault("messages", []).append(update.message.message_id)
        user = update.effective_user

        try:
            ticket_id = await api.submit_support_query(user.id, user.username, text.strip())
        except api.AzuremedApiError as exc:
            await update.message.reply_text(str(exc))
            return

        keyboard = [
            [InlineKeyboardButton("🗂 ကျွန်ုပ်၏မေးခွန်းများ", callback_data="my_tickets")],
            [InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")],
        ]
        await update.message.reply_text(
            f"✅ *မေးခွန်း #{ticket_id} ပို့ပြီးပါပြီ*\nဝန်ထမ်းများက မကြာမီ ပြန်ဖြေပေးပါမည်။",
            parse_mode=ParseMode.MARKDOWN,
            reply_markup=InlineKeyboardMarkup(keyboard),
        )

    async def my_tickets(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()

        if not api.BOT_API_SECRET:
            await query.edit_message_text(
                "❌ ဤအင်္ဂါရပ်ကို လောလောဆယ် ပိတ်ထားပါသည်။",
                reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")]]),
            )
            return

        try:
            tickets = await api.get_my_tickets(update.effective_user.id)
        except api.AzuremedApiError as exc:
            await self._show_api_error(query, str(exc))
            return

        keyboard = [[InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")]]
        if not tickets:
            await query.edit_message_text(
                "🗂 သင့်တွင် မေးခွန်း မရှိသေးပါ။ \"❓ မေးခွန်းမေးရန်\" ကိုနှိပ်ပြီး မေးနိုင်ပါသည်။",
                reply_markup=InlineKeyboardMarkup(keyboard),
            )
            return

        lines = ["🗂 *ကျွန်ုပ်၏မေးခွန်းများ* (နောက်ဆုံး 10 ခု):\n"]
        for t in tickets:
            status = TICKET_STATUS_LABELS.get(t["status"], t["status"])
            lines.append(f"#{t['id']} — {t['subject']}\n{status}")
            if t.get("staff_response"):
                lines.append(f"↳ {t['staff_response']}")
            lines.append("")

        await query.edit_message_text(
            "\n".join(lines), parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(keyboard)
        )

    # ---- Misc --------------------------------------------------------------

    async def _show_api_error(self, query, message: str):
        keyboard = [
            [InlineKeyboardButton("🔄 ပြန်ကြိုးစားရန်", callback_data="main_menu")],
        ]
        await query.edit_message_text(message, reply_markup=InlineKeyboardMarkup(keyboard))

    async def show_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()

        help_text = """
ℹ️ *Bot အသုံးပြုနည်း*:

🔥 **အဓိက လုပ်ဆောင်ချက်များ**:
- 📊 ဆေးအမျိုးအစားအလိုက် ကြည့်ပါ
- 💊 ဆေးအမည် ရိုက်ပြီး ရှာပါ (စျေးနှုန်း/လက်ကျန် အသက်ဝင် ပြသ)
- ❓ မေးခွန်းမေးပြီး ဝန်ထမ်းထံ တိုက်ရိုက်ပို့ပါ
- 🧹 စကားအားလုံး ရှင်းပါ

⚠️ **သတိပေးချက်**:
- ဆရာဝန်ညွှန်ကြားချက်ကို လိုက်နာပါ
- Bot သည် ဆေးညွှန်းမပေးပါ — ဝန်ထမ်းများနှင့် တိုင်ပင်ရန် "❓ မေးခွန်းမေးရန်" ကို သုံးပါ
        """
        keyboard = [[InlineKeyboardButton("🏠 ပင်မစာ", callback_data="main_menu")]]
        await query.edit_message_text(help_text, parse_mode=ParseMode.MARKDOWN, reply_markup=InlineKeyboardMarkup(keyboard))

    async def button_handler(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()
        data = query.data
        context.chat_data.setdefault("messages", []).append(query.message.message_id)

        if data in ("main_menu", "cancel"):
            self.user_sessions.pop(update.effective_user.id, None)
            await self.main_menu(update, context)
        elif data == "clear":
            await self.super_clear(update, context)
        elif data == "categories":
            await self.category_menu(update, context)
        elif data == "search":
            await self.search_prompt(update, context)
        elif data == "ask_question":
            await self.ask_question_prompt(update, context)
        elif data == "my_tickets":
            await self.my_tickets(update, context)
        elif data == "help":
            await self.show_help(update, context)
        elif data.startswith("cat_"):
            await self.category_medicines(update, context)
        elif data.startswith("med_"):
            await self.medicine_info(update, context)
        elif data.startswith("answer_"):
            await self.answer_prompt(update, context)

    async def answer_prompt(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Staff tapped "✍️ Reply" on a "new question" alert (sent directly
        by the website, not this bot process — see
        app/api/support/telegram/route.ts on the azuremed-hub side). Same
        tap-then-type pattern as search/ask-a-question: this just starts
        the session, handle_text below does the actual submission once they
        type their answer. Anyone can tap this button (the bot has no way
        to hide it from a non-staff viewer), so the real authorization check
        happens server-side in submit_staff_answer — a rejection there
        surfaces as a plain error reply, not a crash.
        """
        query = update.callback_query
        await query.answer()
        ticket_id = int(query.data.split("_", 1)[1])
        self.user_sessions[update.effective_user.id] = {"step": "answering_ticket", "ticket_id": ticket_id}
        await context.bot.send_message(
            chat_id=update.effective_chat.id,
            text=f"✍️ Ticket #{ticket_id} အတွက် ဖြေကြားချက် ရိုက်ထည့်ပါ:",
        )

    async def handle_text(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        session = self.user_sessions.get(update.effective_user.id, {})
        step = session.get("step")
        if step == "searching":
            await self.handle_search(update, context, update.message.text)
        elif step == "asking":
            await self.handle_question(update, context, update.message.text)
        elif step == "answering_ticket":
            await self.handle_staff_answer(update, context, session["ticket_id"], update.message.text)
        # No active step — ignore stray text instead of guessing intent.

    async def handle_staff_answer(self, update: Update, context: ContextTypes.DEFAULT_TYPE, ticket_id: int, text: str):
        context.chat_data.setdefault("messages", []).append(update.message.message_id)
        self.user_sessions.pop(update.effective_user.id, None)
        user = update.effective_user

        try:
            answered_id = await api.submit_staff_answer(ticket_id, user.id, text.strip())
        except api.AzuremedApiError as exc:
            await update.message.reply_text(str(exc))
            return

        await update.message.reply_text(f"✅ Ticket #{answered_id} ကို ဖြေကြားပြီး၊ customer ထံ ပို့ပြီးပါပြီ။")

        await update.message.reply_text(f"✅ Ticket #{ticket_id} ကို ဖြေကြားပြီး၊ customer ထံ ပို့ပြီးပါပြီ။")

    async def on_error(self, update: object, context: ContextTypes.DEFAULT_TYPE):
        logger.exception("Unhandled error while processing update: %s", context.error)


def _acquire_single_instance_lock():
    """Refuse to start a second copy of this bot.

    Telegram only delivers updates to one long-polling connection per bot
    token — a second process doesn't error, it just silently steals a random
    share of updates into its own separate MedicineBot().user_sessions,
    which is exactly what caused "the search prompt shows but typing does
    nothing"/"the search bar doesn't appear" earlier: whichever process
    handled your button tap wasn't the one that received your next message.
    A Windows file lock (released automatically when this process exits or
    crashes, even without a clean Ctrl+C) turns that into a loud startup
    error instead of quiet, confusing data loss.
    """
    lock_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".bot.lock")
    lock_file = open(lock_path, "w")

    try:
        # msvcrt.locking locks a byte *range* of the file, and Windows won't
        # reliably lock a region past current end-of-file — on a freshly
        # truncated (0-byte) file the "lock" is a silent no-op and a second
        # process sails right through it. Write a placeholder byte first so
        # there's an actual byte at position 0 to hold the lock on. If
        # another process already holds that byte locked, this write itself
        # raises OSError (PermissionError on Windows) before the explicit
        # locking call below even runs — caught by the same handler.
        lock_file.write("locked")
        lock_file.flush()
        lock_file.seek(0)

        try:
            import msvcrt

            msvcrt.locking(lock_file.fileno(), msvcrt.LK_NBLCK, 1)
        except ImportError:
            import fcntl

            fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        print("❌ Another copy of this bot is already running (medicalbot/.bot.lock is held).")
        print("   Stop it first (Ctrl+C in its terminal) before starting a new one —")
        print("   running two copies at once makes Telegram split updates between them.")
        raise SystemExit(1)
    return lock_file  # keep this referenced for the process lifetime; closing releases the lock


def main():
    # Held for main()'s whole lifetime, which spans the blocking
    # run_polling() call below — the lock releases when this local variable
    # goes out of scope (process exit) or the process crashes.
    _lock_handle = _acquire_single_instance_lock()  # noqa: F841

    bot_token = os.getenv("BOT_TOKEN")
    if not bot_token:
        print("❌ BOT_TOKEN not found! Add it to medicalbot/.env:")
        print("BOT_TOKEN=your_token_here")
        return

    bot = MedicineBot()
    app = ApplicationBuilder().token(bot_token).build()

    app.add_handler(CommandHandler("start", bot.start))
    app.add_handler(CommandHandler("clear", bot.super_clear))
    app.add_handler(CallbackQueryHandler(bot.button_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, bot.handle_text))
    app.add_error_handler(bot.on_error)

    print("🤖 Medicine Bot Started!")
    print(f"🌐 Talking to azuremed-hub at: {api.API_BASE_URL}")
    if not api.BOT_API_SECRET:
        print("⚠️  BOT_API_SECRET not set — support-ticket features will be disabled.")
    print("📱 Commands: /start, /clear")

    app.run_polling(drop_pending_updates=True)


if __name__ == "__main__":
    main()
