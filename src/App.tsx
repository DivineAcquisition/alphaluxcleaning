
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';

// Pages
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import SignUp from '@/pages/SignUp';
import AdminDashboard from '@/pages/AdminDashboard';
import SubcontractorManagement from '@/pages/SubcontractorManagement';
import CustomerPortalDashboard from '@/pages/CustomerPortalDashboard';
import OrderStatus from '@/pages/OrderStatus';
import OrderConfirmation from '@/pages/OrderConfirmation';
import ScheduleService from '@/pages/ScheduleService';
import OAuthCallback from '@/pages/OAuthCallback';
import ModernBooking from '@/pages/ModernBooking';
import LegacyBooking from '@/pages/LegacyBooking';
import NewBooking from '@/pages/NewBooking';
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
          <Routes>
            <Route path="/" element={<Index />} />
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
            <Route path="/schedule-service" element={<ScheduleService />} />
            <Route path="/oauth/callback" element={<OAuthCallback />} />
            <Route path="/booking" element={<ModernBooking />} />
            <Route path="/legacy-booking" element={<LegacyBooking />} />
            <Route path="/new-booking" element={<NewBooking />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
