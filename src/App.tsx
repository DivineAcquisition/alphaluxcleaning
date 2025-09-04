
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DomainAwareRouter } from '@/components/DomainAwareRouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import SignUp from '@/pages/SignUp';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminPortal from '@/pages/AdminPortal';
import SubcontractorManagement from '@/pages/SubcontractorManagement';
import CustomerManagementHub from '@/pages/CustomerManagementHub';
import SecurityCenter from '@/pages/SecurityCenter';
import UserManagement from '@/pages/UserManagement';
import CustomerDatabaseAdmin from '@/pages/CustomerDatabaseAdmin';
import AdminBookingPreview from '@/pages/AdminBookingPreview';
import TipsManagement from '@/pages/TipsManagement';
import TierSystemConfig from '@/pages/TierSystemConfig';
import ReviewsPortal from '@/pages/ReviewsPortal';
import CustomerPortalDashboard from '@/pages/CustomerPortalDashboard';
import OrderStatus from '@/pages/OrderStatus';
import OrderConfirmation from '@/pages/OrderConfirmation';
import BookingConfirmation from '@/pages/BookingConfirmation';
import PaymentConfirmation from '@/pages/PaymentConfirmation';
import PaymentSuccess from '@/pages/PaymentSuccess';
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
import NotFound from '@/pages/NotFound';

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
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <DomainAwareRouter>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/signup" element={<SignUp />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPortal />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/customers" 
              element={
                <ProtectedRoute requireAdmin>
                  <CustomerManagementHub />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/subcontractors" 
              element={
                <ProtectedRoute requireAdmin>
                  <SubcontractorManagement />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/security" 
              element={
                <ProtectedRoute requireAdmin>
                  <SecurityCenter />
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
                  <SubcontractorManagement />
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
            <Route path="/schedule-service" element={<ScheduleService />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/booking" element={<ModernBooking />} />
            <Route path="/legacy-booking" element={<LegacyBooking />} />
            <Route path="/new-booking" element={<NewBooking />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin-portal" 
              element={
                <ProtectedRoute requireAdmin>
                  <AdminPortal />
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
            
            <Route path="*" element={<NotFound />} />
          </Routes>
          </DomainAwareRouter>
        </Router>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
