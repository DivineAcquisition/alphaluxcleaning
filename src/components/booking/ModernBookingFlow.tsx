import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { BookingSelectionPage } from './BookingSelectionPage';
import { BookingDetailsPage } from './BookingDetailsPage';
import { BookingCheckoutPage } from './BookingCheckoutPage';
import { BookingConfirmationPage } from './BookingConfirmationPage';
import { ChatFallback } from '@/components/customer/ChatFallback';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, ArrowRight, HelpCircle } from 'lucide-react';

interface BookingData {
  // Service Selection
  homeSize: string;
  serviceType: string;
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

const steps = [
  { id: 1, title: 'Service', description: 'Choose your service' },
  { id: 2, title: 'Details', description: 'Date & address' },
  { id: 3, title: 'Payment', description: 'Review & pay' },
  { id: 4, title: 'Confirmation', description: 'Complete' }
];

export function ModernBookingFlow() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentStep, setCurrentStep] = useState(1);
  const [showMobileHelp, setShowMobileHelp] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    homeSize: '',
    serviceType: '',
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
    paymentType: 'pay_after_service'
  });

  const progress = (currentStep / steps.length) * 100;

  const updateBookingData = (updates: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...updates }));
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return bookingData.homeSize && bookingData.serviceType && bookingData.frequency;
      case 2:
        return bookingData.serviceDate && bookingData.serviceTime && 
               bookingData.address.street && bookingData.contactNumber;
      case 3:
        return true; // Payment validation handled in checkout page
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      // Smooth scroll to top with animation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePaymentSuccess = async (sessionId: string) => {
    console.log('🎉 Payment/Authorization successful:', sessionId);
    updateBookingData({ stripeSessionId: sessionId });
    
    // Add success message based on payment type
    if (bookingData.paymentType === 'pay_after_service') {
      toast.success('Card authorized successfully! You will be charged after service completion.');
    } else {
      toast.success('Payment processed successfully!');
    }
    
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BookingSelectionPage 
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <BookingDetailsPage 
            bookingData={bookingData}
            updateBookingData={updateBookingData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <BookingCheckoutPage 
            bookingData={bookingData}
            updateBookingData={updateBookingData}
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
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
    </div>
  );
}