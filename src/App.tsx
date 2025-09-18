import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { HelmetProvider } from 'react-helmet-async';

// Essential booking pages only
import { DomainAwareHome } from '@/components/DomainAwareHome';
import OrderStatus from '@/pages/OrderStatus';
import OrderConfirmation from '@/pages/OrderConfirmation';
import BookingConfirmation from '@/pages/BookingConfirmation';
import PaymentConfirmation from '@/pages/PaymentConfirmation';
import PaymentSuccess from '@/pages/PaymentSuccess';
import { WebhookTest } from '@/pages/WebhookTest';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Main booking route */}
            <Route path="/" element={<DomainAwareHome />} />
            
            {/* Essential booking confirmation and status pages */}
            <Route path="/order-status" element={<OrderStatus />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />
            <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            
            {/* Webhook testing */}
            <Route path="/test-webhook" element={<WebhookTest />} />
            
            {/* Health Endpoints for monitoring */}
            <Route path="/health/admin" element={<div>✅ Admin OK</div>} />
            <Route path="/health/book" element={<div>✅ Book OK</div>} />
            <Route path="/health/sub" element={<div>✅ Sub OK</div>} />
            <Route path="/health/portal" element={<div>✅ Portal OK</div>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
        <Sonner />
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;