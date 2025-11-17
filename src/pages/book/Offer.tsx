import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBooking } from '@/contexts/BookingContext';
import { HOME_SIZE_RANGES } from '@/lib/new-pricing-system';
import { Check, Sparkles, TrendingUp } from 'lucide-react';

export default function BookingOffer() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);

  // Find the selected home size range
  const selectedHomeSize = HOME_SIZE_RANGES.find(
    range => range.id === bookingData.homeSizeId
  );
  
  // Check if Tester is eligible (only for homes ≤1,500 sq ft)
  const isTesterEligible = selectedHomeSize && selectedHomeSize.maxSqft <= 1500;
  
  // Get the deep clean price for this home size
  const testerPrice = selectedHomeSize?.deepPrice || 270;
  
  // Calculate 90-Day Plan price (1 deep clean + 3 maintenance at discounted rate)
  const ninetyDayPrice = Math.round(testerPrice * 2.6);

  useEffect(() => {
    if (!bookingData.zipCode || !bookingData.homeSizeId) {
      navigate('/book/zip');
    }
  }, [bookingData.zipCode, bookingData.homeSizeId, navigate]);

  const handleSelectOffer = (
    offerType: 'tester_deep_clean' | '90_day_plan',
    offerName: string,
    basePrice: number,
    visitCount: number,
    isRecurring: boolean
  ) => {
    setSelectedOffer(offerType);
    updateBookingData({
      offerType,
      offerName,
      basePrice,
      visitCount,
      isRecurring,
      serviceType: offerType === 'tester_deep_clean' ? 'deep' : 'deep',
      frequency: offerType === 'tester_deep_clean' ? 'one_time' : 'weekly',
    });

    // Navigate after brief delay for visual feedback
    setTimeout(() => {
      navigate('/book/checkout');
    }, 200);
  };

  return (
    <div className="min-h-screen bg-background">
      <BookingProgressBar currentStep={3} totalSteps={6} />

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground">
            Start with a deep clean. Continue with regular maintenance (optional).
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {/* Tester Deep Clean - Only for homes ≤1,500 sq ft */}
          {isTesterEligible ? (
            <Card
              className={`relative p-6 md:p-8 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
                selectedOffer === 'tester_deep_clean'
                  ? 'border-primary shadow-lg'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() =>
                handleSelectOffer(
                  'tester_deep_clean',
                  'Home Reset Deep Clean (Tester)',
                  testerPrice,
                  1,
                  false
                )
              }
            >
              <div className="mb-4">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  <Sparkles className="h-3 w-3" />
                  Best for first-time customers
                </span>
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-2">
                Home Reset Deep Clean
              </h2>
              <p className="text-sm text-muted-foreground mb-4">(Tester)</p>

              <div className="mb-6">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl md:text-5xl font-bold text-foreground">${testerPrice}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  One-time deep clean for homes up to 1,500 sq ft
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">40-point Deep Clean checklist</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">All supplies & equipment included</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-foreground">48-hour re-clean guarantee</span>
                </li>
              </ul>

              <Button
                className="w-full"
                size="lg"
                variant={selectedOffer === 'tester_deep_clean' ? 'default' : 'outline'}
              >
                Select Tester - ${testerPrice}
              </Button>
            </Card>
          ) : (
            <Card className="relative p-6 md:p-8 opacity-60 border-2 border-border bg-muted/30">
              <div className="mb-4">
                <Badge variant="outline">Not Available</Badge>
              </div>
              
              <h2 className="text-2xl font-bold text-muted-foreground mb-2">
                Tester Deep Clean
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Only available for homes up to 1,500 sq ft
              </p>

              <div className="mb-6">
                <p className="text-base text-muted-foreground">
                  Your home qualifies for our 90-Day Plan, which offers better value for larger spaces.
                </p>
              </div>

              <Button disabled className="w-full" size="lg" variant="outline">
                Not Available for Your Home Size
              </Button>
            </Card>
          )}

          {/* 90-Day Reset & Maintain Plan */}
          <Card
            className={`relative p-6 md:p-8 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedOffer === '90_day_plan'
                ? 'border-primary shadow-lg'
                : 'border-primary/30 hover:border-primary'
            } ${!isTesterEligible ? 'md:col-span-2 max-w-xl mx-auto' : ''}`}
            onClick={() =>
              handleSelectOffer(
                '90_day_plan',
                '90-Day Reset & Maintain Plan',
                ninetyDayPrice,
                4,
                true
              )
            }
          >
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
              Most Popular
            </div>

            <div className="mb-4 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                <TrendingUp className="h-3 w-3" />
                Best Value
              </span>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              90-Day Reset & Maintain Plan
            </h2>

            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl md:text-5xl font-bold text-foreground">${ninetyDayPrice}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">≈ ${Math.round(ninetyDayPrice / 4)} per visit</p>
              <p className="text-sm text-muted-foreground">
                One deep clean + 3 maintenance cleanings over 90 days
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">
                  <strong>Visit 1:</strong> Full 40-point Deep Clean
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">
                  <strong>Visits 2–4:</strong> Standard maintenance clean
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">Priority booking & member support</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">Lower rate than booking individually</span>
              </li>
            </ul>

            <Button
              className="w-full"
              variant={selectedOffer === '90_day_plan' ? 'default' : 'outline'}
              size="lg"
            >
              Select 90-Day Plan - ${ninetyDayPrice}
            </Button>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate('/book/sqft')}>
            ← Back to Home Size
          </Button>
        </div>
      </div>
    </div>
  );
}
