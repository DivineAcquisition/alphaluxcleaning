import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBooking } from '@/contexts/BookingContext';
import { HOME_SIZE_RANGES } from '@/lib/new-pricing-system';
import { Check, Sparkles, TrendingUp } from 'lucide-react';
import { CleaningShowcaseCarousel } from '@/components/booking/CleaningShowcaseCarousel';
import { BundleSaveModal } from '@/components/booking/BundleSaveModal';

export default function BookingOffer() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [showUpsellModal, setShowUpsellModal] = useState(false);

  // Find the selected home size range
  const selectedHomeSize = HOME_SIZE_RANGES.find(
    range => range.id === bookingData.homeSizeId
  );
  
  // Check if Tester is eligible (only for homes ≤1,499 sq ft)
  const isTesterEligible = selectedHomeSize && selectedHomeSize.maxSqft <= 1499;
  
  // Use the new pre-calculated pricing fields
  const testerPrice = selectedHomeSize?.deepPrice || 250;
  const maintenancePrice = selectedHomeSize?.maintenancePrice || 170;
  const ninetyDayPrice = selectedHomeSize?.ninetyDayPrice || 699;
  
  // Calculate per-visit price for display
  const perVisitPrice = Math.round(ninetyDayPrice / 4);
  
  // Calculate savings vs. individual booking
  const individualTotal = testerPrice + (maintenancePrice * 3);
  const savings = individualTotal - ninetyDayPrice;

  useEffect(() => {
    if (!bookingData.zipCode || !bookingData.homeSizeId) {
      navigate('/book');
    }
  }, [bookingData.zipCode, bookingData.homeSizeId, navigate]);

  // Handle custom quote requirement for large homes
  if (selectedHomeSize?.requiresEstimate) {
    return (
      <div className="min-h-screen bg-background">
        <BookingProgressBar currentStep={3} totalSteps={6} />
        
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          <Card className="p-6 md:p-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Custom Quote Required</h1>
            <p className="text-base md:text-lg text-muted-foreground mb-6">
              Your home (5,000+ sq ft) requires a customized quote for the most accurate pricing.
            </p>
            
            <div className="bg-muted p-6 rounded-lg mb-6 text-left">
              <h3 className="font-bold text-xl mb-4 text-center">Estimated Starting Prices:</h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>• Deep Clean (Tester):</span>
                  <span className="font-semibold">Starting at ${selectedHomeSize.deepPrice}</span>
                </li>
                <li className="flex justify-between">
                  <span>• Custom 90-Day Plan:</span>
                  <span className="font-semibold">Starting at ${selectedHomeSize.ninetyDayPrice}</span>
                </li>
              </ul>
            </div>
            
            <p className="mb-6 text-lg">
              Call us at <strong className="text-primary">(972) 559-0223</strong> for a personalized quote.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => window.location.href = 'tel:9725590223'}>
                📞 Call Now
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/book/sqft')}>
                ← Back
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const handleSelectOffer = (
    offerType: 'tester_deep_clean' | '90_day_plan' | 'standard_clean',
    offerName: string,
    basePrice: number,
    visitCount: number,
    isRecurring: boolean
  ) => {
    setSelectedOffer(offerType);
    
    // Show upsell modal for Standard Clean selection
    if (offerType === 'standard_clean') {
      setShowUpsellModal(true);
      return;
    }
    
    let serviceType: 'regular' | 'deep' | 'move_in_out' = 'regular';
    let frequency: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly' = 'one_time';
    
    if (offerType === 'tester_deep_clean') {
      serviceType = 'deep';
      frequency = 'one_time';
    } else if (offerType === '90_day_plan') {
      serviceType = 'deep';
      frequency = 'weekly';
    }
    
    updateBookingData({
      offerType,
      offerName,
      basePrice,
      visitCount,
      isRecurring,
      serviceType,
      frequency,
    });

    // Navigate after brief delay for visual feedback
    setTimeout(() => {
      navigate('/book/checkout');
    }, 200);
  };

  const handleUpgradeToBundle = () => {
    setShowUpsellModal(false);
    setSelectedOffer('90_day_plan');
    
    updateBookingData({
      offerType: '90_day_plan',
      offerName: '90-Day Reset & Maintain Plan',
      basePrice: ninetyDayPrice,
      visitCount: 4,
      isRecurring: true,
      serviceType: 'deep',
      frequency: 'weekly',
    });

    setTimeout(() => {
      navigate('/book/checkout');
    }, 200);
  };

  const handleContinueStandard = () => {
    setShowUpsellModal(false);
    
    updateBookingData({
      offerType: 'standard_clean',
      offerName: 'One-Time Standard Clean',
      basePrice: maintenancePrice,
      visitCount: 1,
      isRecurring: false,
      serviceType: 'regular',
      frequency: 'one_time',
    });

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

        <div className={`grid gap-6 md:gap-8 ${isTesterEligible ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {/* Standard Clean - Always available */}
          <Card
            className={`relative p-6 md:p-8 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedOffer === 'standard_clean'
                ? 'border-primary shadow-lg'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() =>
              handleSelectOffer(
                'standard_clean',
                'One-Time Standard Clean',
                maintenancePrice,
                1,
                false
              )
            }
          >
            <div className="mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                Simple & Straightforward
              </span>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              Standard Clean
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Perfect for regular upkeep</p>

            <div className="mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-bold text-primary">
                  ${Math.round(maintenancePrice * 0.25)}
                </span>
                <span className="text-lg text-muted-foreground">today</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                for 1 standard clean visit
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">Complete home cleaning checklist</span>
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
              variant={selectedOffer === 'standard_clean' ? 'default' : 'outline'}
            >
              Get Started - ${Math.round(maintenancePrice * 0.25)} Today
            </Button>
          </Card>

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
                <p className="text-sm text-muted-foreground mb-3">
                  Try our service risk-free
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-bold text-primary">
                    ${Math.round(testerPrice * 0.25)}
                  </span>
                  <span className="text-lg text-muted-foreground">today</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  for 1 deep clean visit
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
                Get Started - ${Math.round(testerPrice * 0.25)} Today
              </Button>
            </Card>
          ) : null}

          {/* 90-Day Reset & Maintain Plan */}
          <Card
            className={`relative p-6 md:p-8 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedOffer === '90_day_plan'
                ? 'border-primary shadow-lg'
                : 'border-primary/30 hover:border-primary'
            }`}
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
              <p className="text-sm text-muted-foreground mb-3">
                Lock in your clean home routine
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-bold text-primary">
                  ${Math.round(ninetyDayPrice * 0.25)}
                </span>
                <span className="text-lg text-muted-foreground">today</span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                for 4 visits over 90 days
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">
                  1 Deep Clean + 3 Maintenance Visits
                </span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">Priority scheduling & member support</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">48-hour re-clean guarantee</span>
              </li>
            </ul>

            <Button
              className="w-full"
              variant={selectedOffer === '90_day_plan' ? 'default' : 'outline'}
              size="lg"
            >
              Get Started - ${Math.round(ninetyDayPrice * 0.25)} Today
            </Button>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate('/book/sqft')}>
            ← Back to Home Size
          </Button>
        </div>
        
        <CleaningShowcaseCarousel />
      </div>

      {/* Bundle & Save Upsell Modal */}
      <BundleSaveModal
        open={showUpsellModal}
        onClose={() => setShowUpsellModal(false)}
        onUpgrade={handleUpgradeToBundle}
        onContinue={handleContinueStandard}
        standardPrice={maintenancePrice}
        bundlePrice={ninetyDayPrice}
        savings={Math.round((maintenancePrice * 4) - ninetyDayPrice)}
      />
    </div>
  );
}
