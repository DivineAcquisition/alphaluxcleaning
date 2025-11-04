import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBooking } from '@/contexts/BookingContext';
import { RecurringUpsellCard } from '@/components/pricing/RecurringUpsellCard';
import { ValueBreakdown } from '@/components/pricing/ValueBreakdown';
import { HourlyComparison } from '@/components/pricing/HourlyComparison';
import { getEstimatedHours } from '@/lib/pricing-psychology';
import { calculateRecurringUpgradeDiscount } from '@/lib/new-pricing-system';
import { Sparkles, Shield, Clock, Award } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function BookingSummary() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData, pricing } = useBooking();
  const [isProcessing, setIsProcessing] = useState(false);

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
  const hourlyRate = pricing.finalPrice / estimatedHours;
  const isOneTime = bookingData.frequency === 'one_time';

  const handleRecurringUpgrade = (frequency: string, startDate: string) => {
    setIsProcessing(true);
    
    // Calculate new pricing with bonus discount
    const upgradeResult = calculateRecurringUpgradeDiscount(
      pricing.basePrice,
      'one_time',
      frequency,
      true
    );

    // Update booking data
    updateBookingData({
      frequency: frequency as any,
      recurringStartDate: startDate,
      upgradedToRecurring: true,
      recurringUpgradeDiscount: upgradeResult.bonusDiscount,
    });

    toast({
      title: "🎉 Recurring Service Activated!",
      description: `You're now saving ${(upgradeResult.totalDiscount * 100).toFixed(0)}% with ${frequency.replace('_', '-')} service`,
    });

    setIsProcessing(false);
  };

  const handleContinue = () => {
    navigate('/book/checkout');
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
              {isOneTime ? (
                <>🎊 Almost there! Review your service</>
              ) : (
                <>✨ Great choice! Here's your savings breakdown</>
              )}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isOneTime 
                ? "See what you're getting and discover how to save even more"
                : "See all the value you're getting with recurring service"
              }
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Left Column: Value Breakdown & Hourly Comparison */}
            <div className="space-y-6">
              <ValueBreakdown
                basePrice={pricing.basePrice}
                discountAmount={pricing.discountAmount}
                finalPrice={pricing.finalPrice}
                frequency={bookingData.frequency}
                estimatedHours={estimatedHours}
              />

              <HourlyComparison
                yourRate={hourlyRate}
                estimatedHours={estimatedHours}
              />

              {/* Why Choose Us */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  What's Included
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Shield className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Insured & Background-Checked</div>
                      <div className="text-sm text-muted-foreground">All cleaners fully vetted</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Award className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Quality Guarantee</div>
                      <div className="text-sm text-muted-foreground">100% satisfaction or we re-clean</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Professional Team</div>
                      <div className="text-sm text-muted-foreground">~{estimatedHours} hours of expert service</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column: Recurring Upsell or Service Details */}
            <div className="space-y-6">
              {/* Recurring Upsell (only for one-time) */}
              <RecurringUpsellCard
                currentPrice={pricing.finalPrice}
                basePrice={pricing.basePrice}
                onUpgrade={handleRecurringUpgrade}
                isOneTime={isOneTime}
                selectedDate={bookingData.date}
              />

              {/* Service Summary */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Service Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service Type</span>
                    <span className="font-medium">{serviceLabels[bookingData.serviceType]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frequency</span>
                    <span className="font-medium">{frequencyLabels[bookingData.frequency]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Home Size</span>
                    <span className="font-medium">{pricing.tierLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time</span>
                    <span className="font-medium">
                      {new Date(bookingData.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })} at {bookingData.timeSlot}
                    </span>
                  </div>
                  {bookingData.recurringStartDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Recurring Starts</span>
                      <span className="font-medium">
                        {new Date(bookingData.recurringStartDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 border-t">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium">{bookingData.city}, {bookingData.state}</span>
                  </div>
                </div>
              </Card>

              {/* Annual Savings (for recurring only) */}
              {!isOneTime && pricing.recurringDetails && (
                <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-semibold mb-3 text-green-900 dark:text-green-100">
                    💰 Your Annual Savings
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-green-700 dark:text-green-300">Cost per clean</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${Math.round(pricing.finalPrice)}
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-green-700 dark:text-green-300">Monthly total</span>
                      <span className="text-xl font-semibold text-green-600">
                        ${Math.round(pricing.recurringDetails.monthlyTotal)}
                      </span>
                    </div>
                    {pricing.discountAmount > 0 && (
                      <div className="pt-2 border-t border-green-200 dark:border-green-800">
                        <div className="flex justify-between items-baseline">
                          <span className="text-sm text-green-700 dark:text-green-300">Annual savings</span>
                          <span className="text-2xl font-bold text-green-600">
                            ${Math.round(pricing.discountAmount * pricing.recurringDetails.cleansPerMonth * 12)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>

          {/* Bottom CTA */}
          <Card className="p-6 sticky bottom-4 shadow-lg border-2">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">
                  {isOneTime ? 'Total Due Today' : 'Per Clean'}
                </div>
                <div className="text-3xl font-bold text-primary">
                  ${Math.round(pricing.finalPrice)}
                </div>
                {bookingData.upgradedToRecurring && (
                  <Badge className="mt-2 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Extra 10% discount applied!
                  </Badge>
                )}
              </div>
              <Button 
                size="lg" 
                className="w-full md:w-auto px-8"
                onClick={handleContinue}
                disabled={isProcessing}
              >
                Continue to Payment →
              </Button>
            </div>
          </Card>

          {/* Trust Badges */}
          <div className="mt-6 text-center">
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
