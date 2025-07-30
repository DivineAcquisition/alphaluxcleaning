import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Footer } from '@/components/Footer';

// Core customer pages
import Index from '@/pages/Index';
import PaymentConfirmation from '@/pages/PaymentConfirmation';
import CustomerDashboard from '@/pages/CustomerDashboard';
import OrderStatus from '@/pages/OrderStatus';

// Subcontractor pages
import SubcontractorPortal from '@/pages/SubcontractorPortal';
import SubcontractorDashboard from '@/pages/SubcontractorDashboard';

// Admin pages (unified)
import AdminPortal from '@/pages/AdminPortal';
import AdminDashboard from '@/pages/AdminDashboard';
import OrderManagement from '@/pages/OrderManagement';
import ApplicationManager from '@/pages/ApplicationManager';
import SubcontractorManagement from '@/pages/SubcontractorManagement';
import MetricsDashboard from '@/pages/MetricsDashboard';

// Auth & utility pages
import Auth from '@/pages/Auth';
import PasswordReset from '@/pages/PasswordReset';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/password-reset" element={<PasswordReset />} />
                <Route path="/order-status" element={<OrderStatus />} />
                <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
                
                {/* Customer protected routes */}
                <Route path="/my-services" element={
                  <ProtectedRoute requiredRole="customer">
                    <CustomerDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Subcontractor routes */}
                <Route path="/subcontractor" element={<SubcontractorPortal />} />
                <Route path="/subcontractor-dashboard" element={
                  <ProtectedRoute allowedRoles={['subcontractor', 'admin']}>
                    <SubcontractorDashboard />
                  </ProtectedRoute>
                } />
                
                {/* Admin routes */}
                <Route path="/admin" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPortal />
                  </ProtectedRoute>
                } />
                <Route path="/admin-panel" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminPortal />
                  </ProtectedRoute>
                } />
                <Route path="/admin-dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/order-management" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <OrderManagement />
                  </ProtectedRoute>
                } />
                <Route path="/application-manager" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ApplicationManager />
                  </ProtectedRoute>
                } />
                <Route path="/subcontractor-management" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <SubcontractorManagement />
                  </ProtectedRoute>
                } />
                <Route path="/metrics-dashboard" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <MetricsDashboard />
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