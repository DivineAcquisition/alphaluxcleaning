# Phase 1B: Edge Functions Migration Inventory
## Bay Area Cleaning Pros - Complete Edge Functions Package
### Generated: 2025-01-04

## Overview
This document inventories all 46 edge functions currently deployed in the Bay Area Cleaning Pros Supabase project, organized by functionality and dependencies.

---

## 🔐 Authentication & User Management Functions

### auth-email-handler
- **Purpose**: Handles password reset and user authentication emails
- **Dependencies**: Resend API
- **Config**: `verify_jwt = false`
- **Domain Impact**: All subdomains (authentication flows)

### google-oauth-callback  
- **Purpose**: Handles Google OAuth authentication callbacks
- **Dependencies**: Google OAuth API, Google Client ID/Secret
- **Config**: `verify_jwt = true`
- **Domain Impact**: connect.bayareacleaningpros.com

### google-oauth-initiate
- **Purpose**: Initiates Google OAuth authentication flow
- **Dependencies**: Google Client ID
- **Config**: `verify_jwt = false` 
- **Domain Impact**: connect.bayareacleaningpros.com

### send-password-reset
- **Purpose**: Sends password reset emails to users
- **Dependencies**: Resend API
- **Config**: `verify_jwt = false`
- **Domain Impact**: All subdomains

### send-user-invite
- **Purpose**: Sends user invitation emails
- **Dependencies**: Resend API, Base email template
- **Config**: Not specified (default)
- **Domain Impact**: admin.bayareacleaningpros.com

---

## 💰 Payment & Financial Functions

### create-payment
- **Purpose**: Creates Stripe payment sessions
- **Dependencies**: Stripe Secret Key
- **Config**: `verify_jwt = false`
- **Domain Impact**: booking.bayareacleaningpros.com, pay.bayareacleaningpros.com

### send-payment-confirmation  
- **Purpose**: Sends payment confirmation emails
- **Dependencies**: Resend API, Payment confirmation template
- **Config**: Not specified (default)
- **Domain Impact**: pay.bayareacleaningpros.com

### customer-portal
- **Purpose**: Creates Stripe customer portal sessions
- **Dependencies**: Stripe Secret Key
- **Config**: Not specified (default)
- **Domain Impact**: members.bayareacleaningpros.com

### create-membership-checkout
- **Purpose**: Creates membership subscription checkout sessions
- **Dependencies**: Stripe Secret Key
- **Config**: Not specified (default)
- **Domain Impact**: members.bayareacleaningpros.com

### process-auto-charge
- **Purpose**: Processes automatic recurring charges
- **Dependencies**: Stripe Secret Key
- **Config**: Not specified (default)
- **Domain Impact**: Backend automation

---

## 🧹 Subcontractor Management Functions

### submit-subcontractor-application
- **Purpose**: Processes subcontractor applications
- **Dependencies**: Database write access
- **Config**: Not specified (default)
- **Domain Impact**: jobs.bayareacleaningpros.com

### complete-subcontractor-onboarding
- **Purpose**: Completes subcontractor onboarding process
- **Dependencies**: Database write access, User role assignment
- **Config**: Not specified (default)
- **Domain Impact**: subcon.bayareacleaningpros.com

### send-subcontractor-welcome
- **Purpose**: Sends welcome emails to new subcontractors
- **Dependencies**: Resend API, Subcontractor welcome template
- **Config**: `verify_jwt = false`
- **Domain Impact**: subcon.bayareacleaningpros.com

### create-subcontractor-subscription
- **Purpose**: Creates Stripe subscriptions for subcontractors
- **Dependencies**: Stripe Secret Key
- **Config**: `verify_jwt = false`
- **Domain Impact**: subcon.bayareacleaningpros.com

### process-subcontractor-payment
- **Purpose**: Processes payments to subcontractors
- **Dependencies**: Stripe Secret Key
- **Config**: `verify_jwt = false`
- **Domain Impact**: admin.bayareacleaningpros.com

### send-application-response
- **Purpose**: Sends application approval/rejection emails
- **Dependencies**: Resend API, Application response template
- **Config**: Not specified (default)
- **Domain Impact**: jobs.bayareacleaningpros.com

### send-monthly-performance-summary
- **Purpose**: Sends monthly performance reports to subcontractors
- **Dependencies**: Resend API, Performance summary template
- **Config**: Not specified (default)
- **Domain Impact**: subcon.bayareacleaningpros.com

---

## 📅 Calendar & Scheduling Functions

### check-calendar-availability
- **Purpose**: Checks calendar availability for booking slots
- **Dependencies**: Google Calendar API, Service Account
- **Config**: `verify_jwt = false`
- **Domain Impact**: booking.bayareacleaningpros.com

### create-google-calendar-event
- **Purpose**: Creates events in Google Calendar
- **Dependencies**: Google Calendar API, Service Account
- **Config**: `verify_jwt = false`
- **Domain Impact**: office.bayareacleaningpros.com

### sync-calendar-busy-slots
- **Purpose**: Syncs busy slots from Google Calendar
- **Dependencies**: Google Calendar API, Service Account  
- **Config**: `verify_jwt = false`
- **Domain Impact**: subcon.bayareacleaningpros.com

### get-live-availability
- **Purpose**: Gets real-time availability data
- **Dependencies**: Database read access
- **Config**: Not specified (default)
- **Domain Impact**: booking.bayareacleaningpros.com

---

## 📧 Email & Communication Functions

### send-order-confirmation
- **Purpose**: Sends order confirmation emails
- **Dependencies**: Resend API, Order confirmation template
- **Config**: `verify_jwt = false`
- **Domain Impact**: booking.bayareacleaningpros.com

### send-service-notification
- **Purpose**: Sends service-related notifications
- **Dependencies**: Resend API, Service notification templates
- **Config**: Not specified (default)
- **Domain Impact**: All service-related subdomains

### complete-order-notification
- **Purpose**: Sends order completion notifications  
- **Dependencies**: Resend API
- **Config**: Not specified (default)
- **Domain Impact**: members.bayareacleaningpros.com

### send-customer-feedback-notification
- **Purpose**: Sends customer feedback notifications
- **Dependencies**: Resend API, Feedback notification template
- **Config**: Not specified (default)
- **Domain Impact**: reviews.bayareacleaningpros.com

### send-job-assignment-notification
- **Purpose**: Sends job assignment notifications to subcontractors
- **Dependencies**: Resend API, Job assignment template
- **Config**: Not specified (default)
- **Domain Impact**: subcon.bayareacleaningpros.com

### test-email-confirmation
- **Purpose**: Test email functionality
- **Dependencies**: Resend API
- **Config**: `verify_jwt = false`
- **Domain Impact**: admin.bayareacleaningpros.com

---

## 🔌 Integration & Automation Functions

### create-gohighlevel-booking
- **Purpose**: Creates bookings in GoHighLevel CRM
- **Dependencies**: GoHighLevel API Key
- **Config**: `verify_jwt = false`
- **Domain Impact**: api.bayareacleaningpros.com

### sync-ghl-availability
- **Purpose**: Syncs availability data with GoHighLevel
- **Dependencies**: GoHighLevel API Key
- **Config**: `verify_jwt = false`
- **Domain Impact**: api.bayareacleaningpros.com

### sync-ghl-updates
- **Purpose**: Syncs updates between systems and GoHighLevel
- **Dependencies**: GoHighLevel API Key
- **Config**: `verify_jwt = false`
- **Domain Impact**: api.bayareacleaningpros.com

### ghl-webhook-handler
- **Purpose**: Handles incoming webhooks from GoHighLevel
- **Dependencies**: GoHighLevel integration
- **Config**: `verify_jwt = false`
- **Domain Impact**: api.bayareacleaningpros.com

### enhanced-ghl-integration
- **Purpose**: Enhanced GoHighLevel integration features
- **Dependencies**: GoHighLevel API Key, Private Integration Token
- **Config**: `verify_jwt = false`
- **Domain Impact**: api.bayareacleaningpros.com

### ghl-advanced-pipeline
- **Purpose**: Advanced pipeline management with GoHighLevel
- **Dependencies**: GoHighLevel API Key
- **Config**: `verify_jwt = false`
- **Domain Impact**: api.bayareacleaningpros.com

### ghl-automation-workflows
- **Purpose**: Automated workflow management
- **Dependencies**: GoHighLevel API Key
- **Config**: `verify_jwt = false`
- **Domain Impact**: api.bayareacleaningpros.com

---

## 🔗 Zapier & External Integrations

### send-booking-transaction-to-zapier
- **Purpose**: Sends booking transactions to Zapier
- **Dependencies**: Zapier webhook URLs
- **Config**: `verify_jwt = false`
- **Domain Impact**: api.bayareacleaningpros.com

### send-test-transactions
- **Purpose**: Sends test transactions for integration testing
- **Dependencies**: Zapier webhook URLs
- **Config**: `verify_jwt = false`
- **Domain Impact**: admin.bayareacleaningpros.com

### demo-zapier-integration
- **Purpose**: Demonstrates Zapier integration capabilities
- **Dependencies**: Zapier webhook URLs
- **Config**: `verify_jwt = false`
- **Domain Impact**: demo.bayareacleaningpros.com

---

## 🛡️ Admin & System Functions

### reset-admin-passwords
- **Purpose**: Resets admin user passwords
- **Dependencies**: Auth admin access
- **Config**: `verify_jwt = true`
- **Domain Impact**: admin.bayareacleaningpros.com

### fix-admin-users
- **Purpose**: Fixes admin user configurations
- **Dependencies**: Auth admin access  
- **Config**: `verify_jwt = true`
- **Domain Impact**: admin.bayareacleaningpros.com

### send-admin-invites
- **Purpose**: Sends invitations to admin users
- **Dependencies**: Resend API, User invite template
- **Config**: `verify_jwt = true`
- **Domain Impact**: admin.bayareacleaningpros.com

### create-test-admin
- **Purpose**: Creates test admin users for development
- **Dependencies**: Auth admin access
- **Config**: `verify_jwt = false`
- **Domain Impact**: admin.bayareacleaningpros.com

### check-subscription
- **Purpose**: Checks subscription status
- **Dependencies**: Stripe API
- **Config**: Not specified (default)
- **Domain Impact**: members.bayareacleaningpros.com

---

## 📊 Required Environment Variables/Secrets

### Critical Secrets (Must Transfer)
1. **STRIPE_SECRET_KEY** - Payment processing
2. **RESEND_API_KEY** - Email communications  
3. **GOOGLE_CLIENT_ID** - OAuth authentication
4. **GOOGLE_CLIENT_SECRET** - OAuth authentication
5. **GOOGLE_SERVICE_ACCOUNT_KEY** - Calendar integration
6. **GOHIGHLEVEL_API_KEY** - CRM integration
7. **GHL_PRIVATE_INTEGRATION_TOKEN** - Enhanced CRM features
8. **SUPABASE_URL** - Database connection
9. **SUPABASE_ANON_KEY** - Public API access
10. **SUPABASE_SERVICE_ROLE_KEY** - Admin API access
11. **SUPABASE_DB_URL** - Direct database connection

### Domain-Specific Configurations
- **Webhook URLs**: Need updating for new domain structure
- **OAuth Redirect URLs**: Must be reconfigured for subdomains
- **Email Template Domains**: Update sender domains in templates

---

## 🚀 Migration Action Items

### Phase 1B.1: Core Function Migration
1. Export all function code with dependencies
2. Update CORS headers for subdomain architecture
3. Reconfigure webhook endpoints for new domains

### Phase 1B.2: Secret Migration
1. Secure transfer of all API keys and tokens
2. Update OAuth application configurations
3. Reconfigure webhook URLs in external systems

### Phase 1B.3: Domain-Specific Updates
1. Update email templates with new domain structure
2. Reconfigure OAuth redirect URLs
3. Update Zapier webhook configurations

### Phase 1B.4: Testing & Validation
1. Test all functions with new subdomain structure
2. Validate email delivery from new domains
3. Confirm OAuth flows work with new redirects
4. Test payment processing with new domain setup

---

## 📋 Deployment Checklist

- [ ] Export all 46 functions with current configurations
- [ ] Update `supabase/config.toml` with subdomain-specific settings
- [ ] Transfer and validate all 11 critical secrets
- [ ] Update OAuth application configurations
- [ ] Reconfigure webhook URLs in Zapier and GoHighLevel
- [ ] Test payment flows on pay.bayareacleaningpros.com
- [ ] Validate email delivery from all subdomains
- [ ] Test calendar integration on booking subdomain
- [ ] Confirm admin functions work on admin subdomain
- [ ] Validate subcontractor portal functions

---

## 🔄 Continuous Monitoring

Post-migration, monitor:
- Function execution logs for domain-related errors
- Email delivery rates from new sender domains
- OAuth authentication success rates
- Payment processing success rates
- Calendar sync functionality
- Webhook delivery confirmations

---

**Next Phase**: Phase 1C - Secrets & Integration Mapping