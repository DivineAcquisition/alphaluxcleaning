

## Problem: Balance Invoice Not Being Created

### Root Cause

The `confirm-booking-payment` function invokes `send-balance-invoice` as a **non-blocking, fire-and-forget** call (lines 93-104). It uses `.then()` without `await`, meaning the function returns its HTTP response immediately. In Deno edge functions, **the runtime terminates the isolate after the response is sent**, killing any pending promises — so the `send-balance-invoice` call never actually executes.

```text
confirm-booking-payment timeline:
  1. Update booking → ✅
  2. Fire webhook (non-blocking) → promise created but not awaited
  3. Fire send-balance-invoice (non-blocking) → promise created but not awaited
  4. Return HTTP response → ✅
  5. Deno kills isolate → ❌ both promises die
```

### Fix

Make the `send-balance-invoice` invocation **awaited** so it completes before the function returns. The webhook can remain non-blocking since it's less critical, but the invoice creation must complete.

**File: `supabase/functions/confirm-booking-payment/index.ts`**

Change the balance invoice invocation from fire-and-forget to `await`:

```typescript
// BEFORE (broken - promise killed on isolate shutdown):
supabase.functions.invoke('send-balance-invoice', { ... })
  .then((result) => { ... });

// AFTER (awaited - completes before response):
const invoiceResult = await supabase.functions.invoke('send-balance-invoice', {
  body: { bookingId: booking.id, daysUntilDue: 7 }
});
if (invoiceResult.error) {
  console.error("Balance invoice error:", invoiceResult.error);
} else {
  console.log("Balance invoice sent successfully:", invoiceResult.data);
}
```

Also await the webhook call for the same reason — it's currently dying too:

```typescript
const webhookResult = await supabase.functions.invoke('enhanced-booking-webhook-v2', {
  body: { booking_id: booking.id, action: 'payment_confirmed' }
});
```

This is a single-file fix to `confirm-booking-payment/index.ts`. No other changes needed — the `send-balance-invoice` function logic itself is correct.

