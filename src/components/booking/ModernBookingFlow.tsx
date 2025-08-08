import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { BookingSelectionPage } from './BookingSelectionPage';
import { BookingDetailsPage } from './BookingDetailsPage';
import { BookingCheckoutPage } from './BookingCheckoutPage';
import { BookingConfirmationPage } from './BookingConfirmationPage';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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
  paymentType: 'full' | 'deposit';
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
  const [currentStep, setCurrentStep] = useState(1);
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
    paymentType: 'full'
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
    updateBookingData({ stripeSessionId: sessionId });
    
    // Send to Zapier if next-day booking is selected
    if (bookingData.nextDayFee > 0) {
      await sendBookingToZapier(bookingData, sessionId);
    }
    
    setCurrentStep(4);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sendBookingToZapier = async (booking: BookingData, sessionId: string) => {
    try {
      const zapierData = {
        // Booking Details
        booking_id: sessionId,
        service_type: booking.serviceType,
        home_size: booking.homeSize,
        frequency: booking.frequency,
        
        // Scheduling
        service_date: booking.serviceDate,
        service_time: booking.serviceTime,
        is_next_day_priority: booking.nextDayFee > 0,
        next_day_fee: booking.nextDayFee,
        
        // Customer Info
        customer_name: 'Guest', // Will be updated with real data
        customer_phone: booking.contactNumber,
        customer_address: {
          street: booking.address.street,
          city: booking.address.city,
          state: booking.address.state,
          zip_code: booking.address.zipCode
        },
        
        // Service Details
        add_ons: booking.addOns,
        special_instructions: booking.specialInstructions,
        
        // Pricing
        base_price: booking.basePrice,
        add_on_prices: booking.addOnPrices,
        frequency_discount: booking.frequencyDiscount,
        promo_discount: booking.promoDiscount,
        total_price: booking.totalPrice,
        payment_type: booking.paymentType,
        
        // Metadata
        booking_source: 'website',
        created_at: new Date().toISOString(),
        requires_priority_handling: true
      };

      await supabase.functions.invoke('send-transaction-to-zapier', {
        body: {
          transactionData: zapierData,
          type: 'next_day_booking'
        }
      });

      toast.success('Priority booking notification sent successfully!');
    } catch (error) {
      console.error('Failed to send booking to Zapier:', error);
      toast.error('Booking confirmed, but notification failed. We will contact you directly.');
    }
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
            {/* Progress Bar */}
            <div className="mb-4">
              <Progress value={progress} className="h-2" />
            </div>
            
            {/* Step Indicators */}
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
                      <div className="text-center mt-2 hidden sm:block">
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