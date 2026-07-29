-- Attach each state number's OpenPhone phoneNumberId (PN…) to the registry.
--
-- `openPhoneSend()` prefers phoneNumberId over a raw `from` number, and
-- the id is the more durable identifier: sending by E.164 depends on the
-- workspace still owning that exact string, and fails with a 403
-- ("does the OpenPhone workspace own …?") the moment a number is ported,
-- renamed or moved between workspaces. The id survives all of that.
--
-- Values read from GET https://api.openphone.com/v1/phone-numbers against
-- the live AlphaLux workspace; all four numbers matched the seeded
-- registry exactly. The phone_e164 guard means that if ops has since
-- rotated a number, the stale id is simply not attached rather than being
-- bound to the wrong line.

UPDATE public.sms_state_numbers
   SET openphone_phone_id = 'PNadeAhbSz', updated_at = now()
 WHERE state_code = 'NJ' AND phone_e164 = '+15512399444';

UPDATE public.sms_state_numbers
   SET openphone_phone_id = 'PNcr6AQ0lI', updated_at = now()
 WHERE state_code = 'TX' AND phone_e164 = '+19725590223';

UPDATE public.sms_state_numbers
   SET openphone_phone_id = 'PNixdsFI1a', updated_at = now()
 WHERE state_code = 'CA' AND phone_e164 = '+13233005528';

UPDATE public.sms_state_numbers
   SET openphone_phone_id = 'PNmbaQkeHE', updated_at = now()
 WHERE state_code = 'NY' AND phone_e164 = '+16313668565';
