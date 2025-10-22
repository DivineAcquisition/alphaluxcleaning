import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from 'sonner';
import { useSquarePreloader } from '@/hooks/useSquarePreloader';
import { CheckCircle } from 'lucide-react';

// Essential booking pages only
import { DomainAwareHome } from '@/components/DomainAwareHome';
import OrderStatus from '@/pages/OrderStatus';
import OrderConfirmation from '@/pages/OrderConfirmation';
import ConfirmationPreview from '@/pages/ConfirmationPreview';
import PaymentSuccess from '@/pages/PaymentSuccess';
import { WebhookTest } from '@/pages/WebhookTest';
import AdminLogin from '@/pages/AdminLogin';
import AdminOTPLogin from '@/pages/AdminOTPLogin';
import AdminAuthLogin from '@/pages/AdminAuthLogin';
import AdminStatus from '@/pages/AdminStatus';
import AdminEmailTemplates from '@/pages/AdminEmailTemplates';
import AdminEmailLogs from '@/pages/AdminEmailLogs';
import AdminEmailEvents from '@/pages/AdminEmailEvents';
import AdminUsers from '@/pages/AdminUsers';
import AdminDashboard from '@/pages/AdminDashboard';
import { AdminRoute } from '@/components/AdminRoute';
import { ReferralLanding } from '@/pages/ReferralLanding';
import { Referrals } from '@/pages/Referrals';
import GetReferral from '@/pages/GetReferral';
import LearnMore from '@/pages/LearnMore';
import RecurringServices from '@/pages/RecurringServices';
import StartRecurring from '@/pages/StartRecurring';

// Dev Test Pages
import { DevTest } from '@/pages/DevTest';
import { DevTestScenarios } from '@/pages/DevTestScenarios';
import { DevTestDatabase } from '@/pages/DevTestDatabase';
import { DevTestPayments } from '@/pages/DevTestPayments';
import { DevTestWebhooks } from '@/pages/DevTestWebhooks';
import BookingDebug from '@/pages/BookingDebug';
import EmailTools from '@/pages/EmailTools';
import HousecallProSettings from '@/pages/admin/HousecallProSettings';
import HousecallProLogs from '@/pages/admin/HousecallProLogs';
import HCPTestSuite from '@/pages/admin/HCPTestSuite';
import PromoCodes from '@/pages/admin/PromoCodes';

import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  // Preload Square for better performance
  useSquarePreloader();
  
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
            <Route path="/get-referral" element={<GetReferral />} />
            
            {/* Lead Capture */}
            <Route path="/learn-more" element={<LearnMore />} />
            
            {/* Recurring Services */}
            <Route path="/recurring-services" element={<RecurringServices />} />
            <Route path="/start-recurring" element={<StartRecurring />} />
            
            {/* Admin Routes */}
            <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-otp-login" element={<AdminOTPLogin />} />
          <Route path="/admin-auth-login" element={<AdminAuthLogin />} />
          <Route path="/admin-status" element={<AdminStatus />} />
          <Route path="/admin/email/templates" element={<AdminEmailTemplates />} />
          <Route path="/admin/email/logs" element={<AdminEmailLogs />} />
          <Route path="/admin/email/events" element={<AdminEmailEvents />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/integrations/housecall-pro" element={<HousecallProSettings />} />
          <Route path="/admin/integrations/housecall-pro/logs" element={<HousecallProLogs />} />
          <Route path="/admin/integrations/housecall-pro/test" element={<HCPTestSuite />} />
          <Route path="/admin/promos" element={<PromoCodes />} />
            <Route path="/admin" element={
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
            <Route path="/email-tools" element={<EmailTools />} />
            
            {/* Health Endpoints for monitoring */}
            <Route path="/health/admin" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Admin OK</div>} />
            <Route path="/health/book" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Book OK</div>} />
            <Route path="/health/sub" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Sub OK</div>} />
            <Route path="/health/portal" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Portal OK</div>} />
            
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