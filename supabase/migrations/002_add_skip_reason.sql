-- Add skip_reason column to sessions table
ALTER TABLE sessions ADD COLUMN skip_reason text;

-- Add check constraint for valid skip reasons
ALTER TABLE sessions ADD CONSTRAINT sessions_skip_reason_check
  CHECK (skip_reason IS NULL OR skip_reason IN ('life', 'tired', 'injured', 'didnt_want_to'));
