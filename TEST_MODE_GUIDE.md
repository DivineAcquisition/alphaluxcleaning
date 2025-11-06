# Test/Demo Mode Guide

## Overview
Test Mode allows you to test the complete booking flow without processing real Square payments. All bookings are created in the database and all webhooks fire normally, making it perfect for testing integrations.

## How to Enable Test Mode

### Method 1: Via Dev Test Webhooks Page
1. Navigate to `/dev-test-webhooks`
2. Look for the "Test/Demo Mode" card at the top
3. Toggle the switch to enable test mode
4. The page will reload to apply changes

### Method 2: Via Browser Console
```javascript
localStorage.setItem('booking_test_mode', 'true');
location.reload();
```

### Method 3: Via URL Parameter (Future Enhancement)
You can add support for `?test_mode=true` in the URL to automatically enable it.

## What Happens in Test Mode

### ✅ What Still Works:
- Booking creation in database
- Customer creation/lookup
- All webhook triggers fire:
  - `booking-confirmed` webhook
  - `recurring-upgrade` webhook
  - Zapier webhooks
  - GoHighLevel webhooks
- Booking status updates
- Recurring booking logic
- Email notifications (if configured)
- Database triggers and functions

### 🚫 What Gets Bypassed:
- Square card tokenization
- Square payment processing
- Actual money transfers
- Card validation
- Payment intent creation

## Visual Indicators

When test mode is active, you'll see:

1. **Global Banner**: Orange banner at the top of every page with "Test Mode Active" message
2. **Checkout Page Alert**: Prominent alert explaining payment is bypassed
3. **Button Text**: Changed from "Reserve My Spot" to "Create Test Booking"
4. **Success Message**: Shows "TEST MODE: Booking created (no payment processed)"

## Testing Scenarios

### Scenario 1: One-Time Booking
1. Enable test mode
2. Go through booking flow normally
3. Select one-time frequency
4. On checkout page, fill out contact info (no card required)
5. Click "Create Test Booking"
6. Verify booking appears in database
7. Check webhook logs to confirm webhook fired

### Scenario 2: Direct Recurring Booking
1. Enable test mode
2. Start booking flow
3. Select recurring frequency (weekly/bi-weekly/monthly)
4. Complete to checkout
5. Create booking
6. Verify `booking-confirmed` webhook with recurring metadata

### Scenario 3: One-Time → Recurring Upgrade
1. Enable test mode
2. Select one-time frequency
3. On Summary page, use recurring upsell card to upgrade
4. Verify `recurring-upgrade` webhook fires
5. Complete checkout
6. Verify `booking-confirmed` webhook fires with upgrade metadata

## How to Disable Test Mode

### Method 1: Via Dev Test Webhooks Page
1. Navigate to `/dev-test-webhooks`
2. Toggle the test mode switch off
3. Page will reload

### Method 2: Via Browser Console
```javascript
localStorage.removeItem('booking_test_mode');
location.reload();
```

### Method 3: Clear Browser Data
Clear localStorage for the site.

## Technical Implementation

### Files Modified:
- `src/hooks/useTestMode.ts` - Hook to check test mode state
- `src/components/admin/TestModeToggle.tsx` - UI toggle component
- `src/components/admin/TestModeBanner.tsx` - Global banner
- `src/pages/book/Checkout.tsx` - Payment bypass logic
- `src/App.tsx` - Banner integration

### How It Works:
1. Test mode state stored in `localStorage` (key: `booking_test_mode`)
2. `useTestMode` hook reads this value across components
3. Checkout page conditionally skips Square API calls
4. Mock payment data is created to satisfy flow requirements
5. Booking status set directly to 'confirmed' in test mode
6. All webhook logic continues to execute normally

## Webhook Testing

Test mode is perfect for testing webhook integrations:

1. **Configure Webhook URL**: Go to `/dev-test-webhooks` and configure your webhook URL
2. **Enable Test Mode**: Toggle test mode on
3. **Complete Test Booking**: Go through the booking flow
4. **Monitor Webhooks**: 
   - Check Webhook Health Monitor on `/dev-test-webhooks`
   - View webhook delivery logs in database
   - Check your receiving endpoint (Zapier, Make, etc.)
5. **Verify Payload**: Ensure all expected data is present in webhook payload

## Troubleshooting

### Test Mode Not Working
- Check browser console for errors
- Verify `localStorage.getItem('booking_test_mode')` returns `'true'`
- Try clearing cache and reloading
- Check that all files are properly deployed

### Webhooks Not Firing
- Test mode doesn't affect webhooks - they should fire normally
- Check webhook configuration in `/dev-test-webhooks`
- View edge function logs for webhook errors
- Verify booking was created in database

### Booking Status Wrong
- In test mode, bookings should be set to 'confirmed' automatically
- Check the booking record in the database
- Verify the checkout logic is correctly handling test mode

## Production Considerations

### Security
- Test mode uses localStorage, which is browser-local
- No server-side state changes needed
- Safe to use in production for testing

### Best Practices
1. **Always disable after testing** - Don't leave it on accidentally
2. **Use descriptive test data** - Use emails like `test@example.com`
3. **Clean up test bookings** - Regularly remove test bookings from database
4. **Document test results** - Keep notes on what you tested

### Future Enhancements
- Admin-only test mode toggle (requires authentication)
- Automatic test data cleanup
- Test mode indicator in database records
- Test mode analytics/tracking
- Configurable test mode behaviors
