# AlphaLuxClean Promotional System

## Overview
Comprehensive promotional and reward system offering customers two distinct paths:
1. **20% OFF First Clean** - Instant discount, no commitment
2. **Bundle & Reward** - Commit to 2 months Weekly/Bi-Weekly, earn 30% OFF Deep Clean code

## Key Features

### 1. Promotional Banner
**Location**: Top of `/start` and booking pages  
**Components**: `src/components/booking/PromotionalBanner.tsx`

**Copy**:
- Headline: "Get 20% off your first clean."
- Subtext: "Commit to 2 months of Weekly or Bi-Weekly service and we'll reward you with a 30% off Deep Clean code—shown instantly in your booking flow."

### 2. Deep Clean Recommendation Modal
**Trigger**: When user selects Weekly or Bi-Weekly frequency  
**Component**: `src/components/booking/DeepCleanPromptModal.tsx`

**Flow**:
1. Question: "When was your home last professionally deep cleaned?"
   - Options: "Within 2 months" / "Over 2 months ago" / "Not sure"
2. If answer is "Over 2 months" or "Not sure":
   - Show recommendation panel with two offers
3. If answer is "Within 2 months":
   - Show success message, continue booking

**Offer Details**:

#### Option A: Bundle & Save
- Keep Weekly/Bi-Weekly for 2 months
- Get 30% OFF Deep Clean code immediately
- Code valid for 90 days
- Display: Badge "Best Value"
- Button: "Choose Bundle & Save 30% on Deep Clean Later"

#### Option B: Simple Start
- Take 20% OFF first clean now
- No commitment required
- Button: "Take 20% Off My First Clean"

### 3. Reward Code System

#### Code Generation
**Format**: `ALC-DC30-{6-char-base36}` (e.g., `ALC-DC30-K7Q8XM`)
**Service**: `src/services/rewards.ts`

**Properties**:
- Single-use (max_redemptions = 1)
- 30% discount on Deep Clean only
- 90-day expiration from issue date
- Linked to specific customer ID

#### Code Storage
**Database Tables**:
- `promo_codes`: Stores reward codes with metadata
- `customers`: Stores customer's reward code and expiry
- `bookings`: Tracks which codes were issued with bookings

**Stripe Customer Metadata**:
```json
{
  "recurrence_plan": "WEEKLY|BIWEEKLY",
  "first_clean_discount_used": "false",
  "deep_clean_reward_code": "ALC-DC30-xxxxx",
  "deep_clean_reward_expires": "2025-07-01T00:00:00Z",
  "last_deep_clean_answer": "OVER_2M",
  "commitment_months": "2"
}
```

### 4. Reward Display

#### During Booking (Step 3)
**Component**: `src/components/booking/RewardSummaryCard.tsx`

Displays:
- Reward badge with "30% OFF"
- Large, copyable code
- Expiry date with calendar icon
- Usage instructions
- Copy button with success feedback

#### Post-Booking Confirmation
**Location**: `/order-confirmation` page  
**Component**: Integrated into OrderConfirmation.tsx

Shows reward card at top of confirmation with:
- Celebration emoji and "Reward Unlocked!" headline
- Code in large, emphasized display
- Copy functionality
- Reminder about email delivery

### 5. Email Notifications

#### Reward Email
**Edge Function**: `supabase/functions/send-reward-email/index.ts`  
**From**: AlphaLuxClean <no-reply@info.alphaluxclean.com>  
**Subject**: "Your 30% Deep Clean Reward 🎁"

**Content**:
- Thank you message with frequency plan confirmation
- Reward code in prominent display box
- How to use instructions (bullet points)
- CTA button: "Book Your Deep Clean Now"
- Expiry date reminder
- Help contact information

**Booking URL**: `{APP_URL}/guest-booking?promo={code}&service=deep-clean&utm_source=email&utm_medium=reward`

### 6. Stripe Integration

#### Customer Creation/Update
**Edge Function**: `supabase/functions/create-stripe-customer/index.ts`

**Features**:
- Creates new customer or retrieves existing by email
- Updates customer details (name, phone, address)
- Attaches payment method
- Sets default payment method
- Stores promotional metadata

**Usage**:
```typescript
import { ensureStripeCustomer } from '@/services/stripe-customer';

const result = await ensureStripeCustomer(
  {
    email: 'customer@example.com',
    name: 'John Doe',
    phone: '555-1234',
    address: {
      line1: '123 Main St',
      city: 'Houston',
      state: 'TX',
      postal_code: '77001'
    }
  },
  paymentMethodId,
  {
    recurrence_plan: 'WEEKLY',
    first_clean_discount_used: 'false',
    deep_clean_reward_code: 'ALC-DC30-ABC123',
    commitment_months: '2'
  }
);
```

### 7. Analytics Tracking

#### Events Tracked
**Edge Function**: `supabase/functions/track-promo-analytics/index.ts`

**Event Types**:
1. `BOOKING_CONFIRMED`
   - frequency
   - promo_applied
   - reward_unlocked

2. `REWARD_ISSUED`
   - code
   - expiry
   - frequency commitment

3. `PROMO_APPLIED`
   - PROMO_FIRST20

4. `DEEP_CLEAN_RECOMMENDED`
   - shown: true/false
   - user_choice: BUNDLE|FIRST20|SKIP

**Destinations**:
- Zapier webhook (for Google Sheets integration)
- Supabase attribution_events table

### 8. Promo Code Management

#### 20% First Clean Discount
**Service**: `src/services/promotions.ts`

**Code**: `PROMO_FIRST20` (transient, no DB storage)  
**Type**: Percentage discount  
**Amount**: 20% off subtotal (pre-tax)  
**Restrictions**:
- One-time use per customer
- Tracked via `customers.first_clean_discount_used`

**Functions**:
```typescript
// Check if eligible
const canApply = await canApplyFirst20(customerEmail);

// Apply discount
const result = await applyFirst20Discount(subtotalCents, customerEmail);

// Mark as used
await markFirstCleanUsed(customerEmail);
```

#### 30% Deep Clean Reward
**Service**: `src/services/rewards.ts`

**Functions**:
```typescript
// Issue reward
const reward = await issueDeepClean30Reward(
  customerId,
  customerEmail,
  frequency
);

// Validate code
const isValid = await validateRewardCode(code);

// Redeem code
await redeemRewardCode(code, bookingId, customerId);
```

### 9. Edge Cases Handled

#### User Changes Frequency
**Before commitment**: If user toggles from Weekly/Bi-Weekly back to Monthly/One-time before payment:
- Remove bundle commitment
- Do not issue reward code
- Clear reward display

#### Promo Code Switching
**User picks FIRST20 then switches to bundle**:
- Allow switch
- Mark PROMO_FIRST20 as not applied
- Issue REWARD_DC30 on payment confirmation

#### Abandoned Booking
**User sees reward preview but doesn't pay**:
- Show placeholder: "Will be generated after payment"
- Only create actual code after successful payment
- Prevents code abuse

#### Redemption Restrictions
**REWARD_DC30 usage**:
- Cannot be used on same initial booking
- Must be used on separate Deep Clean booking
- Enforced via service_type_restriction field

### 10. User Interface Flow

```
Step 1: Service Selection
└─> Show Promotional Banner
└─> User selects home size, service type, frequency
└─> If Weekly/Bi-Weekly selected:
    └─> Trigger Deep Clean Prompt Modal
    └─> User answers last clean question
    └─> If recommendation shown:
        ├─> User picks Bundle → Generate reward code, show summary
        └─> User picks 20% OFF → Apply discount, track choice

Step 2: Details & Scheduling
└─> User enters service date, time, address, contact
└─> Summary sidebar shows selected promo/reward

Step 3: Payment Confirmation
└─> If bundle: Display RewardSummaryCard with code
└─> If 20% OFF: Display discount summary
└─> User confirms booking
└─> Redirect to order confirmation

Order Confirmation Page
└─> Show success message
└─> If reward issued: Display reward card with copy functionality
└─> Send confirmation email
└─> If reward: Send reward email
└─> Track analytics events
```

### 11. Database Schema

#### Customers Table Additions
```sql
ALTER TABLE customers ADD COLUMN
  recurrence_plan TEXT DEFAULT 'ONE_TIME',
  first_clean_discount_used BOOLEAN DEFAULT FALSE,
  deep_clean_reward_code TEXT,
  deep_clean_reward_expires TIMESTAMP WITH TIME ZONE,
  last_deep_clean_answer TEXT,
  metadata JSONB DEFAULT '{}'::jsonb;
```

#### Promo Codes Table Additions
```sql
ALTER TABLE promo_codes ADD COLUMN
  service_type_restriction TEXT,
  issued_to_customer_id UUID REFERENCES customers(id),
  reward_type TEXT;
```

#### Bookings Table Additions
```sql
ALTER TABLE bookings ADD COLUMN
  promo_applied TEXT,
  reward_code_issued TEXT,
  commitment_months INTEGER,
  deep_clean_recommendation_shown BOOLEAN DEFAULT FALSE,
  deep_clean_last_answer TEXT;
```

### 12. Configuration

#### Feature Flags
```typescript
const config = {
  enableRecurringBundle: true, // Master switch
  first20PercentEnabled: true,
  deepClean30Enabled: true,
  rewardExpiryDays: 90,
  commitmentMonths: 2
};
```

#### Environment Variables Required
- `STRIPE_SECRET_KEY` - Stripe API key
- `RESEND_API_KEY` - Resend email API key
- `ZAPIER_WEBHOOK_URL` - Analytics webhook URL
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key

### 13. Testing Checklist

- [ ] 20% promo never stacks with 30% reward on same transaction
- [ ] Reward code only issued after successful payment
- [ ] Deep clean modal appears for Weekly/Bi-Weekly only
- [ ] Reward code displayed correctly in booking flow
- [ ] Stripe customer created/updated with metadata
- [ ] Reward code saved in DB and Stripe
- [ ] Reward email sent via Resend
- [ ] Redemption enforces Deep Clean service only
- [ ] Redemption checks expiry date
- [ ] Analytics events tracked to Zapier
- [ ] Code copy functionality works
- [ ] Edge cases handled (frequency changes, abandonments)

### 14. QA Scenarios

#### Scenario 1: First-time customer, 20% discount
1. Select standard clean, one-time
2. Modal should NOT appear
3. Apply 20% discount manually via promo input
4. Complete booking
5. Verify discount applied to invoice

#### Scenario 2: Recurring customer, bundle reward
1. Select Weekly frequency
2. Modal appears with question
3. Answer "Over 2 months ago"
4. Select "Bundle & Save"
5. See reward code immediately
6. Complete booking
7. Verify code in confirmation page
8. Check email for reward notification
9. Verify Stripe metadata

#### Scenario 3: Code redemption
1. Start new booking
2. Select Deep Clean service
3. Enter reward code at payment
4. Verify 30% discount applied
5. Complete booking
6. Verify code marked as redeemed
7. Attempt to use code again - should fail

### 15. Monitoring & Analytics

**Key Metrics**:
- Reward issuance rate
- Reward redemption rate
- Bundle vs 20% selection rate
- Deep Clean recommendation conversion
- Average time to redemption
- Code expiry rate (unused codes)

**Zapier Integration**:
All events automatically sent to Google Sheets for tracking:
- Raw_Events sheet with timestamp, event type, and full payload
- Automatic categorization by event type
- Real-time dashboard updates

### 16. Support & Troubleshooting

#### Common Issues

**Issue**: Reward code not generated
- Check Weekly/Bi-Weekly frequency selected
- Verify payment completed successfully
- Check edge function logs

**Issue**: Email not received
- Verify Resend API key configured
- Check customer email validity
- Review send-reward-email function logs

**Issue**: Code doesn't work at redemption
- Verify code not expired
- Check service type is Deep Clean
- Confirm code not already redeemed
- Verify customer ID matches

#### Edge Function Logs
Access logs at:
- `https://supabase.com/dashboard/project/{project_id}/functions/{function_name}/logs`

Functions:
- create-stripe-customer
- send-reward-email
- track-promo-analytics

## Security Considerations

1. **Reward codes are customer-specific** - issued_to_customer_id prevents code sharing
2. **Single-use enforcement** - max_redemptions = 1
3. **Expiry validation** - 90-day window enforced
4. **Service type restriction** - Deep Clean only
5. **Metadata encryption** - Sensitive data stored in Stripe encrypted at rest
6. **RLS policies** - Database-level security on all promo tables

## Maintenance

### Quarterly Review
- Analyze reward redemption rates
- Review expired codes
- Update promotional copy if needed
- Check analytics pipeline health

### Monthly Tasks
- Review edge function performance
- Check email delivery rates
- Verify Stripe metadata sync
- Monitor code generation uniqueness

---

**Last Updated**: 2025-01-13  
**Version**: 1.0  
**Maintained By**: AlphaLuxClean Development Team
