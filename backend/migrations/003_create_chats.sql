CREATE TABLE IF NOT EXISTS chats (
  id BIGSERIAL PRIMARY KEY,
  submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  user1_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user2_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chats_ordered_users_check CHECK (user1_id < user2_id),
  CONSTRAINT chats_unique_user_pair UNIQUE (user1_id, user2_id)
);

CREATE INDEX IF NOT EXISTS chats_user1_id_idx
ON chats(user1_id);

CREATE INDEX IF NOT EXISTS chats_user2_id_idx
ON chats(user2_id);

CREATE INDEX IF NOT EXISTS chats_submission_id_idx
ON chats(submission_id);

CREATE INDEX IF NOT EXISTS chats_updated_at_idx
ON chats(updated_at DESC);

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGSERIAL PRIMARY KEY,
  chat_id BIGINT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
  sender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chat_messages_body_not_empty_check CHECK (LENGTH(TRIM(body)) > 0)
);

CREATE INDEX IF NOT EXISTS chat_messages_chat_id_created_at_idx
ON chat_messages(chat_id, created_at ASC);

CREATE INDEX IF NOT EXISTS chat_messages_sender_id_idx
ON chat_messages(sender_id);
