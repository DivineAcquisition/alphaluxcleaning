import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Footer } from '@/components/Footer';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';

// Core customer pages
import Index from '@/pages/Index';
import CleanCoveredMembership from '@/pages/CleanCoveredMembership';
import PaymentConfirmation from '@/pages/PaymentConfirmation';
import ServiceDetails from '@/pages/ServiceDetails';
import ScheduleService from '@/pages/ScheduleService';
import BookingConfirmation from '@/pages/BookingConfirmation';
import AdminBookingPreview from '@/pages/AdminBookingPreview';
import GuestBooking from '@/pages/GuestBooking';
import TestBooking from '@/pages/TestBooking';
import CustomerDashboard from '@/pages/CustomerDashboard';
import OrderStatus from '@/pages/OrderStatus';
import PaymentSuccess from '@/pages/PaymentSuccess';

// Subcontractor pages
import SubcontractorPortal from '@/pages/SubcontractorPortal';
import SubcontractorDashboard from '@/pages/SubcontractorDashboard';
import SubcontractorMobile from '@/pages/SubcontractorMobile';
import SubcontractorApplication from '@/pages/SubcontractorApplication';
import SubcontractorApplicationThankYou from '@/pages/SubcontractorApplicationThankYou';
import SubcontractorOnboardingV2 from '@/pages/SubcontractorOnboardingV2';

// Admin pages (unified)
import AdminPortal from '@/pages/AdminPortal';
import CustomerManagementHub from '@/pages/CustomerManagementHub';
import SystemsManagementHub from '@/pages/SystemsManagementHub';
import SubcontractorDetail from '@/pages/SubcontractorDetail';
import SubcontractorHub from '@/pages/SubcontractorHub';
import TipsManagement from '@/pages/TipsManagement';
import FeedbackCenter from '@/pages/FeedbackCenter';
import CommunicationHub from '@/pages/CommunicationHub';
import ApplicationManager from '@/pages/ApplicationManager';

// Admin tool pages
import EmailSettings from '@/pages/EmailSettings';
import UserManagement from '@/pages/UserManagement';
import DatabaseTools from '@/pages/DatabaseTools';
import ApiKeys from '@/pages/ApiKeys';
import SecuritySettings from '@/pages/SecuritySettings';
import SystemSettings from '@/pages/SystemSettings';

// Office Manager pages
import OfficeManagerDashboard from '@/pages/OfficeManagerDashboard';
import OfficeManagerJobs from '@/pages/OfficeManagerJobs';
import OfficeManagerTeam from '@/pages/OfficeManagerTeam';
import OfficeManagerBookings from '@/pages/OfficeManagerBookings';
import OfficeManagerQuality from '@/pages/OfficeManagerQuality';
import OfficeManagerPerformance from '@/pages/OfficeManagerPerformance';

// Auth & utility pages
import Auth from '@/pages/Auth';
import SignUp from '@/pages/SignUp';
import PasswordReset from '@/pages/PasswordReset';
import OAuthCallback from '@/pages/OAuthCallback';
import NotFound from '@/pages/NotFound';
import ModernBooking from '@/pages/ModernBooking';
import ReviewsPortal from '@/pages/ReviewsPortal';
import ClientOverview from '@/pages/ClientOverview';
import SubcontractorPayments from '@/pages/SubcontractorPayments';
import AutomationControls from '@/pages/AutomationControls';
import SystemLogs from '@/pages/SystemLogs';

// Phase 5: Advanced Features & Business Intelligence
import SupportPortal from '@/pages/SupportPortal';
import TrainingPortal from '@/pages/TrainingPortal';
import ApiPortal from '@/pages/ApiPortal';

// Phase 6: System Integration & New Pages
import InstantQuote from '@/pages/InstantQuote';
import PaymentPortal from '@/pages/PaymentPortal';
import ConnectPortal from '@/pages/ConnectPortal';
import TestingPortal from '@/pages/TestingPortal';
import Billing from '@/pages/Billing';

// Phase 4B: Advanced Tier Management System
import TierSystemConfig from '@/pages/TierSystemConfig';
import TierPerformanceAnalytics from '@/pages/TierPerformanceAnalytics';
import SubcontractorPaymentDashboard from '@/pages/SubcontractorPaymentDashboard';
import { TierProgressionDashboard } from '@/components/admin/TierProgressionDashboard';
import { AdminLayout } from '@/components/admin/AdminLayout';
import TestDashboard from '@/pages/TestDashboard';

// New unified admin pages
import JobAssignments from '@/pages/JobAssignments';
import CommercialEstimates from '@/pages/CommercialEstimates';
import AdminPaymentCenter from '@/pages/AdminPaymentCenter';
import BulkOnboardExistingCleaners from '@/pages/BulkOnboardExistingCleaners';
import AddSpreadsheetCleaners from '@/pages/AddSpreadsheetCleaners';
import SecurityCenter from '@/pages/SecurityCenter';

// New multi-subdomain pages
import CustomerPortalDashboard from '@/pages/CustomerPortalDashboard';
import TrialLandingPage from '@/pages/TrialLandingPage';
import ClientReportsPortal from '@/pages/ClientReportsPortal';
import SubcontractorDesktopPortal from '@/pages/SubcontractorDesktopPortal';
import ZapierTest from '@/pages/ZapierTest';

const queryClient = new QueryClient();

// Enhanced Domain Router for Multi-Subdomain Architecture
function DomainRouter() {
  const hostname = window.location.hostname;
  const isDevelopment = import.meta.env.DEV;
  
  // In development, log domain routing for debugging
  if (isDevelopment) {
    console.log('Domain router processing:', hostname);
  }
  
  // Check for root domain (no subdomain) - redirect to book subdomain
  if (hostname === 'bayareacleaningpros.com' || (!isDevelopment && !hostname.includes('localhost') && !hostname.includes('.'))) {
    window.location.href = 'https://book.bayareacleaningpros.com';
    return null;
  }

  // Only apply subdomain routing for specific subdomains, not all
  const isSpecificSubdomain = [
    'book', 'booking', 'pay', 'members', 'app', 'office', 'cleaners', 
    'admin', 'reviews', 'referrals', 'jobs', 'api', 'connect',
    'analytics', 'support', 'training', 'portal', 'try', 'reports', 'subcon'
  ].some(subdomain => hostname.startsWith(`${subdomain}.`));
  
  // If not a specific subdomain, return to normal routing
  if (!isSpecificSubdomain) {
    return <Index />;
  }
  
  // Phase 1: Core Client Experience  
  if (hostname.startsWith('book.')) {
    return <Index />;
  }
  if (hostname.startsWith('booking.')) {
    return <Navigate to="/instant-quote" replace />;
  }
  if (hostname.startsWith('pay.')) {
    return <Navigate to="/payment-portal" replace />;
  }
  if (hostname.startsWith('members.')) {
    return <Navigate to="/my-services" replace />;
  }
  if (hostname.startsWith('portal.')) {
    return <Navigate to="/customer-portal-dashboard" replace />;
  }
  if (hostname.startsWith('try.')) {
    return <Navigate to="/trial-landing" replace />;
  }
  if (hostname.startsWith('reports.')) {
    return <Navigate to="/client-reports-portal" replace />;
  }
  
  // Phase 2: Internal Ops & Office Manager Tools  
  if (hostname.startsWith('app.')) {
    return <Navigate to="/auth" replace />;
  }
  if (hostname.startsWith('office.')) {
    return <Navigate to="/office-dashboard" replace />;
  }
  
  // Phase 3: Cleaner Portal (Mobile First)
  if (hostname.startsWith('cleaners.')) {
    return <Navigate to="/subcontractor-mobile" replace />;
  }
  if (hostname.startsWith('subcon.')) {
    return <Navigate to="/subcontractor-desktop-portal" replace />;
  }
  
  // Phase 4: Admin & System Oversight
          if (hostname.startsWith('admin.')) {
            return <Navigate to="/admin" replace />;
          }
  
  // Phase 5: Marketing, Referrals, Hiring
  if (hostname.startsWith('reviews.')) {
    return <Navigate to="/reviews" replace />;
  }
  if (hostname.startsWith('referrals.')) {
    return <Navigate to="/?section=referrals" replace />;
  }
  if (hostname.startsWith('jobs.')) {
    return <Navigate to="/subcontractor-application" replace />;
  }
  
  // Phase 6: System Integration & APIs
  if (hostname.startsWith('api.')) {
    return <Navigate to="/api-portal" replace />;
  }
  if (hostname.startsWith('connect.')) {
    return <Navigate to="/connect" replace />;
  }
  
  // Phase 5: Advanced Features & Business Intelligence
  if (hostname.startsWith('analytics.')) {
    return <Navigate to="/analytics-dashboard" replace />;
  }
  if (hostname.startsWith('support.')) {
    return <Navigate to="/support-portal" replace />;
  }
  if (hostname.startsWith('training.')) {
    return <Navigate to="/training-portal" replace />;
  }
  
  // Default to main landing page
  return <Index />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuthErrorBoundary>
          <Router>
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                <Routes>
                {/* Public routes with domain-based routing */}
                <Route path="/" element={<DomainRouter />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/password-reset" element={<PasswordReset />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route path="/order-status" element={<OrderStatus />} />
                <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/service-details" element={<ServiceDetails />} />
                <Route path="/schedule-service" element={<ScheduleService />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/admin-booking-preview" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'owner', 'admin', 'enterprise_client']}>
                    <AdminBookingPreview />
                  </ProtectedRoute>
                } />
                <Route path="/test-booking" element={<TestBooking />} />
                <Route path="/guest-booking" element={<GuestBooking />} />
                <Route path="/membership" element={<CleanCoveredMembership />} />
                <Route path="/modern-booking" element={<ModernBooking />} />
                <Route path="/zapier-test" element={<ZapierTest />} />
                
                {/* New multi-subdomain pages */}
                <Route path="/customer-portal-dashboard" element={
                  <ProtectedRoute requiredRole="customer">
                    <CustomerPortalDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Redirect for legacy customer-portal path */}
                <Route path="/customer-portal" element={<Navigate to="/customer-portal-dashboard" replace />} />
                <Route path="/trial-landing" element={<TrialLandingPage />} />
                <Route path="/client-reports-portal" element={
                  <ProtectedRoute requiredRole="customer">
                    <ClientReportsPortal />
                  </ProtectedRoute>
                } />
                <Route path="/subcontractor-desktop-portal" element={
                  <ProtectedRoute allowedRoles={['subcontractor', 'super_admin', 'enterprise_client']}>
                    <SubcontractorDesktopPortal />
                  </ProtectedRoute>
                } />

                {/* Customer protected routes */}
                <Route path="/my-services" element={
                  <ProtectedRoute requiredRole="customer">
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Subcontractor routes */}
                <Route path="/subcontractor" element={<SubcontractorPortal />} />
                <Route path="/subcontractor-auth" element={<SubcontractorPortal />} />
                <Route path="/subcontractor-application" element={<SubcontractorApplication />} />
                <Route path="/subcontractor-application-thank-you" element={<SubcontractorApplicationThankYou />} />
                <Route path="/subcontractor-onboarding" element={<SubcontractorOnboardingV2 />} />
                <Route path="/subcontractor-mobile" element={
                  <ProtectedRoute allowedRoles={['subcontractor', 'super_admin', 'enterprise_client']}>
                    <SubcontractorMobile />
                  </ProtectedRoute>
                } />
                <Route path="/subcontractor-dashboard" element={
                  <ProtectedRoute allowedRoles={['subcontractor', 'super_admin', 'enterprise_client']}>
                    <SubcontractorDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Admin routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client']}>
                    <AdminPortal />
                  </ProtectedRoute>
                } />
                <Route path="/admin/customers" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client', 'office_manager']}>
                    <CustomerManagementHub />
                  </ProtectedRoute>
                } />
                <Route path="/admin/subcontractors" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <SubcontractorHub />
                  </ProtectedRoute>
                } />
                <Route path="/admin/systems" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <SystemsManagementHub />
                  </ProtectedRoute>
                } />
                <Route path="/subcontractor-detail/:id" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <SubcontractorDetail />
                  </ProtectedRoute>
                } />
                <Route path="/tips-management" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <TipsManagement />
                  </ProtectedRoute>
                } />
                <Route path="/feedback-center" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <FeedbackCenter />
                  </ProtectedRoute>
                } />
                <Route path="/communication-hub" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <CommunicationHub />
                  </ProtectedRoute>
                } />
                
                 <Route path="/subcon-management" element={
                   <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                     <SubcontractorHub />
                   </ProtectedRoute>
                 } />
                 {/* Redirect old path to new path */}
                 <Route path="/subcontractor-management" element={<Navigate to="/subcon-management" replace />} />
                <Route path="/application-manager" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <ApplicationManager />
                  </ProtectedRoute>
                } />
                
                {/* New unified admin routes */}
                <Route path="/job-assignments" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <JobAssignments />
                  </ProtectedRoute>
                } />
                <Route path="/commercial-estimates" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <CommercialEstimates />
                  </ProtectedRoute>
                } />
                <Route path="/admin-payment-center" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <AdminPaymentCenter />
                  </ProtectedRoute>
                } />
                <Route path="/bulk-onboard-cleaners" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <BulkOnboardExistingCleaners />
                  </ProtectedRoute>
                } />
                <Route path="/add-spreadsheet-cleaners" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <AddSpreadsheetCleaners />
                  </ProtectedRoute>
                } />
                <Route path="/security-center" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SecurityCenter />
                  </ProtectedRoute>
                } />
                
                {/* Office Manager routes */}
                <Route path="/admin-dashboard/schedule" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/jobs" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerJobs />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/team" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerTeam />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/bookings" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerBookings />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/quality" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerQuality />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/performance" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerPerformance />
                  </ProtectedRoute>
                } />
                
                {/* Phase 2: Office Manager Portal Routes */}
                <Route path="/office-dashboard" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/office-jobs" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerJobs />
                  </ProtectedRoute>
                } />
                <Route path="/office-bookings" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerBookings />
                  </ProtectedRoute>
                } />
                <Route path="/office-team" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerTeam />
                  </ProtectedRoute>
                } />
                <Route path="/office-performance" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerPerformance />
                  </ProtectedRoute>
                } />
                <Route path="/office-quality" element={
                  <ProtectedRoute allowedRoles={['office_manager', 'owner', 'super_admin', 'enterprise_client']}>
                    <OfficeManagerQuality />
                  </ProtectedRoute>
                } />
                
                {/* Review Portal Route */}
                <Route path="/reviews" element={<ReviewsPortal />} />
                
                {/* Phase 4: Admin & System Oversight Routes */}
                <Route path="/client-overview" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client', 'owner']}>
                    <ClientOverview />
                  </ProtectedRoute>
                } />
                <Route path="/subcontractor-payments" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client', 'owner']}>
                    <SubcontractorPayments />
                  </ProtectedRoute>
                } />
                <Route path="/automation-controls" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client', 'owner']}>
                    <AutomationControls />
                  </ProtectedRoute>
                } />
                <Route path="/system-logs" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client']}>
                    <SystemLogs />
                  </ProtectedRoute>
                } />
                
                {/* Admin tool routes - both prefixed and direct paths */}
                <Route path="/admin-dashboard/email-settings" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client']}>
                    <EmailSettings />
                  </ProtectedRoute>
                } />
                <Route path="/email-settings" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client']}>
                    <EmailSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/database-tools" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <DatabaseTools />
                  </ProtectedRoute>
                } />
                <Route path="/database-tools" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <DatabaseTools />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/api-keys" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <ApiKeys />
                  </ProtectedRoute>
                } />
                <Route path="/api-keys" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <ApiKeys />
                  </ProtectedRoute>
                } />
                <Route path="/user-management" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/security-settings" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SecuritySettings />
                  </ProtectedRoute>
                } />
                <Route path="/system-settings" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SystemSettings />
                  </ProtectedRoute>
                } />
                
                
                {/* Phase 5: Advanced Features & Business Intelligence Routes - Open Access for Testing */}
                <Route path="/support-portal" element={<SupportPortal />} />
                <Route path="/training-portal" element={<TrainingPortal />} />
                <Route path="/api-portal" element={<ApiPortal />} />
                
                {/* Protected versions for production */}
                <Route path="/protected/training-portal" element={
                  <ProtectedRoute allowedRoles={['subcontractor', 'super_admin', 'enterprise_client', 'owner']}>
                    <TrainingPortal />
                  </ProtectedRoute>
                } />
                <Route path="/protected/api-portal" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client', 'owner']}>
                    <ApiPortal />
                  </ProtectedRoute>
                } />
                
                {/* Phase 6: System Integration & New Pages */}
                <Route path="/instant-quote" element={<InstantQuote />} />
                <Route path="/payment-portal" element={<PaymentPortal />} />
                <Route path="/billing" element={
                  <ProtectedRoute requiredRole="customer">
                    <Billing />
                  </ProtectedRoute>
                } />
                <Route path="/connect" element={<ConnectPortal />} />
                
                {/* Testing Portal - Admin Only */}
                <Route path="/testing-portal" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
                    <TestingPortal />
                  </ProtectedRoute>
                } />
                
                {/* Testing Routes - Development Only */}
                <Route path="/test/*" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'admin']} redirectTo="/auth">
                    <Routes>
                      <Route path="/" element={<TestDashboard />} />
                      <Route path="/subcontractor-dashboard" element={<SubcontractorDashboard />} />
                      <Route path="/subcontractor-mobile" element={<SubcontractorMobile />} />
                      <Route path="/subcontractor-management" element={<SubcontractorHub />} />
                      <Route path="/tier-config" element={<TierSystemConfig />} />
                      <Route path="/subcontractor-payments" element={<SubcontractorPaymentDashboard />} />
                      <Route path="/office-dashboard" element={<OfficeManagerDashboard />} />
                      <Route path="/admin-portal" element={<AdminPortal />} />
                      <Route path="/security-center" element={<SecurityCenter />} />
                    </Routes>
                  </ProtectedRoute>
                } />

                {/* Phase 4B: Advanced Tier Management System Routes */}
                <Route path="/tier-config" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client']}>
                    <TierSystemConfig />
                  </ProtectedRoute>
                } />
                <Route path="/tier-analytics" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client', 'owner']}>
                    <TierPerformanceAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/payment-dashboard" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client', 'owner']}>
                    <SubcontractorPaymentDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/tier-progression-dashboard" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client', 'owner']}>
                    <AdminLayout title="Tier Progression Dashboard" description="Monitor and manage automated tier progressions">
                      <TierProgressionDashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                } />
                
                {/* 404 fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
          <Toaster />
        </Router>
      </AuthErrorBoundary>
    </AuthProvider>
  </QueryClientProvider>
);
}

export default App;