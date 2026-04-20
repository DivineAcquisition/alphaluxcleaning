import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from 'sonner';
import { CheckCircle } from 'lucide-react';
import { lazy, Suspense } from 'react';
import { BookingProvider } from '@/contexts/BookingContext';
import { TestModeBanner } from '@/components/admin/TestModeBanner';
import { DomainRedirect } from '@/components/DomainRedirect';
import { UTMTracker } from '@/components/UTMTracker';

// Essential booking pages only
import { DomainAwareHome } from '@/components/DomainAwareHome';
import { Landing } from '@/spa-pages/Landing';

// Lazy load booking flow pages
const BookZip = lazy(() => import('@/spa-pages/book/Zip'));
const BookSquareFeet = lazy(() => import('@/spa-pages/book/SquareFeet'));
const BookOffer = lazy(() => import('@/spa-pages/book/Offer'));
const BookCheckout = lazy(() => import('@/spa-pages/book/Checkout'));
const BookDetails = lazy(() => import('@/spa-pages/book/Details'));
const BookConfirmation = lazy(() => import('@/spa-pages/book/Confirmation'));
const BookSuccess = lazy(() => import('@/spa-pages/book/Success')); // Keep for old bookings
import OrderStatus from '@/spa-pages/OrderStatus';
import OrderConfirmation from '@/spa-pages/OrderConfirmation';
import ConfirmationPreview from '@/spa-pages/ConfirmationPreview';
import PaymentSuccess from '@/spa-pages/PaymentSuccess';
import { WebhookTest } from '@/spa-pages/WebhookTest';
import AdminLogin from '@/spa-pages/AdminLogin';
import AdminOTPLogin from '@/spa-pages/AdminOTPLogin';
import AdminAuthLogin from '@/spa-pages/AdminAuthLogin';
import AdminStatus from '@/spa-pages/AdminStatus';
import AdminEmailTemplates from '@/spa-pages/AdminEmailTemplates';
import AdminEmailLogs from '@/spa-pages/AdminEmailLogs';
import AdminEmailEvents from '@/spa-pages/AdminEmailEvents';
import AdminUsers from '@/spa-pages/AdminUsers';
import AdminDashboard from '@/spa-pages/AdminDashboard';
import { AdminRoute } from '@/components/AdminRoute';
import { ReferralLanding } from '@/spa-pages/ReferralLanding';
import { Referrals } from '@/spa-pages/Referrals';
import GetReferral from '@/spa-pages/GetReferral';
import LearnMore from '@/spa-pages/LearnMore';
import RecurringServices from '@/spa-pages/RecurringServices';
import StartRecurring from '@/spa-pages/StartRecurring';
import Pricing from '@/spa-pages/Pricing';
import Careers from '@/spa-pages/Careers';

// Dev Test Pages
import { DevTest } from '@/spa-pages/DevTest';
import { DevTestScenarios } from '@/spa-pages/DevTestScenarios';
import { DevTestDatabase } from '@/spa-pages/DevTestDatabase';
import { DevTestPayments } from '@/spa-pages/DevTestPayments';
import { DevTestWebhooks } from '@/spa-pages/DevTestWebhooks';
import DevTestModeToggle from '@/spa-pages/DevTestModeToggle';
import BookingDebug from '@/spa-pages/BookingDebug';
import EmailTools from '@/spa-pages/EmailTools';
import HousecallProSettings from '@/spa-pages/admin/HousecallProSettings';
import HousecallProLogs from '@/spa-pages/admin/HousecallProLogs';
import HCPTestSuite from '@/spa-pages/admin/HCPTestSuite';
import PromoCodes from '@/spa-pages/admin/PromoCodes';
import BookingMonitor from '@/spa-pages/admin/BookingMonitor';
import BookingTester from '@/spa-pages/admin/BookingTester';
import DatabaseWatcher from '@/spa-pages/admin/DatabaseWatcher';
import ConversionOptimization from '@/spa-pages/admin/ConversionOptimization';
import Waitlist from '@/spa-pages/Waitlist';
import CallPage from '@/spa-pages/CallPage';

import NotFound from '@/spa-pages/NotFound';
import React from 'react';

const queryClient = new QueryClient();

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <BookingProvider>
          <Router>
          <DomainRedirect>
            <UTMTracker />
            <TestModeBanner />
          <Routes>
            {/* Optimized Booking Flow */}
            <Route path="/book" element={<Suspense fallback={<div>Loading...</div>}><BookZip /></Suspense>} />
            <Route path="/book/zip" element={<Suspense fallback={<div>Loading...</div>}><BookZip /></Suspense>} />
            <Route path="/book/sqft" element={<Suspense fallback={<div>Loading...</div>}><BookSquareFeet /></Suspense>} />
            <Route path="/book/offer" element={<Suspense fallback={<div>Loading...</div>}><BookOffer /></Suspense>} />
            <Route path="/book/checkout" element={<Suspense fallback={<div>Loading...</div>}><BookCheckout /></Suspense>} />
            <Route path="/book/details" element={<Suspense fallback={<div>Loading...</div>}><BookDetails /></Suspense>} />
            <Route path="/book/confirmation" element={<Suspense fallback={<div>Loading...</div>}><BookConfirmation /></Suspense>} />
            
            {/* Redirects for old URLs */}
            <Route path="/book/home" element={<Navigate to="/book/sqft" replace />} />
            <Route path="/book/service" element={<Navigate to="/book/offer" replace />} />
            <Route path="/book/frequency" element={<Navigate to="/book/offer" replace />} />
            <Route path="/book/schedule" element={<Navigate to="/book/details" replace />} />
            <Route path="/book/summary" element={<Navigate to="/book/offer" replace />} />
              
              {/* Landing page with marketing content */}
              <Route path="/landing" element={<Landing />} />
              
              {/* Main booking route - redirect to booking flow */}
              <Route path="/" element={<Navigate to="/book/zip" replace />} />
            
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
            
            {/* Call Page */}
            <Route path="/call" element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./spa-pages/CallPage')))}
              </Suspense>
            } />
            
            {/* Waitlist Page */}
            <Route path="/waitlist" element={<Waitlist />} />
            
            {/* Pricing Page */}
            <Route path="/pricing" element={<Pricing />} />
            
            {/* Careers / Hiring Page */}
            <Route path="/careers" element={<Careers />} />
            <Route path="/jobs" element={<Navigate to="/careers" replace />} />
            <Route path="/hiring" element={<Navigate to="/careers" replace />} />
            
            {/* Printable Pricing Sheet */}
            <Route path="/pricing-sheet" element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./spa-pages/PricingSheet')))}
              </Suspense>
            } />
            
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
          <Route path="/admin/csr-booking" element={
            <AdminRoute requiredRole="ops">
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./spa-pages/admin/CSRBookingForm')))}
              </Suspense>
            </AdminRoute>
          } />
          <Route path="/admin/booking-monitor" element={
            <AdminRoute>
              <BookingMonitor />
            </AdminRoute>
          } />
          <Route path="/admin/booking-tester" element={
            <AdminRoute>
              <BookingTester />
            </AdminRoute>
          } />
          <Route path="/admin/database-watcher" element={
            <AdminRoute>
              <DatabaseWatcher />
            </AdminRoute>
          } />
          <Route path="/admin/conversion" element={
            <AdminRoute>
              <ConversionOptimization />
            </AdminRoute>
          } />
          <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            } />
            
            {/* Payment Link Public Page */}
            <Route path="/pay/:bookingId" element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./spa-pages/PaymentLinkPage')))}
              </Suspense>
            } />
            
            {/* Dev Test Routes */}
            <Route path="/dev-test" element={<DevTest />} />
            <Route path="/dev-test/scenarios" element={<DevTestScenarios />} />
            <Route path="/dev-test/database" element={<DevTestDatabase />} />
            <Route path="/dev-test/payments" element={<DevTestPayments />} />
            <Route path="/dev-test/webhooks" element={<DevTestWebhooks />} />
            <Route path="/dev-test/test-mode" element={<DevTestModeToggle />} />
            <Route path="/dev-test/cleanup" element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./spa-pages/DevTestCleanup')))}
              </Suspense>
            } />
            <Route path="/demo-booking" element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(React.lazy(() => import('./spa-pages/DemoBooking')))}
              </Suspense>
            } />
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
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;