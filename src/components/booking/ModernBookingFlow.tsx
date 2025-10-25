import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { NewPricingInterface } from '../pricing/NewPricingInterface';
import { BookingDetailsPage } from './BookingDetailsPage';
import { BookingSummaryCard } from './BookingSummaryCard';
import { ProgressIndicator } from './ProgressIndicator';
import { PromotionalBanner } from './PromotionalBanner';
import { DeepCleanPromptModal } from './DeepCleanPromptModal';
import { RewardSummaryCard } from './RewardSummaryCard';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';

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
  
  // Promotional state
  const [showDeepCleanModal, setShowDeepCleanModal] = useState(false);
  const [promoChoice, setPromoChoice] = useState<'FIRST20' | 'BUNDLE' | null>(null);
  const [rewardCode, setRewardCode] = useState<string | null>(null);
  const [rewardExpiry, setRewardExpiry] = useState<Date | null>(null);
  const [deepCleanAnswer, setDeepCleanAnswer] = useState<string | null>(null);
  const [commitmentMonths, setCommitmentMonths] = useState<number>(0);

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

  // Check if frequency qualifies for deep clean prompt
  useEffect(() => {
    if (bookingData.frequency && ['weekly', 'bi_weekly', 'biweekly'].includes(bookingData.frequency.toLowerCase())) {
      // Only show modal if we haven't made a choice yet
      if (!promoChoice && !deepCleanAnswer) {
        setShowDeepCleanModal(true);
      }
    }
  }, [bookingData.frequency, promoChoice, deepCleanAnswer]);

  const handleSelectBundle = async () => {
    setShowDeepCleanModal(false);
    setPromoChoice('BUNDLE');
    setCommitmentMonths(2);
    
    // Generate reward code immediately
    const code = `ALC-DC30-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiry = addDays(new Date(), 90);
    
    setRewardCode(code);
    setRewardExpiry(expiry);
    
    toast.success('Bundle selected!', {
      description: `Your 30% Deep Clean reward code: ${code}`
    });

    // Track analytics
    try {
      await supabase.functions.invoke('track-promo-analytics', {
        body: {
          eventType: 'REWARD_ISSUED',
          bookingId: bookingData.customerEmail,
          data: {
            code,
            frequency: bookingData.frequency,
            commitment_months: 2
          }
        }
      });
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  };

  const handleSelect20Percent = () => {
    setShowDeepCleanModal(false);
    setPromoChoice('FIRST20');
    
    toast.success('20% discount applied!', {
      description: 'Your first clean discount has been activated'
    });
  };

  const handleBookingComplete = (paymentData: any) => {
    console.log('Booking completed:', paymentData);
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Promotional Banner - Show on steps 1 and 2 */}
          {(currentStep === 1 || currentStep === 2) && <PromotionalBanner />}

          {/* Progress Indicator */}
          <div className="mb-8">
            <ProgressIndicator 
              currentStep={currentStep} 
              steps={[
                { id: 1, title: 'Service Selection', description: 'Choose your cleaning service' },
                { id: 2, title: 'Details & Scheduling', description: 'Schedule and location info' },
                { id: 3, title: 'Payment', description: 'Complete your booking' }
              ]} 
            />
          </div>
          
          {/* Deep Clean Prompt Modal */}
          <DeepCleanPromptModal
            open={showDeepCleanModal}
            onClose={() => setShowDeepCleanModal(false)}
            onSelectBundle={handleSelectBundle}
            onSelect20Percent={handleSelect20Percent}
            frequency={bookingData.frequency || 'weekly'}
          />

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card className="shadow-clean">
                <CardContent className="p-6">
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
                          frequencyDiscount: 0
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
                    <div className="max-w-4xl mx-auto p-6 space-y-6">
                      {/* Reward Summary - Show if bundle was selected */}
                      {promoChoice === 'BUNDLE' && rewardCode && rewardExpiry && (
                        <RewardSummaryCard 
                          rewardCode={rewardCode} 
                          expiryDate={rewardExpiry}
                        />
                      )}

                      {/* 20% Discount Summary */}
                      {promoChoice === 'FIRST20' && (
                        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
                          <CardContent className="pt-6">
                            <div className="text-center space-y-2">
                              <h3 className="text-lg font-bold">20% Discount Applied</h3>
                              <p className="text-sm text-muted-foreground">
                                Your first clean discount has been applied to this booking
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}

                      <div className="text-center">
                        <h2 className="text-2xl font-bold mb-4">Complete Your Booking</h2>
                        <p className="text-muted-foreground mb-6">
                          {promoChoice === 'BUNDLE' 
                            ? 'Your reward code has been saved. Continue to finalize your booking.'
                            : 'Your booking details have been saved. Continue to complete your booking.'
                          }
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
