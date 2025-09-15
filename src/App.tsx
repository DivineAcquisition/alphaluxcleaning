
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { HelmetProvider } from 'react-helmet-async';

// Essential pages for booking flow
import { DomainAwareHome } from '@/components/DomainAwareHome';
import BookingConfirmation from '@/pages/BookingConfirmation';
import PaymentSuccess from '@/pages/PaymentSuccess';
import StripeTestPage from '@/pages/StripeTestPage';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Main booking flow */}
            <Route path="/" element={<DomainAwareHome />} />
            
            {/* Booking confirmation pages */}
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />
            <Route path="/booking-confirmation/:orderId" element={<BookingConfirmation />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            
            {/* Development and testing */}
            <Route path="/stripe-test" element={<StripeTestPage />} />
            
            {/* 404 page */}
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
