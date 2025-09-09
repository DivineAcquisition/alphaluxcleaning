# Pages Marked for Removal - Infrastructure Cleanup

## Phase 3: UI Consolidation
The following 35+ pages should be removed to simplify the application:

### ❌ Legacy Booking Variations
- `LegacyBooking.tsx` - Replace with ModernBooking
- `NewBooking.tsx` - Duplicate functionality  

### ❌ Duplicate Contractor Interfaces  
- `SubcontractorMobile.tsx` - Consolidate into main portal
- `SubcontractorDesktopPortal.tsx` - Consolidate into main portal
- `ContractorAuth.tsx` - Use standard auth

### ❌ Advanced CRM Pages
- `CustomerMobilePortal.tsx` - Use main customer portal
- `ReviewsPortal.tsx` - Integrate into main dashboard
- `SimpleCustomerList.tsx` - Redundant admin view

### ❌ Complex Admin Pages
- `TierPerformanceAnalytics.tsx` - Over-engineered
- `SecurityCenter.tsx` - Basic security sufficient
- `SecuritySettings.tsx` - Consolidate into main settings
- `PaymentPortalAdmin.tsx` - Use standard payment views
- `TierSystemConfig.tsx` - Simplify tier management
- `EmailSettings.tsx` - Basic email sufficient

### ❌ Specialized Tools
- `DispatcherDashboard.tsx` - Integrate into admin
- `CommunicationHub.tsx` - Over-complex communication
- `FeedbackCenter.tsx` - Use standard feedback
- `UserManagement.tsx` - Basic user management sufficient

### ❌ Duplicate Onboarding  
- `SubcontractorOnboardingV2.tsx` - Keep only one version
- `SubcontractorApplicationThankYou.tsx` - Simple thank you sufficient

### ❌ Advanced Features
- `SubcontractorTiers.tsx` - Simplify tier system
- `TipsManagement.tsx` - Basic tip handling sufficient  
- `SubcontractorPaymentDashboard.tsx` - Use standard payment views
- `SubcontractorPerformance.tsx` - Basic metrics sufficient

## 🟢 Keep Core Pages (15 total)
- `ModernBooking.tsx` - Main booking interface
- `SubcontractorHub.tsx` - Core contractor management  
- `JobAssignments.tsx` - Essential job dispatch
- `CommercialEstimates.tsx` - B2B lead capture
- `SubcontractorApplication.tsx` - Contractor onboarding
- `AdminDashboard.tsx` - Core admin interface
- `ContractorDashboard.tsx` - Main contractor portal
- `CustomerPortalDashboard.tsx` - Customer interface
- `OrderStatus.tsx` - Order tracking
- `PaymentSuccess.tsx` - Payment confirmation
- `Auth.tsx` - Authentication  
- `OrderConfirmation.tsx` - Booking confirmation
- `SubcontractorManagement.tsx` - Contractor admin
- `SubcontractorPayments.tsx` - Payment management
- `PasswordReset.tsx` - Basic auth feature

---
*Next Phase: Actually remove these files and update routing*