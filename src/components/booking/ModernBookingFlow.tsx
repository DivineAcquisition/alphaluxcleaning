import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { ServiceAreaVerificationPage } from './ServiceAreaVerificationPage';
import { BookingSelectionPage } from './BookingSelectionPage';
import { BookingDetailsPage } from './BookingDetailsPage';
import { BookingCheckoutPage } from './BookingCheckoutPage';
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
  paymentType: 'pay_after_service' | '25_percent_with_discount';
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
    if (currentStep < 4) {
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

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return bookingData.serviceZipCode;
      case 2:
        return bookingData.homeSize && bookingData.frequency;
      case 3:
        return bookingData.serviceDate && bookingData.serviceTime && 
               bookingData.address?.street && bookingData.contactNumber;
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <ProgressIndicator 
              currentStep={currentStep} 
              steps={[
                { id: 1, title: 'Service Area', description: 'Verify ZIP code coverage' },
                { id: 2, title: 'Service Selection', description: 'Choose your cleaning service' },
                { id: 3, title: 'Details & Scheduling', description: 'Schedule and location info' },
                { id: 4, title: 'Payment', description: 'Complete your booking' }
              ]} 
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className="shadow-clean">
                <CardContent className="p-6">
                  {currentStep === 1 && (
                    <ServiceAreaVerificationPage
                      bookingData={bookingData}
                      updateBookingData={updateData}
                      onNext={handleNext}
                    />
                  )}

                  {currentStep === 2 && (
                    <BookingSelectionPage
                      bookingData={bookingData}
                      updateBookingData={updateData}
                      onNext={handleNext}
                    />
                  )}

                  {currentStep === 3 && (
                    <BookingDetailsPage
                      bookingData={bookingData}
                      updateBookingData={updateData}
                      onNext={handleNext}
                      onBack={handleBack}
                    />
                  )}

                  {currentStep === 4 && (
                    <BookingCheckoutPage
                      bookingData={bookingData}
                      updateBookingData={updateData}
                      onPaymentSuccess={handleBookingComplete}
                      onBack={handleBack}
                    />
                  )}

                  {/* Navigation Buttons - only show for steps 1, 2 & 3 */}
                  {currentStep < 4 && (
                    <div className="flex justify-between mt-8 pt-6 border-t">
                      <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back
                      </Button>

                      <Button
                        onClick={handleNext}
                        disabled={!canProceed() || isLoading}
                        className="flex items-center gap-2"
                      >
                        {isLoading ? 'Processing...' : 'Continue'}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar with Summary - only show after step 1 */}
            {currentStep > 1 && (
              <div className="lg:col-span-1">
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
