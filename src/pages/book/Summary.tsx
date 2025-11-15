import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { useBooking } from '@/contexts/BookingContext';
import { getEstimatedHours } from '@/lib/pricing-psychology';
import { Shield, Award, Calendar, MapPin, Home, Clock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { BookingCountdown } from '@/components/booking/BookingCountdown';

export default function BookingSummary() {
  const navigate = useNavigate();
  const { bookingData, pricing } = useBooking();

  useEffect(() => {
    if (!pricing || !bookingData.date || !bookingData.timeSlot) {
      toast({
        title: "Missing Information",
        description: "Please complete the previous steps",
        variant: "destructive",
      });
      navigate('/book/schedule');
    }
  }, [pricing, bookingData, navigate]);

  if (!pricing) return null;

  const estimatedHours = getEstimatedHours(bookingData.homeSizeId || '2001_2500');
  const isOneTime = bookingData.frequency === 'one_time';

  const handleContinue = () => {
    navigate('/book/checkout');
  };

  const handleCountdownExpire = () => {
    toast({
      title: "Time Slot Expired",
      description: "Please select a new date and time",
      variant: "destructive",
    });
    navigate('/book/schedule');
  };

  const frequencyLabels = {
    one_time: 'One-Time Cleaning',
    weekly: 'Weekly Recurring',
    bi_weekly: 'Bi-Weekly Recurring',
    monthly: 'Monthly Recurring',
  };

  const tierLabels = {
    essential: 'Essential Clean',
    premium: 'Premium Reset',
  };

  const serviceLabels = {
    regular: 'Standard Cleaning',
    deep: 'Deep Cleaning',
    move_in_out: 'Move-In/Out Cleaning',
  };

  const displayServiceType = bookingData.tier 
    ? tierLabels[bookingData.tier]
    : serviceLabels[bookingData.serviceType];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingProgressBar currentStep={4} totalSteps={5} />
      
      <main className="flex-1 px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              Review Your Service
            </h1>
            <p className="text-muted-foreground">
              Confirm the details below and proceed to payment
            </p>
          </div>

          {/* Single Column Layout */}
          <div className="max-w-2xl mx-auto space-y-6 mb-6">
            {/* Countdown Timer */}
            {bookingData.bookingExpiresAt && (
              <BookingCountdown 
                expiresAt={bookingData.bookingExpiresAt}
                onExpire={handleCountdownExpire}
              />
            )}

            {/* Consolidated Service Summary & Pricing */}
            <Card className="p-6">
              <div className="space-y-6">
                {/* Service Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Home className="w-5 h-5 text-primary" />
                    Service Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Service Type
                      </span>
                      <span className="font-medium text-right">{displayServiceType}</span>
                    </div>
                    {bookingData.bedrooms && (
                      <div className="flex justify-between items-start">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Bedrooms
                        </span>
                        <span className="font-medium text-right">{bookingData.bedrooms} BR</span>
                      </div>
                    )}
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Frequency
                      </span>
                      <span className="font-medium text-right">{frequencyLabels[bookingData.frequency]}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Home className="w-4 h-4" />
                        Home Size
                      </span>
                      <span className="font-medium text-right">{pricing.tierLabel}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Date & Time
                      </span>
                      <span className="font-medium text-right">
                        {new Date(bookingData.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })} at {bookingData.timeSlot}
                      </span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Location
                      </span>
                      <span className="font-medium text-right">{bookingData.city}, {bookingData.state}</span>
                    </div>
                  </div>
                </div>

                {/* Visual Payment Breakdown */}
                <div className="pt-4 border-t">
                  <div className="space-y-6">
                    {/* Prominent Deposit Display */}
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-xl border-2 border-primary/20">
                      <div className="text-center">
                        <div className="text-sm font-medium text-muted-foreground mb-2">
                          💳 Reserve Today
                        </div>
                        <div className="text-5xl md:text-6xl font-bold text-primary mb-2">
                          $49
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Pay balance after service: ${pricing.finalPrice - 49}
                        </div>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-primary">Today: $49</span>
                        <span className="text-muted-foreground">After: ${pricing.finalPrice - 49}</span>
                      </div>
                      <div className="h-8 bg-muted rounded-full overflow-hidden flex">
                        <div className="bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-white text-xs font-bold" style={{ width: '12%' }}>
                          $49
                        </div>
                        <div className="bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium" style={{ width: '88%' }}>
                          ${pricing.finalPrice - 49}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        Balance due after service completion
                      </div>
                    </div>
                    
                    {/* Total Summary Box */}
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Service Cost</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            🛡️ 100% Satisfaction Guarantee • 💳 No hidden fees
                          </div>
                        </div>
                        <div className="text-2xl font-bold">${Math.round(pricing.finalPrice)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Annual Savings for Recurring */}
                {!isOneTime && pricing.recurringDetails && pricing.discountAmount > 0 && (
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        💰 Annual Savings
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        ${Math.round(pricing.discountAmount * pricing.recurringDetails.cleansPerMonth * 12)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* What's Included */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">What's Included</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">Insured & Background-Checked Team</div>
                    <div className="text-sm text-muted-foreground">All cleaners fully vetted for your safety</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <div className="font-medium">100% Satisfaction Guarantee</div>
                    <div className="text-sm text-muted-foreground">We'll re-clean if you're not happy</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Simple Recurring Mention for One-Time */}
            {isOneTime && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm text-center">
                  💡 <strong>Want to save up to 20%?</strong> You can switch to recurring service after checkout
                </p>
              </div>
            )}
          </div>

          {/* Sticky Bottom CTA */}
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 sticky bottom-4 shadow-lg border-2">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
              <div className="text-sm text-muted-foreground mb-1">
                Due Today (Deposit)
              </div>
              <div className="text-3xl font-bold text-primary">
                ${pricing.depositAmount}
              </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Total: ${Math.round(pricing.finalPrice)}
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto px-12"
                  onClick={handleContinue}
                >
                  Continue to Payment →
                </Button>
              </div>
            </Card>
          </div>

          {/* Trust Badges */}
          <div className="max-w-2xl mx-auto mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">Trusted by 2,500+ happy customers</p>
            <div className="flex justify-center gap-6 text-xs text-muted-foreground">
              <span>🔒 Secure Payment</span>
              <span>✨ No Hidden Fees</span>
              <span>📞 24/7 Support</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
