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

// Helper component to redirect admin routes to admin subdomain
const AdminRedirect = ({ children }: { children: React.ReactElement }) => {
  const currentHost = window.location.hostname;
  const currentPath = window.location.pathname;
  
  // Admin routes that should be on admin subdomain
  const adminRoutes = ['/admin-auth', '/admin-panel', '/admin-dashboard', '/subcontractor-management', '/application-manager', '/password-reset'];
  
  // If we're on an admin route but not on admin subdomain, redirect
  if (adminRoutes.includes(currentPath) && !currentHost.startsWith('admin.')) {
    const adminUrl = `https://admin.bayareacleaningpros.com${currentPath}${window.location.search}`;
    window.location.href = adminUrl;
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
          <Route path="/" element={<Index />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/service-details" element={<ServiceDetails />} />
          <Route path="/order-status" element={<OrderStatus />} />
          <Route path="/admin-auth" element={<AdminRedirect><AdminAuth /></AdminRedirect>} />
          <Route path="/admin-panel" element={<AdminRedirect><AdminPanel /></AdminRedirect>} />
          <Route path="/password-reset" element={<AdminRedirect><PasswordReset /></AdminRedirect>} />
          <Route path="/admin-dashboard" element={<AdminRedirect><AdminDashboard /></AdminRedirect>} />
          <Route path="/subcontractor-management" element={<AdminRedirect><SubcontractorManagement /></AdminRedirect>} />
          <Route path="/subcontractor-home" element={<SubcontractorHome />} />
          <Route path="/subcontractor-auth" element={<SubcontractorAuth />} />
          <Route path="/subcontractor-onboarding" element={<SubcontractorOnboarding />} />
          <Route path="/subcontractor-dashboard" element={<SubcontractorDashboard />} />
          <Route path="/subcontractor-application" element={<SubcontractorApplication />} />
          <Route path="/application-manager" element={<AdminRedirect><ApplicationManager /></AdminRedirect>} />
          <Route path="/commercial-thank-you" element={<CommercialThankYou />} />
          <Route path="/test-email" element={<TestEmail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
