-- Call seed admin user function to set up the admin account
SELECT public.handle_new_user() FROM auth.users WHERE email = 'info@alphaluxclean.com' LIMIT 1;

-- Enable leaked password protection for security
UPDATE auth.config SET 
  password_min_length = 8,
  hibp_enabled = true,
  password_requirement = 'letters_digits',
  enable_signup = true;