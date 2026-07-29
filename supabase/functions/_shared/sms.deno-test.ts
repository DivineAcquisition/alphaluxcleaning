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

const GHL_CONFIGURED = { GHL_PIT_TOKEN: 'pit-test', GHL_LOCATION_ID: 'loc-test' };
const GHL_ABSENT = {
  GHL_PIT_TOKEN: null,
  GHL_PRIVATE_INTEGRATION_TOKEN: null,
  GOHIGHLEVEL_API_KEY: null,
  GHL_LOCATION_ID: null,
  GOHIGHLEVEL_LOCATION_ID: null,
};

const base = { to: '+15551234567', message: 'hi' };

Deno.test('public rail never falls back to GoHighLevel', () => {
  withEnv({ ...GHL_CONFIGURED, INTERNAL_SMS_OPENPHONE_FAILOVER: null }, () => {
    assertEquals(providerOrder({ ...base, channel: 'public' }), ['openphone']);
  });
});

Deno.test('internal rail sends through GoHighLevel with OpenPhone failover', () => {
  withEnv({ ...GHL_CONFIGURED, INTERNAL_SMS_OPENPHONE_FAILOVER: null }, () => {
    assertEquals(providerOrder({ ...base, channel: 'internal' }), ['ghl', 'openphone']);
  });
});

Deno.test('internal rail can be made strictly GoHighLevel-only', () => {
  withEnv({ ...GHL_CONFIGURED, INTERNAL_SMS_OPENPHONE_FAILOVER: 'false' }, () => {
    assertEquals(providerOrder({ ...base, channel: 'internal' }), ['ghl']);
  });
});

Deno.test('internal rail falls back to OpenPhone when GHL is not configured', () => {
  withEnv({ ...GHL_ABSENT, INTERNAL_SMS_OPENPHONE_FAILOVER: null }, () => {
    assertEquals(providerOrder({ ...base, channel: 'internal' }), ['openphone']);
  });
});

Deno.test('messages with no rail keep the legacy order', () => {
  withEnv(GHL_CONFIGURED, () => {
    assertEquals(providerOrder(base), ['openphone', 'ghl']);
  });
});

Deno.test('callers can still opt out of GHL entirely', () => {
  withEnv(GHL_CONFIGURED, () => {
    assertEquals(providerOrder({ ...base, enableGhl: false }), ['openphone']);
    assertEquals(
      providerOrder({ ...base, channel: 'internal', enableFallback: false }),
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
