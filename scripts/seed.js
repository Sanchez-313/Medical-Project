// Seeds one demo user per role + a couple of sample medicines.
// Run with: npm run db:seed
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { FULL_CATALOG } = require("./fullCatalog");

const DEMO_USERS = [
  { name: "Owner Account", email: "owner@azuremedhub.com", password: "OwnerPass123!", role: "owner" },
  { name: "Staff Account", email: "staff@azuremedhub.com", password: "StaffPass123!", role: "staff" },
  { name: "Agent Account", email: "agent@azuremedhub.com", password: "AgentPass123!", role: "agent" },
];

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

const DEMO_REVIEWS = [
  { name: "Yan Naing", title: "Decent overall", comment: "Everything was fine, but delivery took a little longer than expected.", rating: 4, avatar_url: "/images/Customers/customer2.jpg" },
  { name: "Nilar Win", title: "Smooth experience", comment: "Website was easy to use and delivery tracking was helpful.", rating: 4, avatar_url: "/images/Customers/customer3.jpg" },
  { name: "Ko Zeya", title: "Great quality", comment: "The products were exactly as described and packaging was safe.", rating: 5, avatar_url: "/images/Customers/customer4.jpg" },
  { name: "Mya Thandar", title: "Good service", comment: "Easy checkout and responsive support. Will order again.", rating: 4, avatar_url: "/images/Customers/customer5.jpg" },
];

async function seedReviews() {
  const [[{ count }]] = await pool.query("SELECT COUNT(*) AS count FROM reviews");
  if (count > 0) {
    console.log("Reviews already seeded, skipping.");
    return;
  }
  for (const review of DEMO_REVIEWS) {
    await pool.query(
      `INSERT INTO reviews (name, title, comment, rating, avatar_url) VALUES (:name, :title, :comment, :rating, :avatar_url)`,
      review
    );
    console.log(`Seeded review: ${review.name}`);
  }
}

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
      `INSERT INTO medicines (name, sku, category, image_url, description, selling_price_ks, cost_price_ks, stock_qty, reorder_level, status, is_active)
       VALUES (:name, :sku, :category, :image_url, :description, :selling_price_ks, :cost_price_ks, :stock_qty, :reorder_level, :status, 1)
       ON DUPLICATE KEY UPDATE category = VALUES(category), image_url = VALUES(image_url), description = VALUES(description),
         selling_price_ks = VALUES(selling_price_ks), stock_qty = VALUES(stock_qty), status = VALUES(status), is_active = 1`,
      { ...med, status }
    );
  }
  console.log(`Seeded ${FULL_CATALOG.length} products from the real catalog.`);
}

async function main() {
  await seedUsers();
  await seedMedicines();
  await seedReviews();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
