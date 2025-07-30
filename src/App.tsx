
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { Footer } from '@/components/Footer';

import Index from '@/pages/Index';
import ServiceDetails from '@/pages/ServiceDetails';
import PaymentSuccess from '@/pages/PaymentSuccess';
import PostPaymentScheduling from '@/pages/PostPaymentScheduling';
import CustomerServicePortal from '@/pages/CustomerServicePortal';
import OrderStatus from '@/pages/OrderStatus';
import CommercialThankYou from '@/pages/CommercialThankYou';
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
                <Route path="/service-details" element={<ServiceDetails />} />
                <Route path="/payment-success" element={<PaymentSuccess />} />
                <Route path="/post-payment-scheduling" element={<PostPaymentScheduling />} />
                <Route path="/order-status" element={<OrderStatus />} />
                <Route path="/commercial-thank-you" element={<CommercialThankYou />} />
                
                {/* Customer protected routes */}
                <Route path="/my-services" element={
                  <ProtectedRoute requiredRole="customer">
                    <CustomerServicePortal />
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
