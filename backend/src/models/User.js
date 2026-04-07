/**
 * User Model
 * ----------
 * Represents a user in the system.
 * Responsible for defining the structure of a user object.
 * In a future step, this will handle saving/loading from PostgreSQL.
 * For now, users are stored in memory (reset on server restart).
 */

class User {
  constructor(email, password) {
    this.id = Date.now().toString()
    this.email = email
    this.password = password // plain text for now — bcrypt hashing added later
    this.createdAt = new Date()
  }
}

module.exports = User
