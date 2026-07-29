// Pins the comms rail rules described in docs/COMMS_ROUTING.md.
//
// The provider order is the whole point of the internal/public split, and
// it is the kind of thing a well-meaning "let's add a fallback everywhere"
// change would quietly undo. Run with: npm test

import { assertEquals } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { channelFromBookingSource, providerOrder } from './sms.ts';

function withEnv(vars: Record<string, string | null>, run: () => void) {
  const previous: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(vars)) {
    previous[key] = Deno.env.get(key);
    if (value === null) Deno.env.delete(key);
    else Deno.env.set(key, value);
  }
  try {
    run();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
  }
}

const NO_FAILOVER_OVERRIDE = { INTERNAL_SMS_OPENPHONE_FAILOVER: null };

const base = { to: '+15551234567', message: 'hi' };
const GHL_UP = true;
const GHL_DOWN = false;

Deno.test('public rail never falls back to GoHighLevel', () => {
  withEnv(NO_FAILOVER_OVERRIDE, () => {
    assertEquals(providerOrder({ ...base, channel: 'public' }, GHL_UP), ['openphone']);
    // Even with GHL unavailable the answer is the same — never reroute.
    assertEquals(providerOrder({ ...base, channel: 'public' }, GHL_DOWN), ['openphone']);
  });
});

Deno.test('internal rail sends through GoHighLevel with OpenPhone failover', () => {
  withEnv(NO_FAILOVER_OVERRIDE, () => {
    assertEquals(providerOrder({ ...base, channel: 'internal' }, GHL_UP), ['ghl', 'openphone']);
  });
});

Deno.test('internal rail can be made strictly GoHighLevel-only', () => {
  withEnv({ INTERNAL_SMS_OPENPHONE_FAILOVER: 'false' }, () => {
    assertEquals(providerOrder({ ...base, channel: 'internal' }, GHL_UP), ['ghl']);
  });
});

Deno.test('internal rail falls back to OpenPhone when GHL is not configured', () => {
  withEnv(NO_FAILOVER_OVERRIDE, () => {
    assertEquals(providerOrder({ ...base, channel: 'internal' }, GHL_DOWN), ['openphone']);
  });
});

Deno.test('messages with no rail keep the legacy order', () => {
  withEnv(NO_FAILOVER_OVERRIDE, () => {
    assertEquals(providerOrder(base, GHL_UP), ['openphone', 'ghl']);
    assertEquals(providerOrder(base, GHL_DOWN), ['openphone']);
  });
});

Deno.test('callers can still opt out of GHL entirely', () => {
  withEnv(NO_FAILOVER_OVERRIDE, () => {
    assertEquals(providerOrder({ ...base, enableGhl: false }, GHL_UP), ['openphone']);
    assertEquals(
      providerOrder({ ...base, channel: 'internal', enableFallback: false }, GHL_UP),
      ['openphone'],
    );
  });
});

Deno.test('booking source maps to the rail that owns it', () => {
  assertEquals(channelFromBookingSource('internal_booking'), 'internal');
  assertEquals(channelFromBookingSource('INTERNAL_BOOKING'), 'internal');
  assertEquals(channelFromBookingSource('booking_funnel'), 'public');
  assertEquals(channelFromBookingSource(null), 'public');
});
