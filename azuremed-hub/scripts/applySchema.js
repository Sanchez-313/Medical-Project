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
  await connection.end();
  console.log("Schema applied.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
