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
  await connection.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(64) NULL AFTER is_active,
      ADD COLUMN IF NOT EXISTS totp_enabled TINYINT(1) NOT NULL DEFAULT 0 AFTER totp_secret
  `);
  await connection.query(`
    ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS delivery_fee_ks INT NOT NULL DEFAULT 0 AFTER tax_ks,
      ADD COLUMN IF NOT EXISTS discount_ks INT NOT NULL DEFAULT 0 AFTER delivery_fee_ks,
      ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50) NULL AFTER discount_ks,
      MODIFY COLUMN status ENUM('pending','confirmed','processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending'
  `);

  await connection.end();
  console.log("Schema applied.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
