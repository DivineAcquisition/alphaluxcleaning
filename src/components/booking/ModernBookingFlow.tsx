import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { GradientButton } from '@/components/ui/gradient-button';
import { toast } from 'sonner';
import { NewPricingInterface } from '../pricing/NewPricingInterface';
import { BookingDetailsPage } from './BookingDetailsPage';
import { BookingSummaryCard } from './BookingSummaryCard';
import { InteractiveTimeline } from './InteractiveTimeline';
import { FloatingPanel } from './FloatingPanel';

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="container mx-auto px-4 py-6 lg:py-8 max-w-7xl">
        {/* Interactive Timeline Progress */}
        <div className="mb-8">
          <InteractiveTimeline 
            steps={[
              { id: 1, title: 'Service Selection', description: 'Choose your cleaning service' },
              { id: 2, title: 'Details & Scheduling', description: 'Schedule and location info' },
              { id: 3, title: 'Payment', description: 'Complete your booking' }
            ]}
            currentStep={currentStep}
          />
        </div>
        
        {/* Main Content Area with Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left: Main booking content (takes 2 columns on large screens) */}
          <div className="lg:col-span-2 space-y-6">
            <FloatingPanel 
              variant="elevated"
              className="animate-fade-in"
            >
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
                <div className="text-center py-8">
                  <h2 className="text-3xl font-bold mb-4">Complete Your Booking</h2>
                  <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                    Your booking details have been saved. You'll receive payment information via email.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={handleBack}
                      size="lg"
                    >
                      ← Back
                    </Button>
                    <GradientButton 
                      onClick={() => window.location.href = '/booking-confirmation'}
                      size="lg"
                    >
                      Confirm Booking →
                    </GradientButton>
                  </div>
                </div>
              )}
            </FloatingPanel>
            
            {/* Navigation - Bottom Action Bar Style */}
            {currentStep < 3 && (
              <FloatingPanel className="flex items-center justify-between gap-4">
                {currentStep > 1 ? (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="px-6 h-12"
                  >
                    ← Back
                  </Button>
                ) : (
                  <div />
                )}
                
                <GradientButton
                  onClick={handleNext}
                  disabled={!canProceed() || isLoading}
                  className="ml-auto px-8"
                  size="lg"
                >
                  {isLoading ? 'Processing...' : 'Continue →'}
                </GradientButton>
              </FloatingPanel>
            )}
          </div>
          
          {/* Right: Sticky Summary Panel (visible from step 2) */}
          {currentStep >= 2 && (
            <div className="lg:col-span-1">
              <FloatingPanel 
                variant="sticky"
                title="Booking Summary"
                subtitle="Review your selections"
                className="animate-fade-in"
              >
                <BookingSummaryCard 
                  bookingData={bookingData}
                />
              </FloatingPanel>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
