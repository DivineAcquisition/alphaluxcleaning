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

const queryClient = new QueryClient();

// Domain detection component
function DomainRouter() {
  const hostname = window.location.hostname;
  
  // Check for subdomains and redirect appropriately
  if (hostname.includes('subcon.')) {
    return <Navigate to="/subcontractor" replace />;
  }
  
  if (hostname.includes('admin.')) {
    return <Navigate to="/admin" replace />;
  }
  
  // Default to main landing page for main domain
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
                
                {/* Admin tool routes */}
                <Route path="/email-settings" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client']}>
                    <EmailSettings />
                  </ProtectedRoute>
                } />
                <Route path="/user-management" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client']}>
                    <UserManagement />
                  </ProtectedRoute>
                } />
                <Route path="/database-tools" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <DatabaseTools />
                  </ProtectedRoute>
                } />
                <Route path="/api-keys" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <ApiKeys />
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