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
  throw new Error('DATABASE_URL is required. Add it to backend/.env before starting the server.')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

module.exports = pool
