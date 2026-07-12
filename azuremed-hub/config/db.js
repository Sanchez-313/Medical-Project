const mysql = require("mysql2/promise");

/**
 * Single shared connection pool for the whole app. mysql2/promise pools are
 * safe to reuse across requests/serverless invocations — never call
 * createPool() per-request, that's what exhausts MySQL's max_connections
 * under load.
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "",
  database: process.env.DB_NAME || "azuremed_hub",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  namedPlaceholders: true,
  dateStrings: true,
});

module.exports = pool;
