import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Footer } from '@/components/Footer';
import { SidebarProvider } from '@/components/ui/sidebar';
import { UnifiedAdminSidebar } from '@/components/admin/UnifiedAdminSidebar';
import { Outlet } from 'react-router-dom';
import AuthErrorBoundary from '@/components/auth/AuthErrorBoundary';

// Core customer pages
import Index from '@/pages/Index';
import CleanCoveredMembership from '@/pages/CleanCoveredMembership';
import PaymentConfirmation from '@/pages/PaymentConfirmation';
import ServiceDetails from '@/pages/ServiceDetails';
import ScheduleService from '@/pages/ScheduleService';
import BookingConfirmation from '@/pages/BookingConfirmation';
import GuestBooking from '@/pages/GuestBooking';
import LegacyBooking from '@/pages/LegacyBooking';
import NewBooking from '@/pages/NewBooking';
import TestBooking from '@/pages/TestBooking';
import CustomerDashboard from '@/pages/CustomerDashboard';
import CustomerMobilePortal from '@/pages/CustomerMobilePortal';
import OrderStatus from '@/pages/OrderStatus';
import PaymentSuccess from '@/pages/PaymentSuccess';
import OrderConfirmation from '@/pages/OrderConfirmation';


// Subcontractor pages
import SubcontractorPortal from '@/pages/SubcontractorPortal';
import SubcontractorDashboard from '@/pages/SubcontractorDashboard';
import SubcontractorMobile from '@/pages/SubcontractorMobile';
import SubcontractorApplication from '@/pages/SubcontractorApplication';
import SubcontractorApplicationThankYou from '@/pages/SubcontractorApplicationThankYou';
import SubcontractorOnboardingV2 from '@/pages/SubcontractorOnboardingV2';
import SubcontractorDesktopPortal from '@/pages/SubcontractorDesktopPortal';

// Admin pages (simplified)
import AdminPortal from '@/pages/AdminPortal';
import SimpleCustomerList from '@/pages/SimpleCustomerList';
import CustomerManagementHub from '@/pages/CustomerManagementHub';
import SubcontractorDetail from '@/pages/SubcontractorDetail';
import SubcontractorHub from '@/pages/SubcontractorHub';
import SubcontractorManagement from '@/pages/SubcontractorManagement';
import TipsManagement from '@/pages/TipsManagement';
import FeedbackCenter from '@/pages/FeedbackCenter';
import CommunicationHub from '@/pages/CommunicationHub';
import ApplicationManager from '@/pages/ApplicationManager';
import JobAssignments from '@/pages/JobAssignments';
import SecurityCenter from '@/pages/SecurityCenter';

// Commercial estimates (kept as requested)
import CommercialEstimates from '@/pages/CommercialEstimates';

// Tier management system (kept as requested)
import TierSystemConfig from '@/pages/TierSystemConfig';
import TierPerformanceAnalytics from '@/pages/TierPerformanceAnalytics';
import SubcontractorPaymentDashboard from '@/pages/SubcontractorPaymentDashboard';
import { TierProgressionDashboard } from '@/components/admin/TierProgressionDashboard';
import { AdminLayout } from '@/components/admin/AdminLayout';

// Review systems (kept as requested)
import ReviewsPortal from '@/pages/ReviewsPortal';

// Admin tool pages (simplified)
import EmailSettings from '@/pages/EmailSettings';
import UserManagement from '@/pages/UserManagement';
import SecuritySettings from '@/pages/SecuritySettings';

// Auth & utility pages
import Auth from '@/pages/Auth';
import SignUp from '@/pages/SignUp';
import PasswordReset from '@/pages/PasswordReset';
import OAuthCallback from '@/pages/OAuthCallback';
import CalendarOAuthCallback from '@/pages/CalendarOAuthCallback';
import NotFound from '@/pages/NotFound';
import ModernBooking from '@/pages/ModernBooking';
import SubcontractorPayments from '@/pages/SubcontractorPayments';
import Billing from '@/pages/Billing';

// Customer portal
import CustomerPortalDashboard from '@/pages/CustomerPortalDashboard';

const queryClient = new QueryClient();

// Simplified Domain Router
function DomainRouter() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;
  const isDevelopment = import.meta.env.DEV;
  
  // In development, log domain routing for debugging
  if (isDevelopment) {
    console.log('Domain router processing:', hostname, pathname);
  }
  
  // Guest-accessible paths that should bypass domain redirects
  const guestPaths = ['/payment-success', '/order-confirmation', '/order-status', '/guest-booking', '/service-details', '/schedule-service', '/booking-confirmation', '/membership'];
  
  // Core domain routing (simplified)
  if (hostname.startsWith('book.') || hostname.startsWith('booking.')) {
    return <Index />;
  }
  if (hostname.startsWith('members.') || hostname.startsWith('portal.')) {
    // Allow guest paths to bypass portal redirect
    if (guestPaths.includes(pathname)) {
      return null; // Let normal routing handle it
    }
    return <Navigate to="/my-services" replace />;
  }
  if (hostname.startsWith('cleaners.') || hostname.startsWith('subcon.')) {
    return <Navigate to="/subcontractor-mobile" replace />;
  }
  if (hostname.startsWith('admin.')) {
    return <Navigate to="/admin" replace />;
  }
  if (hostname.startsWith('reviews.')) {
    return <Navigate to="/reviews" replace />;
  }
  if (hostname.startsWith('jobs.')) {
    return <Navigate to="/subcontractor-application" replace />;
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
                <Route path="/calendar/oauth/callback" element={
                  <ProtectedRoute allowedRoles={['subcontractor', 'super_admin']}>
                    <CalendarOAuthCallback />
                  </ProtectedRoute>
                } />
                <Route path="/order-status" element={<OrderStatus />} />
                <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/order-confirmation" element={<OrderConfirmation />} />
                
                <Route path="/service-details" element={<ServiceDetails />} />
                <Route path="/schedule-service" element={<ScheduleService />} />
                <Route path="/booking-confirmation" element={<BookingConfirmation />} />
                <Route path="/test-booking" element={<TestBooking />} />
                <Route path="/guest-booking" element={<GuestBooking />} />
                <Route path="/legacy-booking" element={<LegacyBooking />} />
                <Route path="/new-booking" element={<NewBooking />} />
                <Route path="/membership" element={<CleanCoveredMembership />} />
                <Route path="/modern-booking" element={<ModernBooking />} />
                
                {/* Customer portal routes - now public with email-based access */}
                <Route path="/customer-mobile-portal" element={<CustomerMobilePortal />} />
                <Route path="/customer-portal-dashboard" element={<CustomerPortalDashboard />} />
                <Route path="/customer-portal" element={<Navigate to="/customer-portal-dashboard" replace />} />
                <Route path="/my-services" element={<CustomerDashboard />} />
                
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
                <Route path="/subcontractor-desktop-portal" element={
                  <ProtectedRoute allowedRoles={['subcontractor', 'super_admin', 'enterprise_client']}>
                    <SubcontractorDesktopPortal />
                  </ProtectedRoute>
                } />

                {/* Admin Routes */}
                <Route path="/admin" element={
                  <ProtectedRoute requiredRole="super_admin">
                    <SidebarProvider>
                      <div className="flex min-h-screen w-full">
                        <UnifiedAdminSidebar />
                        <main className="flex-1">
                          <Outlet />
                        </main>
                      </div>
                    </SidebarProvider>
                  </ProtectedRoute>
                }>
                  <Route index element={<AdminPortal />} />
                  <Route path="customers" element={<SimpleCustomerList />} />
                  <Route path="subcontractors" element={<SubcontractorManagement />} />
                </Route>
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
                <Route path="/subcontractor-management" element={<Navigate to="/subcon-management" replace />} />
                <Route path="/application-manager" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <ApplicationManager />
                  </ProtectedRoute>
                } />
                <Route path="/job-assignments" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <JobAssignments />
                  </ProtectedRoute>
                } />
                <Route path="/security-center" element={
                  <ProtectedRoute allowedRoles={['super_admin']}>
                    <SecurityCenter />
                  </ProtectedRoute>
                } />
                
                {/* Commercial estimates (kept as requested) */}
                <Route path="/commercial-estimates" element={
                  <ProtectedRoute allowedRoles={['owner', 'super_admin', 'enterprise_client']}>
                    <CommercialEstimates />
                  </ProtectedRoute>
                } />
                
                {/* Review Portal (kept as requested) */}
                <Route path="/reviews-portal" element={<ReviewsPortal />} />
                
                {/* Tier Management System (kept as requested) */}
                <Route path="/tier-management" element={
                  <ProtectedRoute allowedRoles={['super_admin', 'enterprise_client']}>
                    <TierSystemConfig />
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