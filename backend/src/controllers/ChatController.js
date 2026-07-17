/**
 * ChatController
 * --------------
 * Handles backend-persisted direct chats between two users.
 *
 * Stage 1 behavior:
 * - A chat starts from a submission when a logged-in user reaches out.
 * - The first message is required.
 * - Two users can have only one chat, regardless of submission.
 * - Only chat participants can list, read, or send messages.
 */

const pool = require('../db/pool')

const DEFAULT_MESSAGES_LIMIT = 50
const MAX_MESSAGES_LIMIT = 100

const STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
}

const CHAT_MESSAGES = {
  USER_REQUIRED: 'Logged-in user is required.',
  SUBMISSION_ID_REQUIRED: 'Submission id is required.',
  SUBMISSION_ID_INVALID: 'Submission id must be a positive integer.',
  SUBMISSION_NOT_FOUND: 'Submission was not found.',
  SELF_CHAT_NOT_ALLOWED: 'You cannot start a chat with your own submission.',
  MESSAGE_REQUIRED: 'Message is required.',
  CHAT_ID_REQUIRED: 'Chat id is required.',
  CHAT_ID_INVALID: 'Chat id must be a positive integer.',
  CHAT_NOT_FOUND: 'Chat was not found.',
  CHAT_FORBIDDEN: 'You do not have access to this chat.',
  LIMIT_INVALID: 'Limit must be a positive integer.',
  LIMIT_TOO_HIGH: `Limit cannot be greater than ${MAX_MESSAGES_LIMIT}.`,
  CREATE_FAILED: 'Could not create chat.',
  LIST_FAILED: 'Could not load chats.',
  MESSAGES_FAILED: 'Could not load messages.',
  SEND_FAILED: 'Could not send message.',
}

class ChatController {
  #createValidationError(message, status = STATUS.BAD_REQUEST) {
    const error = new Error(message)
    error.status = status
    return error
  }

  #normalizePositiveInteger(value) {
    if (value === null || value === undefined || value === '') {
      return null
    }

    return Number(value)
  }

  #normalizeMessage(value) {
    return typeof value === 'string' ? value.trim() : ''
  }

  #getOrderedUserIds(firstUserId, secondUserId) {
    const first = Number(firstUserId)
    const second = Number(secondUserId)

    return first < second
      ? { user1Id: first, user2Id: second }
      : { user1Id: second, user2Id: first }
  }

  #validateLoggedInUser(userId) {
    if (!userId) {
      throw this.#createValidationError(CHAT_MESSAGES.USER_REQUIRED)
    }
  }

  #validateSubmissionId(submissionId) {
    if (!submissionId) {
      throw this.#createValidationError(CHAT_MESSAGES.SUBMISSION_ID_REQUIRED)
    }

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      throw this.#createValidationError(CHAT_MESSAGES.SUBMISSION_ID_INVALID)
    }
  }

  #validateChatId(chatId) {
    if (!chatId) {
      throw this.#createValidationError(CHAT_MESSAGES.CHAT_ID_REQUIRED)
    }

    if (!Number.isInteger(chatId) || chatId <= 0) {
      throw this.#createValidationError(CHAT_MESSAGES.CHAT_ID_INVALID)
    }
  }

  #validateMessage(message) {
    if (!message) {
      throw this.#createValidationError(CHAT_MESSAGES.MESSAGE_REQUIRED)
    }
  }

  #normalizeMessagesLimit(value) {
    return value === undefined ? DEFAULT_MESSAGES_LIMIT : Number(value)
  }

  #validateMessagesLimit(limit) {
    if (!Number.isInteger(limit) || limit <= 0) {
      throw this.#createValidationError(CHAT_MESSAGES.LIMIT_INVALID)
    }

    if (limit > MAX_MESSAGES_LIMIT) {
      throw this.#createValidationError(CHAT_MESSAGES.LIMIT_TOO_HIGH)
    }
  }

  async #getSubmissionById(submissionId, client = pool) {
    const result = await client.query(
      `
        SELECT id, user_id, title
        FROM submissions
        WHERE id = $1
      `,
      [submissionId],
    )

    return result.rows[0]
  }

  async #getChatForUser(chatId, userId, client = pool) {
    const result = await client.query(
      `
        SELECT
          chats.id,
          chats.submission_id,
          chats.user1_id,
          chats.user2_id,
          chats.created_at,
          chats.updated_at,
          submissions.title AS submission_title,
          other_user.id AS other_user_id,
          other_user.username AS other_username
        FROM chats
        JOIN submissions ON submissions.id = chats.submission_id
        JOIN users AS other_user
          ON other_user.id = CASE
            WHEN chats.user1_id = $2 THEN chats.user2_id
            ELSE chats.user1_id
          END
        WHERE chats.id = $1
          AND (chats.user1_id = $2 OR chats.user2_id = $2)
      `,
      [chatId, userId],
    )

    return result.rows[0]
  }

  async #insertMessage({ chatId, senderId, message }, client = pool) {
    const result = await client.query(
      `
        INSERT INTO chat_messages (chat_id, sender_id, body)
        VALUES ($1, $2, $3)
        RETURNING id, chat_id, sender_id, body, created_at
      `,
      [chatId, senderId, message],
    )

    await client.query(
      `
        UPDATE chats
        SET updated_at = NOW()
        WHERE id = $1
      `,
      [chatId],
    )

    return result.rows[0]
  }

  async #createOrFindChat({ submissionId, currentUserId, message }) {
    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      const submission = await this.#getSubmissionById(submissionId, client)
      if (!submission) {
        throw this.#createValidationError(CHAT_MESSAGES.SUBMISSION_NOT_FOUND, STATUS.NOT_FOUND)
      }

      if (Number(submission.user_id) === Number(currentUserId)) {
        throw this.#createValidationError(CHAT_MESSAGES.SELF_CHAT_NOT_ALLOWED, STATUS.BAD_REQUEST)
      }

      const { user1Id, user2Id } = this.#getOrderedUserIds(currentUserId, submission.user_id)
      const chatResult = await client.query(
        `
          INSERT INTO chats (submission_id, user1_id, user2_id)
          VALUES ($1, $2, $3)
          ON CONFLICT (user1_id, user2_id)
          DO UPDATE SET updated_at = NOW()
          RETURNING *
        `,
        [submissionId, user1Id, user2Id],
      )
      const chat = chatResult.rows[0]
      const newMessage = await this.#insertMessage({ chatId: chat.id, senderId: currentUserId, message }, client)
      const chatForUser = await this.#getChatForUser(chat.id, currentUserId, client)

      await client.query('COMMIT')

      return { chat: chatForUser, message: newMessage }
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async create(req, res) {
    try {
      const currentUserId = req.userId
      const submissionId = this.#normalizePositiveInteger(req.body.submissionId)
      const message = this.#normalizeMessage(req.body.message)

      this.#validateLoggedInUser(currentUserId)
      this.#validateSubmissionId(submissionId)
      this.#validateMessage(message)

      const result = await this.#createOrFindChat({ submissionId, currentUserId, message })

      return res.status(STATUS.CREATED).json(result)
    } catch (error) {
      if ([STATUS.BAD_REQUEST, STATUS.FORBIDDEN, STATUS.NOT_FOUND].includes(error.status)) {
        return res.status(error.status).json({ error: error.message })
      }

      console.error('Chat creation failed:', error)
      return res.status(STATUS.SERVER_ERROR).json({ error: CHAT_MESSAGES.CREATE_FAILED })
    }
  }

  async list(req, res) {
    try {
      const currentUserId = req.userId
      this.#validateLoggedInUser(currentUserId)

      const result = await pool.query(
        `
          SELECT
            chats.id,
            chats.submission_id,
            chats.user1_id,
            chats.user2_id,
            chats.created_at,
            chats.updated_at,
            submissions.title AS submission_title,
            other_user.id AS other_user_id,
            other_user.username AS other_username,
            latest_message.body AS last_message_body,
            latest_message.created_at AS last_message_created_at
          FROM chats
          JOIN submissions ON submissions.id = chats.submission_id
          JOIN users AS other_user
            ON other_user.id = CASE
              WHEN chats.user1_id = $1 THEN chats.user2_id
              ELSE chats.user1_id
            END
          LEFT JOIN LATERAL (
            SELECT body, created_at
            FROM chat_messages
            WHERE chat_messages.chat_id = chats.id
            ORDER BY created_at DESC, id DESC
            LIMIT 1
          ) AS latest_message ON true
          WHERE chats.user1_id = $1 OR chats.user2_id = $1
          ORDER BY chats.updated_at DESC, chats.id DESC
        `,
        [currentUserId],
      )

      return res.status(STATUS.OK).json({ chats: result.rows })
    } catch (error) {
      if (error.status === STATUS.BAD_REQUEST) {
        return res.status(STATUS.BAD_REQUEST).json({ error: error.message })
      }

      console.error('Chat listing failed:', error)
      return res.status(STATUS.SERVER_ERROR).json({ error: CHAT_MESSAGES.LIST_FAILED })
    }
  }

  async listMessages(req, res) {
    try {
      const currentUserId = req.userId
      const chatId = this.#normalizePositiveInteger(req.params.id)
      const limit = this.#normalizeMessagesLimit(req.query.limit)

      this.#validateLoggedInUser(currentUserId)
      this.#validateChatId(chatId)
      this.#validateMessagesLimit(limit)

      const chat = await this.#getChatForUser(chatId, currentUserId)
      if (!chat) {
        return res.status(STATUS.NOT_FOUND).json({ error: CHAT_MESSAGES.CHAT_NOT_FOUND })
      }

      const result = await pool.query(
        `
          SELECT
            chat_messages.id,
            chat_messages.chat_id,
            chat_messages.sender_id,
            chat_messages.body,
            chat_messages.created_at,
            users.username AS sender_username
          FROM chat_messages
          JOIN users ON users.id = chat_messages.sender_id
          WHERE chat_messages.chat_id = $1
          ORDER BY chat_messages.created_at ASC, chat_messages.id ASC
          LIMIT $2
        `,
        [chatId, limit],
      )

      return res.status(STATUS.OK).json({ chat, messages: result.rows })
    } catch (error) {
      if (error.status === STATUS.BAD_REQUEST) {
        return res.status(STATUS.BAD_REQUEST).json({ error: error.message })
      }

      console.error('Message listing failed:', error)
      return res.status(STATUS.SERVER_ERROR).json({ error: CHAT_MESSAGES.MESSAGES_FAILED })
    }
  }

  async sendMessage(req, res) {
    try {
      const currentUserId = req.userId
      const chatId = this.#normalizePositiveInteger(req.params.id)
      const message = this.#normalizeMessage(req.body.message)

      this.#validateLoggedInUser(currentUserId)
      this.#validateChatId(chatId)
      this.#validateMessage(message)

      const chat = await this.#getChatForUser(chatId, currentUserId)
      if (!chat) {
        return res.status(STATUS.NOT_FOUND).json({ error: CHAT_MESSAGES.CHAT_NOT_FOUND })
      }

      const newMessage = await this.#insertMessage({ chatId, senderId: currentUserId, message })

      return res.status(STATUS.CREATED).json({ message: newMessage })
    } catch (error) {
      if (error.status === STATUS.BAD_REQUEST) {
        return res.status(STATUS.BAD_REQUEST).json({ error: error.message })
      }

      console.error('Message send failed:', error)
      return res.status(STATUS.SERVER_ERROR).json({ error: CHAT_MESSAGES.SEND_FAILED })
    }
  }
}

module.exports = new ChatController()
