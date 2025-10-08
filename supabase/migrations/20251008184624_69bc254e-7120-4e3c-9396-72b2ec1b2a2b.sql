-- Make customer fields nullable for referral-only accounts
-- This allows creating lightweight customer records with just email + first name
ALTER TABLE customers 
  ALTER COLUMN phone DROP NOT NULL,
  ALTER COLUMN address DROP NOT NULL,
  ALTER COLUMN state DROP NOT NULL,
  ALTER COLUMN name DROP NOT NULL;

-- Set sensible defaults
ALTER TABLE customers 
  ALTER COLUMN phone SET DEFAULT '',
  ALTER COLUMN address SET DEFAULT '',
  ALTER COLUMN state SET DEFAULT 'TX',
  ALTER COLUMN name SET DEFAULT '';