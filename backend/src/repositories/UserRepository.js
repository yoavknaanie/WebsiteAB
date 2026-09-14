const pool = require('../db/pool')

class UserRepository {
  async getUserByEmail(email) {
    const result = await pool.query(
      'SELECT id, username, email, password_hash FROM users WHERE email = $1',
      [email],
    )

    return result.rows[0]
  }

  async isUsernameTaken(username) {
    const result = await pool.query(
      'SELECT 1 FROM users WHERE username = $1',
      [username],
    )

    return result.rowCount > 0
  }

  async create({ username, email, passwordHash }) {
    const result = await pool.query(
      `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, created_at
      `,
      [username, email, passwordHash],
    )

    return result.rows[0]
  }
}

module.exports = new UserRepository()
