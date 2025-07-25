import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import PaymentSuccess from "./pages/PaymentSuccess";
import ServiceDetails from "./pages/ServiceDetails";
import OrderStatus from "./pages/OrderStatus";
import AdminAuth from "./pages/AdminAuth";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPanel from "./pages/AdminPanel";
import PasswordReset from "./pages/PasswordReset";
import SubcontractorAuth from "./pages/SubcontractorAuth";
import SubcontractorHome from "./pages/SubcontractorHome";
import SubcontractorOnboarding from "./pages/SubcontractorOnboarding";
import SubcontractorDashboard from "./pages/SubcontractorDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

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
          <Route path="/admin-auth" element={<AdminAuth />} />
          <Route path="/admin-panel" element={<AdminPanel />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/subcontractor-home" element={<SubcontractorHome />} />
          <Route path="/subcontractor-auth" element={<SubcontractorAuth />} />
          <Route path="/subcontractor-onboarding" element={<SubcontractorOnboarding />} />
          <Route path="/subcontractor-dashboard" element={<SubcontractorDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
