CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  age INTEGER NOT NULL,
  gender TEXT NOT NULL,
  timezone TEXT NOT NULL,
  description TEXT,
  goals TEXT,
  looking_for1 TEXT,
  looking_for2 TEXT,
  looking_for3 TEXT,
  looking_for4 TEXT,
  looking_for5 TEXT,
  availability TEXT NOT NULL,
  communication TEXT NOT NULL,
  constraints TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT submissions_age_check CHECK (
    age IS NULL OR (age >= 13 AND age <= 120)
  )
);

CREATE INDEX IF NOT EXISTS submissions_user_id_idx
ON submissions(user_id);

-- for sorting by newest in debug mode
CREATE INDEX IF NOT EXISTS submissions_created_at_idx 
ON submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS submissions_timezone_idx
ON submissions(timezone);

CREATE INDEX IF NOT EXISTS submissions_gender_idx
ON submissions(gender);

CREATE INDEX IF NOT EXISTS submissions_age_idx
ON submissions(age);

CREATE INDEX IF NOT EXISTS submissions_availability_idx
ON submissions(availability);

CREATE INDEX IF NOT EXISTS communication_idx
ON submissions(communication);