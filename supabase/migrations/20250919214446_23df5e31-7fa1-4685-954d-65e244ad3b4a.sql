-- Simply enable leaked password protection for security
ALTER SYSTEM SET
  'auth.password_min_length' = '8';