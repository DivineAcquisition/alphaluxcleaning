import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MetricsDashboard from "./pages/MetricsDashboard";
import Index from "./pages/Index";
import CustomerServicePortal from "./pages/CustomerServicePortal";
import PaymentSuccess from "./pages/PaymentSuccess";
import ServiceDetails from "./pages/ServiceDetails";
import OrderStatus from "./pages/OrderStatus";
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
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Dashboard Domain Routes */}
            {isDashboardDomain && (
              <>
                <Route path="/" element={<MetricsDashboard />} />
                <Route path="/admin-auth" element={<AdminAuth />} />
                <Route path="/password-reset" element={<PasswordReset />} />
              </>
            )}
            
            {/* Admin Domain Routes */}
            {isAdminDomain && (
              <>
                <Route path="/" element={<Navigate to="/admin-panel" replace />} />
                <Route path="/admin-auth" element={<AdminAuth />} />
                <Route path="/admin-panel" element={<AdminPanel />} />
                <Route path="/password-reset" element={<PasswordReset />} />
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
                <Route path="/subcontractor-management" element={<SubcontractorManagement />} />
                <Route path="/application-manager" element={<ApplicationManager />} />
                <Route path="/test-email" element={<TestEmail />} />
              </>
            )}
            
            {/* Subcontractor Domain Routes */}
            {isSubconDomain && (
              <>
                <Route path="/" element={<Navigate to="/subcontractor-home" replace />} />
                <Route path="/subcontractor-home" element={<SubcontractorHome />} />
                <Route path="/subcontractor-auth" element={<SubcontractorAuth />} />
                <Route path="/subcontractor-onboarding" element={<SubcontractorOnboarding />} />
                <Route path="/subcontractor-dashboard" element={<SubcontractorDashboard />} />
                <Route path="/subcontractor-application" element={<SubcontractorApplication />} />
              </>
            )}
            
            {/* Portal/Customer Domain Routes */}
            {isPortalDomain && (
              <>
                <Route path="/" element={<Index />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/service-details" element={<ServiceDetails />} />
                <Route path="/order-status" element={<OrderStatus />} />
                <Route path="/commercial-thank-you" element={<CommercialThankYou />} />
                <Route path="/my-services" element={<CustomerServicePortal />} />
              </>
            )}
            
            {/* Catch-all route for 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
