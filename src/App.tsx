import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Footer } from '@/components/Footer';

// Core customer pages
import Index from '@/pages/Index';
import CleanCoveredMembership from '@/pages/CleanCoveredMembership';
import PaymentConfirmation from '@/pages/PaymentConfirmation';
import ServiceDetails from '@/pages/ServiceDetails';
import ScheduleService from '@/pages/ScheduleService';
import BookingConfirmation from '@/pages/BookingConfirmation';
import AdminBookingPreview from '@/pages/AdminBookingPreview';
import TestBooking from '@/pages/TestBooking';
import CustomerDashboard from '@/pages/CustomerDashboard';
import OrderStatus from '@/pages/OrderStatus';

// Subcontractor pages
import SubcontractorPortal from '@/pages/SubcontractorPortal';
import SubcontractorDashboard from '@/pages/SubcontractorDashboard';
import SubcontractorMobile from '@/pages/SubcontractorMobile';
import SubcontractorApplication from '@/pages/SubcontractorApplication';
import SubcontractorOnboardingV2 from '@/pages/SubcontractorOnboardingV2';

// Admin pages (unified)
import AdminPortal from '@/pages/AdminPortal';
import AdminDashboard from '@/pages/AdminDashboard';
import SubcontractorManagement from '@/pages/SubcontractorManagement';
import ApplicationManager from '@/pages/ApplicationManager';
import MetricsDashboard from '@/pages/MetricsDashboard';

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
import PasswordReset from '@/pages/PasswordReset';
import OAuthCallback from '@/pages/OAuthCallback';
import NotFound from '@/pages/NotFound';
import ReviewsPortal from '@/pages/ReviewsPortal';
import ClientOverview from '@/pages/ClientOverview';
import SubcontractorPayments from '@/pages/SubcontractorPayments';
import AutomationControls from '@/pages/AutomationControls';
import SystemLogs from '@/pages/SystemLogs';

// Phase 5: Advanced Features & Business Intelligence
import AnalyticsDashboard from '@/pages/AnalyticsDashboard';
import SupportPortal from '@/pages/SupportPortal';
import TrainingPortal from '@/pages/TrainingPortal';
import ApiPortal from '@/pages/ApiPortal';

// Phase 6: System Integration & New Pages
import InstantQuote from '@/pages/InstantQuote';
import PaymentPortal from '@/pages/PaymentPortal';
import ConnectPortal from '@/pages/ConnectPortal';

const queryClient = new QueryClient();

// Enhanced Domain Router for Multi-Subdomain Architecture
function DomainRouter() {
  const hostname = window.location.hostname;
  
  // Phase 1: Core Client Experience
  if (hostname.includes('booking.')) {
    return <Navigate to="/instant-quote" replace />;
  }
  if (hostname.includes('pay.')) {
    return <Navigate to="/payment-portal" replace />;
  }
  if (hostname.includes('members.')) {
    return <Navigate to="/my-services" replace />;
  }
  
  // Phase 2: Internal Ops & Office Manager Tools  
  if (hostname.includes('app.')) {
    return <Navigate to="/auth" replace />;
  }
  if (hostname.includes('office.')) {
    return <Navigate to="/office-dashboard" replace />;
  }
  
  // Phase 3: Cleaner Portal (Mobile First)
  if (hostname.includes('cleaners.')) {
    return <Navigate to="/subcontractor-mobile" replace />;
  }
  
  // Phase 4: Admin & System Oversight
  if (hostname.includes('admin.')) {
    return <Navigate to="/admin" replace />;
  }
  
  // Phase 5: Marketing, Referrals, Hiring
  if (hostname.includes('reviews.')) {
    return <Navigate to="/reviews" replace />;
  }
  if (hostname.includes('referrals.')) {
    return <Navigate to="/?section=referrals" replace />;
  }
  if (hostname.includes('jobs.')) {
    return <Navigate to="/subcontractor-application" replace />;
  }
  
  // Phase 6: System Integration & APIs
  if (hostname.includes('api.')) {
    return <Navigate to="/api-portal" replace />;
  }
  if (hostname.includes('connect.')) {
    return <Navigate to="/connect" replace />;
  }
  
  // Phase 5: Advanced Features & Business Intelligence
  if (hostname.includes('analytics.')) {
    return <Navigate to="/analytics-dashboard" replace />;
  }
  if (hostname.includes('support.')) {
    return <Navigate to="/support-portal" replace />;
  }
  if (hostname.includes('training.')) {
    return <Navigate to="/training-portal" replace />;
  }
  
  // Default to main landing page
  return <Index />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">
              <Routes>
                {/* Public routes with domain-based routing */}
                <Route path="/" element={<DomainRouter />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/password-reset" element={<PasswordReset />} />
                <Route path="/oauth/callback" element={<OAuthCallback />} />
                <Route path="/order-status" element={<OrderStatus />} />
                <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
                <Route path="/service-details" element={<ServiceDetails />} />
                <Route path="/schedule-service" element={<ScheduleService />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/admin-booking-preview" element={<AdminBookingPreview />} />
                <Route path="/test-booking" element={<TestBooking />} />
                <Route path="/membership" element={<CleanCoveredMembership />} />
                
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
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/subcontractor-management" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <SubcontractorManagement />
                  </ProtectedRoute>
                } />
                <Route path="/application-manager" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <ApplicationManager />
                  </ProtectedRoute>
                } />
                <Route path="/metrics-dashboard" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <MetricsDashboard />
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
                
                {/* Admin tool routes */}
                <Route path="/admin-dashboard/email-settings" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client']}>
                    <EmailSettings />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/database-tools" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <DatabaseTools />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard/api-keys" element={
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
                <Route path="/analytics-dashboard" element={<AnalyticsDashboard />} />
                <Route path="/support-portal" element={<SupportPortal />} />
                <Route path="/training-portal" element={<TrainingPortal />} />
                <Route path="/api-portal" element={<ApiPortal />} />
                
                {/* Protected versions for production */}
                <Route path="/protected/analytics-dashboard" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client', 'owner']}>
                    <AnalyticsDashboard />
                  </ProtectedRoute>
                } />
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
                <Route path="/connect" element={<ConnectPortal />} />
                
                {/* 404 fallback */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;