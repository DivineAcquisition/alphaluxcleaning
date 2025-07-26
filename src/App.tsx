
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

import Index from '@/pages/Index';
import ServiceDetails from '@/pages/ServiceDetails';
import PaymentSuccess from '@/pages/PaymentSuccess';
import Auth from '@/pages/Auth';
import AdminAuth from '@/pages/AdminAuth';
import AdminSetup from '@/pages/AdminSetup';
import AdminPanel from '@/pages/AdminPanel';
import AdminDashboard from '@/pages/AdminDashboard';
import SubcontractorManagement from '@/pages/SubcontractorManagement';
import MetricsDashboard from '@/pages/MetricsDashboard';
import ApplicationManager from '@/pages/ApplicationManager';
import SubcontractorAuth from '@/pages/SubcontractorAuth';
import SubcontractorHome from '@/pages/SubcontractorHome';
import SubcontractorOnboarding from '@/pages/SubcontractorOnboarding';
import SubcontractorApplication from '@/pages/SubcontractorApplication';
import SubcontractorDashboard from '@/pages/SubcontractorDashboard';
import CustomerServicePortal from '@/pages/CustomerServicePortal';
import OrderStatus from '@/pages/OrderStatus';
import TestEmail from '@/pages/TestEmail';
import CommercialThankYou from '@/pages/CommercialThankYou';
import NotFound from '@/pages/NotFound';
import PasswordReset from '@/pages/PasswordReset';
import SecureAdminCreation from '@/pages/SecureAdminCreation';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/service-details" element={<ServiceDetails />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin-auth" element={<AdminAuth />} />
            <Route path="/admin-setup" element={
              <ProtectedRoute requiredRole="admin">
                <AdminSetup />
              </ProtectedRoute>
            } />
            <Route path="/subcontractor-auth" element={<SubcontractorAuth />} />
            <Route path="/subcontractor-home" element={<SubcontractorHome />} />
            <Route path="/subcontractor-onboarding" element={<SubcontractorOnboarding />} />
            <Route path="/subcontractor-application" element={<SubcontractorApplication />} />
            <Route path="/order-status" element={<OrderStatus />} />
            <Route path="/test-email" element={<TestEmail />} />
            <Route path="/commercial-thank-you" element={<CommercialThankYou />} />
            <Route path="/password-reset" element={<PasswordReset />} />
            <Route path="/secure-admin-creation" element={<SecureAdminCreation />} />
            
            {/* Admin protected routes */}
            <Route path="/admin-panel" element={
              <ProtectedRoute requiredRole="admin">
                <AdminPanel />
              </ProtectedRoute>
            } />
            <Route path="/admin-dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/subcontractor-management" element={
              <ProtectedRoute requiredRole="admin">
                <SubcontractorManagement />
              </ProtectedRoute>
            } />
            <Route path="/metrics-dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <MetricsDashboard />
              </ProtectedRoute>
            } />
            <Route path="/application-manager" element={
              <ProtectedRoute requiredRole="admin">
                <ApplicationManager />
              </ProtectedRoute>
            } />
            
            {/* Employee/Subcontractor protected routes */}
            <Route path="/subcontractor-dashboard" element={
              <ProtectedRoute requiredRole="employee">
                <SubcontractorDashboard />
              </ProtectedRoute>
            } />
            
            {/* Customer protected routes */}
            <Route path="/my-services" element={
              <ProtectedRoute requiredRole="customer">
                <CustomerServicePortal />
              </ProtectedRoute>
            } />
            
            {/* 404 fallback */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
