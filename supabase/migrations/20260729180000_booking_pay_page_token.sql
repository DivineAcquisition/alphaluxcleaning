-- Tokenized customer pay link.
--
-- The pay page previously addressed bookings by raw UUID:
-- /pay/<bookings.id>, loaded straight from the browser with the anon
-- key. Anyone holding or guessing a booking id could read the
-- customer's name, service address and price — and booking ids travel
-- through webhooks, logs and admin URLs. The id is an identifier, not a
-- credential.
--
-- This column is the credential: 20 random bytes (160 bits) hex-encoded
-- to 40 characters, minted per booking and only ever sent to the
-- customer who owns it. The pay page reads through the
-- `booking-pay-page` edge function, which is the only thing that can
-- exchange a token for booking details.
--
-- Revocation is `set pay_page_token = null` — same pattern the manage
-- token uses. No expiry column on purpose: the link has to keep working
-- until the customer actually pays, and an expired deposit link is a
-- support ticket rather than a security win.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS pay_page_token text;

-- Partial unique index: many bookings have no token, but a live token
-- must resolve to exactly one booking.
CREATE UNIQUE INDEX IF NOT EXISTS bookings_pay_page_token_key
  ON public.bookings (pay_page_token)
  WHERE pay_page_token IS NOT NULL;

COMMENT ON COLUMN public.bookings.pay_page_token IS
  'Bearer credential for /pay/<token>. 40-char hex (20 random bytes). Revoke by setting NULL. Never expose alongside the booking id.';
