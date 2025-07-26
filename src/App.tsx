import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import MetricsDashboard from "./pages/MetricsDashboard";
import Index from "./pages/Index";
import CustomerServicePortal from "./pages/CustomerServicePortal";
import PaymentSuccess from "./pages/PaymentSuccess";
import ServiceDetails from "./pages/ServiceDetails";
import OrderStatus from "./pages/OrderStatus";
import Auth from "./pages/Auth";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import SubcontractorManagement from "./pages/SubcontractorManagement";
import AdminPanel from "./pages/AdminPanel";
import PasswordReset from "./pages/PasswordReset";
import SubcontractorAuth from "./pages/SubcontractorAuth";
import SubcontractorHome from "./pages/SubcontractorHome";
import SubcontractorOnboarding from "./pages/SubcontractorOnboarding";
import SubcontractorDashboard from "./pages/SubcontractorDashboard";
import SubcontractorApplication from "./pages/SubcontractorApplication";
import ApplicationManager from "./pages/ApplicationManager";
import CommercialThankYou from "./pages/CommercialThankYou";
import TestEmail from "./pages/TestEmail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const currentHost = window.location.hostname;
  const currentPath = window.location.pathname;
  
  // Simplified routing for preview environment
  const isLovablePreview = currentHost.includes('lovable');
  
  // Determine which routes to show based on subdomain or path (for preview)
  const isAdminDomain = currentHost.startsWith('admin.') || (isLovablePreview && (currentPath.includes('admin') || currentPath.includes('/subcontractor-management') || currentPath.includes('/application-manager'))) || (currentHost.includes('localhost') && currentPath.includes('admin'));
  const isSubconDomain = currentHost.startsWith('subcon.') || (isLovablePreview && currentPath.includes('subcontractor')) || (currentHost.includes('localhost') && currentPath.includes('subcontractor'));
  const isDashboardDomain = currentHost.startsWith('dashboard.') || (isLovablePreview && currentPath.includes('dashboard')) || (currentHost.includes('localhost') && currentPath.includes('dashboard'));
  const isPortalDomain = currentHost.startsWith('portal.') || currentHost === 'bayareacleaningpros.com' || currentHost.includes('localhost') || currentHost.includes('127.0.0.1') || currentHost.includes('lovable.app') || isLovablePreview;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Universal Auth Route */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Dashboard Domain Routes - Admin/Employee Only */}
              {isDashboardDomain && (
                <>
                  <Route path="/" element={
                    <ProtectedRoute requiredRole="admin">
                      <MetricsDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin-auth" element={<AdminAuth />} />
                  <Route path="/password-reset" element={<PasswordReset />} />
                </>
              )}
              
              {/* Admin Domain Routes - Admin/Employee Only */}
              {isAdminDomain && (
                <>
                  <Route path="/" element={<Navigate to="/admin-panel" replace />} />
                  <Route path="/admin-auth" element={<AdminAuth />} />
                  <Route path="/admin-panel" element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPanel />
                    </ProtectedRoute>
                  } />
                  <Route path="/password-reset" element={<PasswordReset />} />
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
                  <Route path="/application-manager" element={
                    <ProtectedRoute requiredRole="admin">
                      <ApplicationManager />
                    </ProtectedRoute>
                  } />
                  <Route path="/test-email" element={
                    <ProtectedRoute requiredRole="admin">
                      <TestEmail />
                    </ProtectedRoute>
                  } />
                </>
              )}
              
              {/* Subcontractor Domain Routes - For Contractor Users */}
              {isSubconDomain && (
                <>
                  <Route path="/" element={<Navigate to="/subcontractor-home" replace />} />
                  <Route path="/subcontractor-home" element={
                    <ProtectedRoute>
                      <SubcontractorHome />
                    </ProtectedRoute>
                  } />
                  <Route path="/subcontractor-auth" element={<SubcontractorAuth />} />
                  <Route path="/subcontractor-onboarding" element={
                    <ProtectedRoute>
                      <SubcontractorOnboarding />
                    </ProtectedRoute>
                  } />
                  <Route path="/subcontractor-dashboard" element={
                    <ProtectedRoute>
                      <SubcontractorDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/subcontractor-application" element={<SubcontractorApplication />} />
                </>
              )}
              
              {/* Portal/Customer Domain Routes - Public for booking, protected for customer portal */}
              {isPortalDomain && (
                <>
                  <Route path="/" element={<Index />} />
                  <Route path="/payment-success" element={<PaymentSuccess />} />
                  <Route path="/service-details" element={<ServiceDetails />} />
                  <Route path="/order-status" element={<OrderStatus />} />
                  <Route path="/commercial-thank-you" element={<CommercialThankYou />} />
                  <Route path="/my-services" element={
                    <ProtectedRoute requiredRole="customer">
                      <CustomerServicePortal />
                    </ProtectedRoute>
                  } />
                  <Route path="/customer-service-portal" element={
                    <ProtectedRoute requiredRole="customer">
                      <CustomerServicePortal />
                    </ProtectedRoute>
                  } />
                </>
              )}
              
              {/* Catch-all route for 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
