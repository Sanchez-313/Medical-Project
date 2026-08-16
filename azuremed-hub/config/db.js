const mysql = require("mysql2/promise");

/**
 * Single shared connection pool for the whole app. mysql2/promise pools are
 * safe to reuse across requests/serverless invocations — never call
 * createPool() per-request, that's what exhausts MySQL's max_connections
 * under load.
 *
 * In Next.js dev mode, this module gets re-evaluated on hot reload (on
 * nearly every file save, not just edits to this file), so a plain
 * module-level `const pool = mysql.createPool(...)` creates a BRAND NEW
 * 10-connection pool on every reload — the old pool's connections are never
 * closed, they just sit open server-side until MySQL's wait_timeout expires
 * (often hours). Over a long dev session that silently exhausts
 * max_connections ("Too many connections"). Caching on globalThis survives
 * the module re-evaluation, the same fix used for lib/teachableMachine.ts's
 * tfjs model singleton.
 */
/** @type {{ __azuremedDbPool?: import("mysql2/promise").Pool }} */
const globalForDb = globalThis;

/** @type {import("mysql2/promise").Pool} */
const pool =
  globalForDb.__azuremedDbPool ||
  mysql.createPool({
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

if (!globalForDb.__azuremedDbPool) {
  globalForDb.__azuremedDbPool = pool;
}

module.exports = pool;
