# Infrastructure Audit & Optimization Plan - January 2025

## Current State Analysis

### Database Tables (95+ Total)
**🟢 KEEP - Core Business (25 tables)**
- `orders` - Main booking records
- `bookings` - Scheduled appointments  
- `subcontractors` - Contractor profiles
- `subcontractor_applications` - Application management
- `subcontractor_job_assignments` - Job dispatch
- `subcontractor_payments` - Payout system
- `commercial_estimates` - B2B lead capture
- `referral_codes` & `referral_uses` - Referral system
- `profiles` & `user_roles` - Basic user management
- `customer_profiles` - Customer data
- `expansion_waitlist` - Growth tracking
- `job_tracking` - Service tracking
- `customer_notifications` - User communication
- `performance_metrics` - Contractor analytics

**🔴 REMOVE - Non-Essential (70+ tables)**
- `companies`, `contracts`, `deals` - Complex CRM
- `bi_reports`, `bi_insights_cache` - Advanced analytics  
- `automation_*` tables (5) - Complex automation
- `payroll_*` tables - Advanced payroll
- `integration_configs` - Complex integrations
- `security_*` tables (3) - Over-engineered security
- `domain_routing_config` - Multi-domain complexity
- `contractor_webhooks_outbox` - Complex webhook system

### Edge Functions (17 Current)
**🟢 KEEP - Essential (8 functions)**
- `create-payment-intent` - Stripe payments
- `enhanced-booking-webhook-v2` - Core booking flow
- `send-subcontractor-updates` - Contractor communication
- `join-expansion-waitlist` - Growth feature
- `send-referral-email` - Referral system
- `auth-email-handler` - Authentication
- `send-admin-job-notification` - Job management
- `get-order-details` - Order management

**🔴 REMOVE - Non-Essential (9 functions)**  
- `sync-to-airtable` - External sync
- `send-booking-transaction-to-zapier` - Marketing automation
- `enhanced-booking-webhook` - Duplicate functionality
- `get-stripe-config` - Unnecessary abstraction
- `update-order-details` - Can be handled client-side
- `create-test-subcontractor` - Development tool
- `send-order-entry-webhook` - Complex webhook

### UI Pages (52+ Current)
**🟢 KEEP - Core Pages (15 pages)**
- `ModernBooking` - Main booking flow
- `SubcontractorHub` - Contractor management
- `JobAssignments` - Job dispatch
- `CommercialEstimates` - B2B estimates
- `SubcontractorApplication` - Contractor onboarding
- `OrderStatus` - Customer tracking
- `PaymentSuccess` - Payment confirmation
- `AdminDashboard` - Basic admin
- `ContractorDashboard` - Contractor portal
- `CustomerPortalDashboard` - Customer portal

**🔴 REMOVE - Non-Essential (35+ pages)**
- Multiple booking variations (`LegacyBooking`, `NewBooking`)
- Advanced CRM pages (`CustomerMobilePortal`, `ReviewsPortal`)
- Complex admin pages (`TierPerformanceAnalytics`, `SecurityCenter`)
- Duplicate contractor interfaces (`SubcontractorMobile`, `SubcontractorDesktopPortal`)

## Optimization Implementation Plan

### Phase 1: Database Cleanup ✅ READY
Remove 70+ non-essential tables while preserving core business data.

### Phase 2: Edge Function Optimization ✅ READY  
Remove 9 non-essential functions, keep 8 core functions.

### Phase 3: UI Consolidation ✅ READY
Remove 35+ redundant pages, keep 15 core pages.

### Phase 4: Component Cleanup
Consolidate booking components, remove variations.

### Phase 5: Final Testing
Ensure core business flows work correctly.

## Expected Results
- **70% infrastructure reduction**
- **Maintained revenue features** (booking, payments, referrals, commercial)
- **Simplified maintenance**
- **Improved performance**
- **Reduced complexity**

---
*Generated: January 9, 2025*