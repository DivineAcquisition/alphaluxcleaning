import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from 'sonner';
import { useSquarePreloader } from '@/hooks/useSquarePreloader';
import { CheckCircle } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { BookingProvider } from '@/contexts/BookingContext';
import { SimpleBookingProvider } from '@/contexts/SimpleBookingContext';
import { TestModeBanner } from '@/components/admin/TestModeBanner';
import { DomainRedirect } from '@/components/DomainRedirect';

// Essential booking pages only
import { DomainAwareHome } from '@/components/DomainAwareHome';
import { Landing } from '@/pages/Landing';

// Lazy load booking flow pages
const SimpleHomeDetails = lazy(() => import('@/pages/simple-book/HomeDetails'));
const SimpleChoosePlan = lazy(() => import('@/pages/simple-book/ChoosePlan'));
const SimpleConfirmBook = lazy(() => import('@/pages/simple-book/ConfirmBook'));
const SimpleSuccess = lazy(() => import('@/pages/simple-book/Success'));
const BookSuccess = lazy(() => import('@/pages/book/Success')); // Keep for old bookings
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
import Pricing from '@/pages/Pricing';

// Dev Test Pages
import { DevTest } from '@/pages/DevTest';
import { DevTestScenarios } from '@/pages/DevTestScenarios';
import { DevTestDatabase } from '@/pages/DevTestDatabase';
import { DevTestPayments } from '@/pages/DevTestPayments';
import { DevTestWebhooks } from '@/pages/DevTestWebhooks';
import DevTestModeToggle from '@/pages/DevTestModeToggle';
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
        <SimpleBookingProvider>
          <BookingProvider>
            <Router>
            <DomainRedirect>
              <TestModeBanner />
            <Routes>
              {/* New Simplified Offer-Based Booking Flow */}
              <Route path="/book" element={<Suspense fallback={<div>Loading...</div>}><SimpleHomeDetails /></Suspense>} />
              <Route path="/book/home-details" element={<Suspense fallback={<div>Loading...</div>}><SimpleHomeDetails /></Suspense>} />
              <Route path="/book/choose-plan" element={<Suspense fallback={<div>Loading...</div>}><SimpleChoosePlan /></Suspense>} />
              <Route path="/book/confirm" element={<Suspense fallback={<div>Loading...</div>}><SimpleConfirmBook /></Suspense>} />
              <Route path="/book/success" element={<Suspense fallback={<div>Loading...</div>}><SimpleSuccess /></Suspense>} />
              
              {/* Redirects from old booking flow to new flow */}
              <Route path="/book/zip" element={<Navigate to="/book/home-details" replace />} />
              <Route path="/book/sqft" element={<Navigate to="/book/home-details" replace />} />
              <Route path="/book/home" element={<Navigate to="/book/home-details" replace />} />
              <Route path="/book/details" element={<Navigate to="/book/home-details" replace />} />
              <Route path="/book/service" element={<Navigate to="/book/choose-plan" replace />} />
              <Route path="/book/frequency" element={<Navigate to="/book/choose-plan" replace />} />
              <Route path="/book/schedule" element={<Navigate to="/book/confirm" replace />} />
              <Route path="/book/summary" element={<Navigate to="/book/confirm" replace />} />
              <Route path="/book/checkout" element={<Navigate to="/book/confirm" replace />} />
              <Route path="/book/confirmation/:bookingId" element={<Navigate to="/book/success" replace />} />
              
              {/* Landing page with marketing content */}
              <Route path="/landing" element={<Landing />} />
              
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
            
            {/* Pricing Page */}
            <Route path="/pricing" element={<Pricing />} />
            
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
            <Route path="/dev-test/test-mode" element={<DevTestModeToggle />} />
            <Route path="/booking-debug" element={<BookingDebug />} />
            <Route path="/email-tools" element={<EmailTools />} />
            
            {/* Health Endpoints for monitoring */}
            <Route path="/health/admin" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Admin OK</div>} />
            <Route path="/health/book" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Book OK</div>} />
            <Route path="/health/sub" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Sub OK</div>} />
            <Route path="/health/portal" element={<div className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-green-500" /> Portal OK</div>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
            </DomainRedirect>
        </Router>
        <Toaster />
        <Sonner />
        </BookingProvider>
        </SimpleBookingProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;