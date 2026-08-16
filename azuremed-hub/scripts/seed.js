// Seeds one demo user per role + a couple of sample medicines.
// Run with: npm run db:seed
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { FULL_CATALOG } = require("./fullCatalog");

// No demo accounts here on purpose — dravenkai2@gmail.com is the real admin
// account, and Oak Soe Moe is the real staff account. The seeded
// owner@azuremedhub.com / staff@azuremedhub.com / agent@azuremedhub.com
// placeholders were all deleted (each had zero associated orders/sales/etc,
// so no cleanup needed beyond the row itself).
const DEMO_USERS = [];

// Earlier hand-picked 14-item placeholder catalog — superseded by the real
// 89-product FULL_CATALOG (ported from ProductList.js). Deactivated, not
// deleted: some of these ids are referenced by real order/sale history from
// earlier testing, so a hard DELETE would violate foreign keys.
const OLD_PLACEHOLDER_SKUS = [
  "MED-ENG-001", "MED-ENG-002", "MED-ENG-003", "MED-ENG-004", "MED-ENG-005", "MED-ENG-006", "MED-ENG-007",
  "MED-MYA-001", "MED-MYA-002", "MED-MYA-003",
  "MED-EQP-001", "MED-EQP-002", "MED-EQP-003", "MED-EQP-004",
];

async function deactivateOldPlaceholderCatalog() {
  const [result] = await pool.query(
    `UPDATE medicines SET is_active = 0 WHERE sku IN (${OLD_PLACEHOLDER_SKUS.map(() => "?").join(",")})`,
    OLD_PLACEHOLDER_SKUS
  );
  console.log(`Deactivated ${result.affectedRows} old placeholder medicines.`);
}

// No demo testimonials here on purpose either — /api/reviews now has a real
// customer-submission flow (purchase-gated, see TestimonialForm.tsx), and
// the 4 fake stock-photo demo reviews this used to seed were deleted.

async function seedUsers() {
  for (const demo of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(demo.password, 12);
    await pool.query(
      `INSERT INTO users (name, email, password_hash, role)
       VALUES (:name, :email, :password_hash, :role)
       ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = VALUES(role)`,
      { name: demo.name, email: demo.email, password_hash: passwordHash, role: demo.role }
    );
    console.log(`Seeded ${demo.role}: ${demo.email} / ${demo.password}`);
  }
}

async function seedMedicines() {
  await deactivateOldPlaceholderCatalog();

  for (const med of FULL_CATALOG) {
    const status = med.stock_qty <= med.reorder_level ? "low" : "normal";
    await pool.query(
      // stock_qty/reorder_level/status are deliberately absent from ON
      // DUPLICATE KEY UPDATE — those are live inventory state, not catalog
      // metadata. Including stock_qty here once silently reset every
      // product's real stock back to its seed default on every re-run of
      // `npm run db:seed`, wiping out real purchase-driven decrements. Only
      // genuinely static catalog fields get overwritten on conflict; the
      // stock/reorder/status columns are set on first INSERT only.
      `INSERT INTO medicines (name, sku, category, image_url, description, selling_price_ks, cost_price_ks, stock_qty, reorder_level, status, is_active)
       VALUES (:name, :sku, :category, :image_url, :description, :selling_price_ks, :cost_price_ks, :stock_qty, :reorder_level, :status, 1)
       ON DUPLICATE KEY UPDATE category = VALUES(category), image_url = VALUES(image_url), description = VALUES(description),
         selling_price_ks = VALUES(selling_price_ks), is_active = 1`,
      { ...med, status }
    );
  }
  console.log(`Seeded ${FULL_CATALOG.length} products from the real catalog.`);
}

async function main() {
  await seedUsers();
  await seedMedicines();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
