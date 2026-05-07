/**
 * User Model
 * ----------
 * Represents a user in the system.
 * Legacy plain JavaScript user shape.
 * AuthController now persists users in PostgreSQL instead of this in-memory model.
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
