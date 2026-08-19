import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { pickOpenPhoneFrom } from './openphone.ts';

Deno.test('prefers the OpenPhone phoneNumberId over E.164', () => {
  assertEquals(
    pickOpenPhoneFrom({ from: '+15551239999', phoneNumberId: 'PNtestPhoneId' }),
    ['PNtestPhoneId', '+15551239999'],
  );
});

Deno.test('skips a blank phoneNumberId and keeps E.164', () => {
  assertEquals(
    pickOpenPhoneFrom({ from: '+15551234444', phoneNumberId: '  ' }),
    ['+15551234444'],
  );
});

Deno.test('does not invent a from number when none is provided', () => {
  assertEquals(pickOpenPhoneFrom({}), []);
});
