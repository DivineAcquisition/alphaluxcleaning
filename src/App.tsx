import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from 'sonner';
import { useStripePreloader } from '@/hooks/useStripePreloader';

// Essential booking pages only
import { DomainAwareHome } from '@/components/DomainAwareHome';
import OrderStatus from '@/pages/OrderStatus';
import OrderConfirmation from '@/pages/OrderConfirmation';
import ConfirmationPreview from '@/pages/ConfirmationPreview';
import PaymentSuccess from '@/pages/PaymentSuccess';
import { WebhookTest } from '@/pages/WebhookTest';
import AdminLogin from '@/pages/AdminLogin';
import AdminOTPLogin from '@/pages/AdminOTPLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import { AdminRoute } from '@/components/AdminRoute';
import { ReferralLanding } from '@/pages/ReferralLanding';
import { Referrals } from '@/pages/Referrals';

// Dev Test Pages
import { DevTest } from '@/pages/DevTest';
import { DevTestScenarios } from '@/pages/DevTestScenarios';
import { DevTestDatabase } from '@/pages/DevTestDatabase';
import { DevTestPayments } from '@/pages/DevTestPayments';
import { DevTestWebhooks } from '@/pages/DevTestWebhooks';
import BookingDebug from '@/pages/BookingDebug';

import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  // Preload Stripe for better performance
  useStripePreloader();
  
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Main booking route */}
            <Route path="/" element={<DomainAwareHome />} />
            
            {/* Essential booking confirmation and status pages */}
            <Route path="/order-status" element={<OrderStatus />} />
            <Route path="/order-confirmation/:bookingId?" element={<OrderConfirmation />} />
            <Route path="/confirmation-preview" element={<ConfirmationPreview />} />
            <Route path="/payment-success" element={<PaymentSuccess />} />
            
            {/* Webhook testing */}
            <Route path="/test-webhook" element={<WebhookTest />} />
            
            {/* Referral Routes */}
            <Route path="/ref/:code" element={<ReferralLanding />} />
            <Route path="/referrals" element={<Referrals />} />
            <Route path="/account/referrals" element={<Referrals />} />
            
            {/* Admin Routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin-otp-login" element={<AdminOTPLogin />} />
            <Route path="/admin-dashboard" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            
            {/* Dev Test Routes */}
            <Route path="/dev-test" element={<DevTest />} />
            <Route path="/dev-test/scenarios" element={<DevTestScenarios />} />
            <Route path="/dev-test/database" element={<DevTestDatabase />} />
            <Route path="/dev-test/payments" element={<DevTestPayments />} />
            <Route path="/dev-test/webhooks" element={<DevTestWebhooks />} />
            <Route path="/booking-debug" element={<BookingDebug />} />
            
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