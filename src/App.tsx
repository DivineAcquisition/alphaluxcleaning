
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DomainAwareRouter } from '@/components/DomainAwareRouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { HelmetProvider } from 'react-helmet-async';
import ComingSoonPage from '@/pages/ComingSoonPage';

// Pages
import Index from '@/pages/Index';
import { DomainAwareHome } from '@/components/DomainAwareHome';
import Auth from '@/pages/Auth';
import SignUp from '@/pages/SignUp';
import AdminDashboard from '@/pages/AdminDashboard';
// Removed deleted pages
import UserManagement from '@/pages/UserManagement';
import CustomerDatabaseAdmin from '@/pages/CustomerDatabaseAdmin';
import AdminBookingPreview from '@/pages/AdminBookingPreview';
import TipsManagement from '@/pages/TipsManagement';
import TierSystemConfig from '@/pages/TierSystemConfig';
import ReviewsPortal from '@/pages/ReviewsPortal';
import CustomerPortalDashboard from '@/pages/CustomerPortalDashboard';
import OrderStatus from '@/pages/OrderStatus';
import OrderConfirmation from '@/pages/OrderConfirmation';
import ContractorLogin from '@/pages/ContractorLogin';
import ContractorUpcoming from '@/pages/ContractorUpcoming';
import ContractorPayouts from '@/pages/ContractorPayouts';
import ContractorAvailability from '@/pages/ContractorAvailability';
import BookingConfirmation from '@/pages/BookingConfirmation';
import PaymentConfirmation from '@/pages/PaymentConfirmation';
import PaymentSuccess from '@/pages/PaymentSuccess';
import StripeTestPage from '@/pages/StripeTestPage';
import ScheduleService from '@/pages/ScheduleService';
import OAuthCallback from '@/pages/OAuthCallback';
import ModernBooking from '@/pages/ModernBooking';
import LegacyBooking from '@/pages/LegacyBooking';
import NewBooking from '@/pages/NewBooking';
import CommercialEstimates from '@/pages/CommercialEstimates';
import ApplicationManager from '@/pages/ApplicationManager';
import CustomerAuth from '@/pages/CustomerAuth';
import CustomerDashboard from '@/pages/CustomerDashboard';
import CustomerPayments from '@/pages/CustomerPayments';
import SubcontractorDashboard from '@/pages/SubcontractorDashboard';
import SubcontractorPortal from '@/pages/SubcontractorPortal';
import SubcontractorJobAcceptance from '@/pages/SubcontractorJobAcceptance';
// Remove deleted pages from imports
import NotFound from '@/pages/NotFound';

// Contractor Portal Components
import ContractorAuth from '@/pages/ContractorAuth';
import ContractorDashboard from '@/pages/contractor/ContractorDashboard';
import ContractorApplications from '@/pages/contractor/ContractorApplications';

import ContractorSubcontractorHub from '@/pages/contractor/ContractorSubcontractorHub';
import TeamManagement from '@/pages/TeamManagement';
import TeamMemberProfile from '@/pages/TeamMemberProfile';
import SubcontractorPortalToday from '@/pages/SubcontractorPortalToday';

const queryClient = new QueryClient();

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/customer-portal-dashboard" />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <DomainAwareRouter>
            <Routes>
            <Route path="/" element={<DomainAwareHome />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<SignUp />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/customers" 
              element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/subcontractors" 
              element={
                <ProtectedRoute requireAdmin>
                  <ContractorSubcontractorHub />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/security" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute requireAdmin>
                  <UserManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-dashboard-admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <CustomerDatabaseAdmin />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-booking-preview" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminBookingPreview />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tips-management" 
              element={
                <ProtectedRoute requireAdmin>
                  <TipsManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subcontractor-management" 
              element={
                <ProtectedRoute requireAdmin>
                  <ContractorSubcontractorHub />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-portal-dashboard" 
              element={
                <ProtectedRoute>
                  <CustomerPortalDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="/order-status" element={<OrderStatus />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />
            <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/stripe-test" element={<StripeTestPage />} />
            <Route path="/schedule-service" element={<ScheduleService />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin-portal" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/commercial-estimates" 
              element={
                <ProtectedRoute requireAdmin>
                  <CommercialEstimates />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/application-manager" 
              element={
                <ProtectedRoute requireAdmin>
                  <ApplicationManager />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/tier-management" 
              element={
                <ProtectedRoute requireAdmin>
                  <TierSystemConfig />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/reviews-portal" 
              element={
                <ProtectedRoute requireAdmin>
                  <ReviewsPortal />
                </ProtectedRoute>
              } 
            />
            
            {/* Customer Routes */}
            <Route path="/customer-auth" element={<CustomerAuth />} />
            <Route 
              path="/customer-dashboard" 
              element={
                <ProtectedRoute>
                  <CustomerDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/customer-payments" 
              element={
                <ProtectedRoute>
                  <CustomerPayments />
                </ProtectedRoute>
              } 
            />
            
            {/* Subcontractor Routes */}
            <Route 
              path="/subcontractor-dashboard" 
              element={
                <ProtectedRoute>
                  <SubcontractorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/subcontractor-portal" 
              element={
                <ProtectedRoute>
                  <SubcontractorPortal />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/subcontractor-response" element={<SubcontractorJobAcceptance />} />
            
            {/* New Subcontractor Management System Routes */}
            <Route 
              path="/app/team" 
              element={
                <ProtectedRoute requireAdmin>
                  <TeamManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/app/team/:id" 
              element={
                <ProtectedRoute requireAdmin>
                  <TeamMemberProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/today" 
              element={
                <ProtectedRoute>
                  <SubcontractorPortalToday />
                </ProtectedRoute>
              } 
            />
            
            {/* Contractor Portal Routes */}
            <Route path="/contractor-auth" element={<ContractorLogin />} />
            <Route path="/login" element={<ContractorLogin />} />
            <Route path="/confirmation/:bookingId" element={<OrderConfirmation />} />
            <Route path="/upcoming" element={<ContractorUpcoming />} />
            <Route path="/payouts" element={<ContractorPayouts />} />
            <Route path="/availability" element={<ContractorAvailability />} />
            <Route 
              path="/contractor" 
              element={
                <ProtectedRoute requireAdmin>
                  <ContractorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contractor/applications" 
              element={
                <ProtectedRoute requireAdmin>
                  <ContractorApplications />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contractor/subcontractors" 
              element={
                <ProtectedRoute requireAdmin>
                  <ContractorSubcontractorHub />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contractor/hub" 
              element={
                <ProtectedRoute requireAdmin>
                  <ContractorSubcontractorHub />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contractor/performance" 
              element={
                <ProtectedRoute requireAdmin>
                  <ContractorSubcontractorHub />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/contractor/portal" 
              element={
                <ProtectedRoute>
                  <SubcontractorPortal />
                </ProtectedRoute>
              } 
            />
            
            
            {/* Customer Portal Routes */}
            <Route path="/portal" element={<ComingSoonPage />} />
            <Route path="/portal/*" element={<ComingSoonPage />} />
            
            {/* Health Endpoints */}
            <Route path="/health/admin" element={<div>✅ Admin OK</div>} />
            <Route path="/health/book" element={<div>✅ Book OK</div>} />
            <Route path="/health/sub" element={<div>✅ Sub OK</div>} />
            <Route path="/health/portal" element={<div>✅ Portal OK</div>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </DomainAwareRouter>
        </Router>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </QueryClientProvider>
  </HelmetProvider>
  );
}

export default App;
