// Seeds one demo user per role + a couple of sample medicines.
// Run with: npm run db:seed
require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

const DEMO_USERS = [
  { name: "Owner Account", email: "owner@azuremedhub.com", password: "OwnerPass123!", role: "owner" },
  { name: "Staff Account", email: "staff@azuremedhub.com", password: "StaffPass123!", role: "staff" },
  { name: "Agent Account", email: "agent@azuremedhub.com", password: "AgentPass123!", role: "agent" },
];

const DEMO_MEDICINES = [
  { name: "Enervon-C", sku: "MED-ENV-C", category: "Vitamins", selling_price_ks: 3500, cost_price_ks: 2200, stock_qty: 120, reorder_level: 30 },
  { name: "Gentalene-C Cream", sku: "MED-GTL-C", category: "Topical", selling_price_ks: 4200, cost_price_ks: 2800, stock_qty: 15, reorder_level: 20 },
  { name: "Oral Rehydration Salts (ORS)", sku: "MED-ORS-01", category: "First Aid", selling_price_ks: 900, cost_price_ks: 400, stock_qty: 200, reorder_level: 40 },
];

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
  for (const med of DEMO_MEDICINES) {
    const status = med.stock_qty <= med.reorder_level ? "low" : "normal";
    await pool.query(
      `INSERT INTO medicines (name, sku, category, selling_price_ks, cost_price_ks, stock_qty, reorder_level, status)
       VALUES (:name, :sku, :category, :selling_price_ks, :cost_price_ks, :stock_qty, :reorder_level, :status)
       ON DUPLICATE KEY UPDATE selling_price_ks = VALUES(selling_price_ks), stock_qty = VALUES(stock_qty), status = VALUES(status)`,
      { ...med, status }
    );
    console.log(`Seeded medicine: ${med.name}`);
  }
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
