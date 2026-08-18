import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { pickOpenPhoneFrom } from './openphone.ts';

Deno.test('prefers the OpenPhone phoneNumberId over E.164', () => {
  assertEquals(
    pickOpenPhoneFrom({ from: '+16313668565', phoneNumberId: 'PNmbaQkeHE' }),
    ['PNmbaQkeHE', '+16313668565'],
  );
});

Deno.test('skips a blank phoneNumberId and keeps E.164', () => {
  assertEquals(
    pickOpenPhoneFrom({ from: '+15512399444', phoneNumberId: '  ' }),
    ['+15512399444'],
  );
});

Deno.test('dedupes identical from values', () => {
  assertEquals(
    pickOpenPhoneFrom({ from: 'PNadeAhbSz', phoneNumberId: 'PNadeAhbSz' }),
    ['PNadeAhbSz'],
  );
});
