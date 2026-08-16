// Applies config/azuremed_schema.sql against the configured MySQL server.
// Run with: npm run db:schema
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "..", "config", "azuremed_schema.sql"), "utf8");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "",
    multipleStatements: true,
  });

  // schema.sql's own "CREATE DATABASE IF NOT EXISTS" + "USE" only take
  // effect once the `sql` blob below runs — the pre-emptive ALTER right
  // after this needs a database selected on the connection already, hence
  // this explicit USE (harmless no-op once schema.sql's own USE runs too).
  await connection.query(`USE ${process.env.DB_NAME || "azuremed_hub"}`).catch(() => {});

  // store_settings.free_delivery_threshold_ks needs to exist BEFORE the
  // schema.sql blob below runs, because that blob's own INSERT IGNORE seed
  // row references it by name — on this already-existing table (unlike a
  // fresh install, where CREATE TABLE below already includes the column)
  // that INSERT fails with "Unknown column" otherwise. ER_NO_SUCH_TABLE is
  // swallowed for the fresh-install case, where CREATE TABLE hasn't run yet.
  try {
    await connection.query(`
      ALTER TABLE store_settings
        ADD COLUMN IF NOT EXISTS free_delivery_threshold_ks INT NOT NULL DEFAULT 30000 AFTER delivery_fee_ks
    `);
  } catch (error) {
    if (error.code !== "ER_NO_SUCH_TABLE") throw error;
  }

  await connection.query(sql);

  // `CREATE TABLE IF NOT EXISTS` in azuremed_schema.sql is a no-op against a
  // table that already exists, so columns added to the schema file after a
  // table's first creation never actually land on a live database — this
  // silently happened with orders.payment_proof_url/payment_status. Until
  // there's a real migration system, additive column changes get an
  // idempotent ALTER here (MariaDB/MySQL 8+ both support IF NOT EXISTS on
  // ADD COLUMN) so re-running this script actually catches existing DBs up.
  await connection.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS payment_proof_url TEXT NULL AFTER status,
      ADD COLUMN IF NOT EXISTS payment_status ENUM('not_required','pending_review','confirmed','rejected') NOT NULL DEFAULT 'not_required' AFTER payment_proof_url
  `);
  // 2FA/TOTP feature (Security page + /api/account/2fa/*) was removed
  // entirely — drop the now-dead columns rather than leave them as unused
  // schema cruft. Safe to re-run: DROP COLUMN IF EXISTS no-ops once gone.
  await connection.query(`
    ALTER TABLE users
      DROP COLUMN IF EXISTS totp_secret,
      DROP COLUMN IF EXISTS totp_enabled
  `);
  await connection.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS delivery_fee_ks INT NOT NULL DEFAULT 0 AFTER tax_ks,
      ADD COLUMN IF NOT EXISTS discount_ks INT NOT NULL DEFAULT 0 AFTER delivery_fee_ks,
      ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50) NULL AFTER discount_ks,
      MODIFY COLUMN status ENUM('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending'
  `);

  // users.role: 'owner' -> 'admin' rename. A straight MODIFY COLUMN to an
  // ENUM that no longer includes 'owner' would fail/truncate any existing
  // 'owner' rows, so this widens the ENUM first, migrates the data, then
  // narrows it — each step is safe to re-run (no-op once already migrated).
  await connection.query(`
    ALTER TABLE users MODIFY COLUMN role ENUM('owner','admin','staff','agent','user') NOT NULL DEFAULT 'user'
  `);
  await connection.query(`UPDATE users SET role = 'admin' WHERE role = 'owner'`);
  await connection.query(`
    ALTER TABLE users MODIFY COLUMN role ENUM('admin','staff','agent','user') NOT NULL DEFAULT 'user'
  `);

  await connection.query(`
    ALTER TABLE advertisements
      ADD COLUMN IF NOT EXISTS description VARCHAR(500) NULL AFTER title,
      ADD COLUMN IF NOT EXISTS title_my VARCHAR(255) NULL AFTER description,
      ADD COLUMN IF NOT EXISTS description_my VARCHAR(500) NULL AFTER title_my
  `);

  // reviews.user_id: lets a real customer submit/edit their own testimonial
  // (as opposed to the original owner-seeded demo rows, which stay NULL).
  // Adding a UNIQUE + FK constraint isn't reliably supported with
  // "IF NOT EXISTS" across MySQL/MariaDB versions, so check
  // information_schema first rather than assume the SQL guard works.
  await connection.query(`
    ALTER TABLE reviews ADD COLUMN IF NOT EXISTS user_id INT NULL AFTER id
  `);
  const [[{ hasConstraint }]] = await connection.query(`
    SELECT COUNT(*) AS hasConstraint
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND CONSTRAINT_NAME = 'uq_reviews_user'
  `);
  if (!hasConstraint) {
    await connection.query(`
      ALTER TABLE reviews
        ADD CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        ADD CONSTRAINT uq_reviews_user UNIQUE (user_id)
    `);
  }
  const [[{ hasCheckConstraint }]] = await connection.query(`
    SELECT COUNT(*) AS hasCheckConstraint
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews' AND CONSTRAINT_NAME = 'chk_reviews_rating'
  `);
  if (!hasCheckConstraint) {
    await connection.query(`ALTER TABLE reviews ADD CONSTRAINT chk_reviews_rating CHECK (rating BETWEEN 1 AND 5)`);
  }

  // medicalbot Telegram bot integration — lets a support query submitted via
  // Telegram (no website session) still record who actually asked. See the
  // CREATE TABLE customer_queries comment above and lib/telegramBot.ts.
  await connection.query(`
    ALTER TABLE customer_queries
      ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT NULL AFTER responded_at,
      ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(255) NULL AFTER telegram_chat_id,
      ADD INDEX IF NOT EXISTS idx_customer_queries_telegram_chat (telegram_chat_id)
  `);

  // staff_todos/staff_attendance (personal task list + check-in/out on the
  // Staff dashboard) — feature removed, not just hidden. Real DROP rather
  // than IF EXISTS-guarded no-op elsewhere: dropping is inherently one-shot,
  // there's nothing to re-run idempotently once the tables are gone.
  await connection.query(`DROP TABLE IF EXISTS staff_todos`);
  await connection.query(`DROP TABLE IF EXISTS staff_attendance`);

  // Cart stock reservations (hold stock for 15 min after add-to-cart without
  // touching the real stock_qty count) — see the comments on these columns
  // in azuremed_schema.sql and lib/cartReservation.ts.
  await connection.query(`
    ALTER TABLE medicines ADD COLUMN IF NOT EXISTS reserved_qty INT NOT NULL DEFAULT 0 AFTER stock_qty
  `);
  await connection.query(`
    ALTER TABLE cart_items
      ADD COLUMN IF NOT EXISTS reserved_until DATETIME NULL AFTER qty,
      ADD INDEX IF NOT EXISTS idx_cart_reserved_until (reserved_until)
  `);

  await connection.end();
  console.log("Schema applied.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
