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

  const serviceLabels = {
    regular: 'Standard Cleaning',
    deep: 'Deep Cleaning',
    move_in_out: 'Move-In/Out Cleaning',
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingProgressBar currentStep={6} totalSteps={7} />
      
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
                      <span className="font-medium text-right">{serviceLabels[bookingData.serviceType]}</span>
                    </div>
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
                          🎁 Holiday Special - Due Today
                        </div>
                        <div className="text-5xl md:text-6xl font-bold text-primary mb-2">
                          $49
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Start your deep clean today • 2 months to pay balance
                        </div>
                      </div>
                    </div>

                    {/* Visual Progress Bar */}
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span className="text-primary">Due Today</span>
                        <span className="text-muted-foreground">Pay After Service</span>
                      </div>
                      <div className="h-8 bg-muted rounded-full overflow-hidden flex">
                        <div className="bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center text-white text-xs font-bold" 
                             style={{ width: `${(49 / pricing.finalPrice) * 100}%` }}>
                          $49
                        </div>
                        <div className="bg-muted flex items-center justify-center text-muted-foreground text-xs font-medium" 
                             style={{ width: `${((pricing.finalPrice - 49) / pricing.finalPrice) * 100}%` }}>
                          ${Math.round(pricing.finalPrice - 49)}
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground text-center">
                        Balance due after service • Up to 2 months to pay
                      </div>
                    </div>
                    
                    {/* Total Summary Box */}
                    <div className="p-4 bg-muted/50 rounded-lg border border-border">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-muted-foreground">Total Service Cost</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Pay $49 today • Remaining ${Math.round(pricing.finalPrice - 49)} after completion
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

            {/* Recurring Service Upsell - One-Time Customers Only */}
            {isOneTime && (
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-2 border-green-200 dark:border-green-800">
                <div className="text-center mb-6">
                  <div className="inline-block bg-green-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
                    🎁 EXCLUSIVE HOLIDAY OFFER
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">
                    Keep Your Home Spotless All Year
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    Add recurring service to your order and get <span className="font-bold text-green-600">50% OFF your first month</span>
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  {/* Weekly Option */}
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-green-200 dark:border-green-700 hover:border-green-400 transition-colors cursor-pointer">
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-600 mb-2">WEEKLY</div>
                      <div className="text-3xl font-bold mb-1">
                        ${Math.round(pricing.finalPrice * 0.5)}
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          ${Math.round(pricing.finalPrice)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">First month only</div>
                      <div className="text-sm font-medium text-green-600 mb-3">
                        Save ${Math.round(pricing.finalPrice * 6)} /month
                      </div>
                      <ul className="text-xs text-left space-y-1 text-muted-foreground">
                        <li>✓ 4 cleanings/month</li>
                        <li>✓ Always spotless home</li>
                        <li>✓ Priority scheduling</li>
                      </ul>
                    </div>
                  </div>

                  {/* Bi-Weekly Option */}
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-green-300 dark:border-green-600 hover:border-green-500 transition-colors cursor-pointer relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                        MOST POPULAR
                      </span>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-600 mb-2">BI-WEEKLY</div>
                      <div className="text-3xl font-bold mb-1">
                        ${Math.round(pricing.finalPrice * 0.5)}
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          ${Math.round(pricing.finalPrice)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">First month only</div>
                      <div className="text-sm font-medium text-green-600 mb-3">
                        Save ${Math.round(pricing.finalPrice * 3)} /month
                      </div>
                      <ul className="text-xs text-left space-y-1 text-muted-foreground">
                        <li>✓ 2 cleanings/month</li>
                        <li>✓ Perfect maintenance</li>
                        <li>✓ Best value</li>
                      </ul>
                    </div>
                  </div>

                  {/* Monthly Option */}
                  <div className="bg-white dark:bg-gray-900 p-5 rounded-xl border-2 border-green-200 dark:border-green-700 hover:border-green-400 transition-colors cursor-pointer">
                    <div className="text-center">
                      <div className="text-sm font-medium text-green-600 mb-2">MONTHLY</div>
                      <div className="text-3xl font-bold mb-1">
                        ${Math.round(pricing.finalPrice * 0.5)}
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          ${Math.round(pricing.finalPrice)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">First month only</div>
                      <div className="text-sm font-medium text-green-600 mb-3">
                        Save ${Math.round(pricing.finalPrice * 0.5)} /month
                      </div>
                      <ul className="text-xs text-left space-y-1 text-muted-foreground">
                        <li>✓ 1 cleaning/month</li>
                        <li>✓ Budget-friendly</li>
                        <li>✓ Regular refresh</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-green-200 dark:border-green-700 mb-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💡</div>
                    <div>
                      <div className="font-semibold mb-1">Why Maintain After Your Deep Clean?</div>
                      <p className="text-sm text-muted-foreground">
                        Your home will be spotless after today's deep clean. Regular recurring service keeps it that way—no more heavy scrubbing, just light maintenance to preserve that fresh, clean feeling all year long.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                  💳 Add to this order • Cancel anytime after first month • No commitment
                </div>
              </Card>
            )}
          </div>

          {/* Sticky Bottom CTA */}
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 sticky bottom-4 shadow-lg border-2">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <div className="text-sm text-muted-foreground mb-1">
                    🎁 Holiday Special - Due Today
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    $49
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Total: ${Math.round(pricing.finalPrice)} • Balance after service
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
