

# Remove All "Bay Area Cleaning Pros" References

## Overview
There are **55+ active source files** (excluding old migrations) that still contain references to "Bay Area Cleaning Professionals", "Bay Area Cleaning Pros", "BACP", or related branding. These need to be replaced with "AlphaLux Clean" branding throughout. The existing AlphaLux Stripe keys (`STRIPE_SECRET_KEY_ALPHALUX`, `STRIPE_PUBLISHABLE_KEY_ALPHALUX`, `STRIPE_WEBHOOK_SECRET_ALPHALUX`) will be retained as-is.

## What Changes

All old brand references will be replaced as follows:

| Old Reference | New Reference |
|---|---|
| Bay Area Cleaning Professionals | AlphaLux Clean |
| Bay Area Cleaning Pros | AlphaLux Clean |
| Bay Area Cleaning | AlphaLux Clean |
| BACP Club | AlphaLux Club |
| Serving Bay Area | Premium Cleaning Service |
| bayareacleaningpros.com emails | alphaluxclean.com emails |
| Bacp2025!- (passwords) | AlphaLux2025!- |
| SALT_BACP_2024 | SALT_ALPHALUX_2024 |
| BACP_ADMIN_2024 | ALPHALUX_ADMIN_2024 |
| Old Supabase logo URLs (kqoezqzogleaaupjzxch) | Updated or removed |

## Files to Update

### Frontend Components (src/)
1. **src/components/dashboard/DashboardHeader.tsx** - Title, alt text, "Serving Bay Area"
2. **src/components/HourlyBookingInterface.tsx** - "BACP Club" references (x4)
3. **src/components/booking/PriceSummaryCard.tsx** - "BACP Club" references (x2)
4. **src/components/booking/LegacyBookingFlow.tsx** - "BACP Club" reference
5. **src/components/TermsOfServiceAgreement.tsx** - "BACP Club" terms
6. **src/components/dashboard/PricingCalculator.tsx** - Comment about Bay Area pricing
7. **src/pages/SubcontractorApplication.tsx** - Brand references (x3)
8. **src/pages/SubcontractorApplicationThankYou.tsx** - Thank you text
9. **src/pages/ContractorAuth.tsx** - Subtitle text
10. **src/pages/CustomerPortalHome.tsx** - Subtitle text
11. **src/pages/SubcontractorJobAcceptance.tsx** - Hardcoded old Supabase URLs

### Edge Functions (supabase/functions/)
12. **send-user-invite/index.ts** - Company name, email subject
13. **send-custom-message/index.ts** - Email subject, heading, sign-off
14. **send-application-response/index.ts** - Email subject
15. **send-tier-upgrade-notification/index.ts** - Logo URL, footer text
16. **send-assignment-invite/index.ts** - Footer text
17. **send-monthly-performance-summary/index.ts** - Body text, sign-off
18. **send-subcontractor-welcome/index.ts** - Welcome title
19. **create-customer-account/index.ts** - Welcome notification, temp password
20. **create-google-calendar-event/index.ts** - Description, display name
21. **assignment-response/index.ts** - Footer text
22. **create-membership-checkout/index.ts** - "BACP Club" product names
23. **create-test-admin/index.ts** - Secret codes
24. **create-subcontractor-direct/index.ts** - Salt string
25. **fix-admin-users/index.ts** - Passwords
26. **send-booking-transaction-to-zapier/index.ts** - "BACP Data" key
27. **send-admin-job-notification/index.ts** - Hardcoded old Supabase URL
28. **enhanced-job-assignment/index.ts** - Hardcoded old Supabase URL
29. **_shared/email-templates/customer-feedback-notification.tsx** - Sign-off

Plus any additional files found in the remaining 45 matches.

### Database (migration needed)
- Update `webhook_configurations.organization_name` default from 'Bay Area Cleaning Pros' to 'AlphaLux Clean'
- Update `email_settings.from_name` default from 'Bay Area Cleaning Pros' to 'AlphaLux Clean'
- Update any stored template text in `notification_templates` table

## What Will NOT Change
- The AlphaLux Stripe keys remain as configured
- All Supabase connection settings stay the same
- Old migration files (read-only history, won't be touched)
- The `supabase/config.toml` project ID stays as-is

## Technical Details

### Approach
- Batch-edit all frontend components first, then edge functions, then deploy all updated functions
- Run a single database migration to update default values and any stored brand text
- Replace hardcoded old Supabase project URLs (`kqoezqzogleaaupjzxch`) with dynamic references where possible
- All edge functions referencing the old brand will be redeployed after updates

### Estimated Scope
- ~30 files with text replacements
- ~25 edge functions to redeploy
- 1 database migration for stored defaults/templates

