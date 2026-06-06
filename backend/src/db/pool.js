/**
 * PostgreSQL Connection Pool
 * --------------------------
 * Creates one shared pg Pool for the backend.
 *
 * What this file does:
 * 1. Reads DATABASE_URL from environment variables loaded by dotenv in src/index.js
 *    or scripts/initDb.js.
 * 2. Fails fast if DATABASE_URL is missing, because auth routes cannot work
 *    without a database connection.
 * 3. Exports the pool so controllers/scripts can run parameterized SQL queries.
 *
 * Expected DATABASE_URL example:
 * postgres://postgres:password@localhost:5432/accountabuddy
 */
const { Pool } = require('pg')

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required.')
}

const databaseUrl = process.env.DATABASE_URL
const hasSslMode = databaseUrl.includes('sslmode=require')
const useSsl = process.env.DATABASE_SSL
  ? process.env.DATABASE_SSL !== 'false'
  : hasSslMode

const pool = new Pool({
  // Full PostgreSQL connection URL, including user, password, host, port, and database name.
  connectionString: databaseUrl,
  // Enables encrypted database connections. DATABASE_SSL=true forces SSL, DATABASE_SSL=false disables it,
  // and hosted URLs with sslmode=require enable it automatically.
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  // Maximum open database connections per backend instance. Keep this low for Cloud Run/serverless.
  max: Number(process.env.DATABASE_POOL_MAX || 5),
  // Close unused connections after 30 seconds so the app does not waste database connection slots.
  idleTimeoutMillis: 30_000,
  // Fail connection attempts after 10 seconds instead of hanging while the database is unavailable.
  connectionTimeoutMillis: 10_000,
})

module.exports = pool
