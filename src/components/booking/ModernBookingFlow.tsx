import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useBookingRetry, bookingRetryStrategies } from '@/hooks/useBookingRetry';
import { useBookingWebhook } from '@/hooks/useBookingWebhook';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import { BookingSelectionPage } from './BookingSelectionPage';
import { BookingDetailsPage } from './BookingDetailsPage';
import { BookingCheckoutPage } from './BookingCheckoutPage';
import { BookingConfirmationPage } from './BookingConfirmationPage';
import { BookingErrorBoundary } from './BookingErrorBoundary';
import { BookingLoadingState } from './BookingLoadingState';
import { MobileBottomNav } from './MobileBookingOptimizations';
import { ChatFallback } from '@/components/customer/ChatFallback';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, ArrowRight, HelpCircle, Wifi, WifiOff } from 'lucide-react';

interface BookingData {
  // Service Selection
  homeSize: string;
  frequency: string;
  addOns: string[];
  
  // Service Details
  serviceDate: string;
  serviceTime: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactNumber: string;
  specialInstructions: string;
  
  // Pricing
  basePrice: number;
  addOnPrices: { [key: string]: number };
  frequencyDiscount: number;
  nextDayFee: number;
  promoDiscount: number;
  totalPrice: number;
  
  // Payment
  paymentType: 'pay_after_service' | '25_percent_with_discount';
  stripeSessionId?: string;
}

interface Props {
  initialData?: Partial<BookingData>;
  onDataUpdate?: (data: Partial<BookingData>) => void;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  guestMode?: boolean;
}

const steps = [
  { id: 1, title: 'Service', description: 'Choose your service' },
  { id: 2, title: 'Details', description: 'Date & address' },
  { id: 3, title: 'Payment', description: 'Review & pay' },
  { id: 4, title: 'Confirmation', description: 'Complete' }
];

export function ModernBookingFlow({ 
  initialData = {}, 
  onDataUpdate, 
  onStepChange, 
  onComplete,
  guestMode = false 
}: Props = {}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileHelp, setShowMobileHelp] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasError, setHasError] = useState(false);
  const { sendBookingWebhook } = useBookingWebhook();
  
  // Retry functionality for booking operations
  const retryHook = useBookingRetry({
    ...bookingRetryStrategies.submission,
    onError: (error, attempt) => {
      console.error(`Booking operation failed (attempt ${attempt}):`, error);
      setHasError(true);
    },
    onSuccess: () => {
      setHasError(false);
    }
  });
  
  // Get initial step from URL or default to 1
  const urlStep = parseInt(searchParams.get('step') || '1', 10);
  const initialStep = urlStep >= 1 && urlStep <= 4 ? urlStep : 1;
  const [currentStep, setCurrentStep] = useState(initialStep);

  // Use form persistence for auto-save
  const storageKey = guestMode ? 'guestBookingData' : 'authenticatedBookingData';
  const {
    data: bookingData,
    updateData: updateBookingData,
    clearData,
    lastSaved,
    isLoading: isPersistenceLoading
  } = useFormPersistence<BookingData>({
    homeSize: '',
    frequency: '',
    addOns: [],
    serviceDate: '',
    serviceTime: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    },
    contactNumber: '',
    specialInstructions: '',
    basePrice: 0,
    addOnPrices: {},
    frequencyDiscount: 0,
    nextDayFee: 0,
    promoDiscount: 0,
    totalPrice: 0,
    paymentType: 'pay_after_service',
    ...initialData
  }, {
    storageKey,
    debounceMs: 500
  });

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost - your progress is saved locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update URL when step changes
  useEffect(() => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('step', currentStep.toString());
    setSearchParams(newParams, { replace: true });
    onStepChange?.(currentStep);
  }, [currentStep, searchParams, setSearchParams, onStepChange]);

  // Notify parent when data changes
  useEffect(() => {
    onDataUpdate?.(bookingData);
  }, [bookingData, onDataUpdate]);

  const progress = (currentStep / steps.length) * 100;

  const handleDataUpdate = useCallback((updates: Partial<BookingData>) => {
    if (!isOnline) {
      toast.info('Changes saved locally - will sync when connection is restored');
    }
    updateBookingData(updates);
  }, [updateBookingData, isOnline]);

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return bookingData.homeSize && bookingData.frequency;
      case 2:
        return bookingData.serviceDate && bookingData.serviceTime && 
               bookingData.address.street && bookingData.contactNumber;
      case 3:
        return true; // Payment validation handled in checkout page
      default:
        return true;
    }
  };

  const sendWebhookForStep = useCallback(async (step: number) => {
    try {
      const customerInfo = {
        name: user?.user_metadata?.full_name || 'Guest User',
        email: user?.email || 'guest@example.com',
        phone: bookingData.contactNumber || '',
        address: bookingData.address.street || '',
        city: bookingData.address.city || '',
        state: bookingData.address.state || 'CA',
        zipCode: bookingData.address.zipCode || ''
      };

      const webhookData = {
        // Service Selection Data
        homeSize: bookingData.homeSize,
        serviceType: 'residential_cleaning',
        frequency: bookingData.frequency,
        addOns: bookingData.addOns,
        
        // Service Details
        serviceDate: bookingData.serviceDate,
        serviceTime: bookingData.serviceTime,
        address: bookingData.address,
        contactNumber: bookingData.contactNumber,
        specialInstructions: bookingData.specialInstructions,
        
        // Customer Information
        customerInfo,
        
        // Pricing Information
        basePrice: bookingData.basePrice,
        addOnPrices: bookingData.addOnPrices,
        frequencyDiscount: bookingData.frequencyDiscount,
        totalPrice: bookingData.totalPrice,
        
        // Payment Information
        paymentType: bookingData.paymentType === 'pay_after_service' ? 'prepayment' as const 
                   : bookingData.paymentType === '25_percent_with_discount' ? 'half' as const
                   : 'full' as const,
        paymentAmount: bookingData.paymentType === '25_percent_with_discount' 
          ? bookingData.totalPrice * 0.25 
          : 0,
        
        // Step information
        bookingStep: step === 1 ? 'service_selection' as const 
                   : step === 2 ? 'service_details' as const
                   : step === 3 ? 'payment' as const
                   : 'confirmation' as const,
        
        // Session info
        orderId: `booking_${Date.now()}`,
        bookingId: `session_${Date.now()}`
      };

      await sendBookingWebhook(webhookData);
    } catch (error) {
      console.error('Webhook error at step', step, ':', error);
      // Don't block the user flow for webhook errors
    }
  }, [bookingData, user, sendBookingWebhook]);

  const handleNext = async () => {
    if (canProceedToNext() && currentStep < 4) {
      // Send webhook for current step before moving to next
      await sendWebhookForStep(currentStep);
      
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePaymentSuccess = useCallback(async (sessionId: string) => {
    console.log('🎉 Payment/Authorization successful:', sessionId);
    handleDataUpdate({ stripeSessionId: sessionId });
    
    // Store order information for potential redirects
    localStorage.setItem('current_order_id', sessionId);
    
    // Get order details to send to webhooks
    try {
      // Try to get order details using session_id (which is actually payment_intent_id or setup_intent_id)
      const { data: orderData, error } = await supabase.functions.invoke('get-order-details', {
        body: { session_id: sessionId }
      });
      
      if (orderData && !error) {
        console.log('Retrieved order data for webhook:', orderData);
        
        // Store the actual order_id if we got it
        if (orderData.order_id) {
          localStorage.setItem('current_order_id', orderData.order_id);
        }
        
        // Send to enhanced webhook system if we have order_id
        if (orderData.order_id) {
          await supabase.functions.invoke('enhanced-booking-webhook-v2', {
            body: {
              ...bookingData,
              order_id: orderData.order_id,
              session_id: sessionId,
              trigger_event: 'confirmation',
              timestamp: new Date().toISOString(),
              source: 'bay_area_cleaning_pros_website'
            }
          });
        }
        
        // Also send to Zapier as backup
        await supabase.functions.invoke('send-booking-transaction-to-zapier', {
          body: {
            transactionData: {
              ...bookingData,
              order_id: orderData.order_id,
              session_id: sessionId,
              timestamp: new Date().toISOString(),
              source: 'bay_area_cleaning_pros_website',
              trigger_event: 'booking_confirmation'
            },
            type: 'booking_confirmation'
          }
        });
        
        console.log('All confirmation webhooks sent successfully');
      } else {
        console.warn('Could not retrieve order data for webhooks:', error);
        // Send basic webhook data
        await sendWebhookForStep(4);
      }
    } catch (webhookError) {
      console.error('Failed to send confirmation webhooks:', webhookError);
      // Still try basic webhook
      await sendWebhookForStep(4);
    }
    
    // Add success message based on payment type
    if (bookingData.paymentType === 'pay_after_service') {
      toast.success('Card authorized successfully! You will be charged after service completion.');
    } else {
      toast.success('Payment processed successfully!');
    }
    
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Clear saved data on successful completion
    clearData();
    onComplete?.();
  }, [bookingData, handleDataUpdate, clearData, onComplete, sendWebhookForStep]);


  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BookingSelectionPage 
            bookingData={bookingData}
            updateBookingData={handleDataUpdate}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <BookingDetailsPage 
            bookingData={bookingData}
            updateBookingData={handleDataUpdate}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <BookingCheckoutPage 
            bookingData={bookingData}
            updateBookingData={handleDataUpdate}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <BookingConfirmationPage 
            bookingData={bookingData}
          />
        );
      default:
        return null;
    }
  };

  // Show loading state while persistence is loading
  if (isPersistenceLoading) {
    return <BookingLoadingState step={currentStep} totalSteps={steps.length} />;
  }

  return (
    <BookingErrorBoundary onError={(error) => setHasError(true)}>
      <div className={`min-h-screen bg-gradient-to-br from-background to-muted/20 ${isMobile ? 'pb-20' : ''}`}>
        {/* Connection status indicator */}
        {!isOnline && (
          <div className="fixed top-4 left-4 z-50 bg-warning/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-warning-foreground flex items-center gap-2">
            <WifiOff className="h-3 w-3" />
            Offline - Changes saved locally
          </div>
        )}

        {/* Auto-save indicator */}
        {lastSaved && (
          <div className="fixed top-4 right-4 z-50 bg-muted/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-muted-foreground">
            <Wifi className="h-3 w-3 mr-1 inline" />
            Auto-saved {new Date(lastSaved).toLocaleTimeString()}
          </div>
        )}
      
      {/* Header with Progress */}
      <div className="bg-card border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="max-w-4xl mx-auto">
            {/* Mobile Header */}
            {isMobile && (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {currentStep > 1 && (
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>
                  )}
                  <div>
                    <h1 className="text-lg font-semibold">Book Your Service</h1>
                    <p className="text-sm text-muted-foreground">
                      Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowMobileHelp(!showMobileHelp)}
                >
                  <HelpCircle className="h-5 w-5" />
                </Button>
              </div>
            )}
            
            {/* Mobile Help Section */}
            {isMobile && showMobileHelp && (
              <div className="mb-4 p-4 bg-muted/50 rounded-lg">
                <ChatFallback className="mb-2" />
                <p className="text-xs text-muted-foreground text-center">
                  Need assistance with your booking? Our team is here to help!
                </p>
              </div>
            )}
            
            {/* Progress Bar */}
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Step Indicators - Hidden on mobile */}
            {!isMobile && (
              <div className="flex items-center justify-between">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center space-x-3 ${
                      index < steps.length - 1 ? 'flex-1' : ''
                    }`}>
                      <div className="flex flex-col items-center">
                        <div className={`
                          w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all duration-300
                          ${step.id <= currentStep 
                            ? 'border-primary bg-primary text-primary-foreground' 
                            : 'border-muted text-muted-foreground'
                          }
                        `}>
                          {step.id}
                        </div>
                        <div className="text-center mt-2">
                          <div className={`text-sm font-medium ${
                            step.id <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {step.title}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {step.description}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Connector Line */}
                    {index < steps.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-4 ${
                        step.id < currentStep ? 'bg-primary' : 'bg-muted'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Mobile Step Dots */}
            {isMobile && (
              <div className="flex items-center justify-center gap-2">
                {steps.map((step) => (
                  <div
                    key={step.id}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      step.id <= currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            {renderCurrentStep()}
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        {isMobile && (
          <MobileBottomNav
            onBack={currentStep > 1 ? handleBack : undefined}
            onNext={canProceedToNext() && currentStep < 4 ? handleNext : undefined}
            nextLabel={currentStep === 3 ? "Complete Payment" : "Continue"}
            nextDisabled={!canProceedToNext()}
            showBack={currentStep > 1}
          />
        )}
      </div>
    </BookingErrorBoundary>
  );
}