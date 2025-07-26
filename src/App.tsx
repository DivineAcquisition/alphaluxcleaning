import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
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

// Helper component to redirect routes to appropriate subdomains
const SubdomainRedirect = ({ children }: { children: React.ReactElement }) => {
  const currentHost = window.location.hostname;
  const currentPath = window.location.pathname;
  
  // Define routes for each subdomain
  const adminRoutes = ['/admin-auth', '/admin-panel', '/admin-dashboard', '/subcontractor-management', '/application-manager', '/password-reset'];
  const subcontractorRoutes = ['/subcontractor-home', '/subcontractor-auth', '/subcontractor-onboarding', '/subcontractor-dashboard', '/subcontractor-application'];
  const customerRoutes = ['/', '/payment-success', '/service-details', '/order-status', '/commercial-thank-you', '/test-email'];
  
  // Redirect to admin subdomain
  if (adminRoutes.includes(currentPath) && !currentHost.startsWith('admin.')) {
    const adminUrl = `https://admin.bayareacleaningpros.com${currentPath}${window.location.search}`;
    window.location.href = adminUrl;
    return null;
  }
  
  // Redirect to subcontractor subdomain
  if (subcontractorRoutes.includes(currentPath) && !currentHost.startsWith('subcon.')) {
    const subconUrl = `https://subcon.bayareacleaningpros.com${currentPath}${window.location.search}`;
    window.location.href = subconUrl;
    return null;
  }
  
  // Redirect to portal subdomain for customer pages
  if (customerRoutes.includes(currentPath) && !currentHost.startsWith('portal.') && !currentHost.includes('localhost') && !currentHost.includes('127.0.0.1')) {
    const portalUrl = `https://portal.bayareacleaningpros.com${currentPath}${window.location.search}`;
    window.location.href = portalUrl;
    return null;
  }
  
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SubdomainRedirect><Index /></SubdomainRedirect>} />
          <Route path="/payment-success" element={<SubdomainRedirect><PaymentSuccess /></SubdomainRedirect>} />
          <Route path="/service-details" element={<SubdomainRedirect><ServiceDetails /></SubdomainRedirect>} />
          <Route path="/order-status" element={<SubdomainRedirect><OrderStatus /></SubdomainRedirect>} />
          <Route path="/admin-auth" element={<SubdomainRedirect><AdminAuth /></SubdomainRedirect>} />
          <Route path="/admin-panel" element={<SubdomainRedirect><AdminPanel /></SubdomainRedirect>} />
          <Route path="/password-reset" element={<SubdomainRedirect><PasswordReset /></SubdomainRedirect>} />
          <Route path="/admin-dashboard" element={<SubdomainRedirect><AdminDashboard /></SubdomainRedirect>} />
          <Route path="/subcontractor-management" element={<SubdomainRedirect><SubcontractorManagement /></SubdomainRedirect>} />
          <Route path="/subcontractor-home" element={<SubdomainRedirect><SubcontractorHome /></SubdomainRedirect>} />
          <Route path="/subcontractor-auth" element={<SubdomainRedirect><SubcontractorAuth /></SubdomainRedirect>} />
          <Route path="/subcontractor-onboarding" element={<SubdomainRedirect><SubcontractorOnboarding /></SubdomainRedirect>} />
          <Route path="/subcontractor-dashboard" element={<SubdomainRedirect><SubcontractorDashboard /></SubdomainRedirect>} />
          <Route path="/subcontractor-application" element={<SubdomainRedirect><SubcontractorApplication /></SubdomainRedirect>} />
          <Route path="/application-manager" element={<SubdomainRedirect><ApplicationManager /></SubdomainRedirect>} />
          <Route path="/commercial-thank-you" element={<SubdomainRedirect><CommercialThankYou /></SubdomainRedirect>} />
          <Route path="/test-email" element={<SubdomainRedirect><TestEmail /></SubdomainRedirect>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
