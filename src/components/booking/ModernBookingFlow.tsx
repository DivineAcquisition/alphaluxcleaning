import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { NewPricingInterface } from '../pricing/NewPricingInterface';
import { BookingDetailsPage } from './BookingDetailsPage';
// BookingCheckoutPage removed - keeping simplified booking flow
import { BookingSummaryCard } from './BookingSummaryCard';
import { ProgressIndicator } from './ProgressIndicator';

// Define the structure for address
interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

// Define the structure for booking data
interface BookingData {
  serviceZipCode: string;
  homeSize: string;
  frequency: string;
  addOns: string[];
  serviceDate: string;
  serviceTime: string;
  address: Address;
  contactNumber: string;
  specialInstructions: string;
  basePrice: number;
  addOnPrices: { [key: string]: number };
  frequencyDiscount: number;
  nextDayFee: number;
  promoDiscount: number;
  totalPrice: number;
  paymentType: '25_percent_with_discount';
  stripeSessionId?: string;
  customerName?: string;
  customerEmail?: string;
}

interface ModernBookingFlowProps {
  initialData?: Partial<BookingData>;
  onDataUpdate?: (data: Partial<BookingData>) => void;
  onStepChange?: (step: number) => void;
  onComplete?: () => void;
  guestMode?: boolean;
}

export function ModernBookingFlow({
  initialData = {},
  onDataUpdate,
  onStepChange,
  onComplete,
  guestMode = false,
}: ModernBookingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<Partial<BookingData>>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  const updateData = (updates: Partial<BookingData>) => {
    const newData = { ...bookingData, ...updates };
    setBookingData(newData);
    onDataUpdate?.(newData);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBookingComplete = (paymentData: any) => {
    console.log('🎉 Booking completed:', paymentData);
    onComplete?.();
    
    // Clear any stored data
    setBookingData({});
    
    toast.success('Booking completed successfully!', {
      description: 'You will receive a confirmation email shortly.'
    });
  };

  // Helper function to get a representative zip code for a state
  const getZipCodeFromState = (stateCode: string): string => {
    switch (stateCode) {
      case 'TX': return '77001'; // Houston area
      case 'CA': return '90210'; // LA area
      default: return '77001';
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingData.serviceZipCode && bookingData.homeSize && bookingData.frequency;
      case 2:
        return bookingData.serviceDate && bookingData.serviceTime && 
               bookingData.address?.street && bookingData.contactNumber;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-teal-50 to-purple-50 dark:from-blue-950 dark:via-teal-950 dark:to-purple-950 animate-gradient" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(20,184,166,0.1),transparent_50%)]" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8 animate-fade-in">
            <ProgressIndicator 
              currentStep={currentStep} 
              steps={[
                { id: 1, title: 'Service Selection', description: 'Choose your cleaning service' },
                { id: 2, title: 'Details & Scheduling', description: 'Schedule and location info' },
                { id: 3, title: 'Payment', description: 'Complete your booking' }
              ]} 
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 animate-scale-in">
              <GlassCard className="shadow-2xl">
                <CardContent className="p-8">
                  {currentStep === 1 && (
                    <NewPricingInterface
                      onBookingSelect={(data) => {
                        updateData({
                          serviceZipCode: getZipCodeFromState(data.stateCode),
                          homeSize: data.homeSizeId,
                          frequency: data.frequencyId,
                          basePrice: data.pricing.finalPrice,
                          totalPrice: data.pricing.finalPrice,
                          addOns: [],
                          addOnPrices: {},
                          frequencyDiscount: data.pricing.breakdown.frequencyDiscount || 0
                        });
                        handleNext();
                      }}
                    />
                  )}

                  {currentStep === 2 && (
                    <BookingDetailsPage
                      bookingData={bookingData}
                      updateBookingData={updateData}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}

                  {currentStep === 3 && (
                    <div className="max-w-4xl mx-auto p-6">
                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Complete Your Booking</h2>
                        <p className="text-muted-foreground mb-6">
                          Your booking details have been saved. You'll receive payment information via email.
                        </p>
                        <div className="flex gap-4 justify-center">
                          <Button 
                            variant="outline" 
                            onClick={handleBack}
                          >
                            Back
                          </Button>
                          <Button 
                            onClick={() => window.location.href = '/booking-confirmation'}
                            className="w-full max-w-sm"
                          >
                            Confirm Booking
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons - only show for steps 1 & 2 */}
                  {currentStep < 3 && (
                    <div className="flex justify-between mt-8 pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2 rounded-xl"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>

                      <GradientButton
                        onClick={handleNext}
                        disabled={!canProceed() || isLoading}
                        className="flex items-center gap-2"
                      >
                        {isLoading ? 'Processing...' : 'Continue'}
                        <ArrowRight className="h-4 w-4" />
                      </GradientButton>
                    </div>
                  )}
                </CardContent>
              </GlassCard>
            </div>

            {/* Sidebar with Summary - only show after step 1 */}
            {currentStep > 1 && (
              <div className="lg:col-span-1 animate-slide-in">
                <div className="sticky top-8">
                  <BookingSummaryCard bookingData={bookingData} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
