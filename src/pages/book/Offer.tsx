import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBooking } from '@/contexts/BookingContext';
import { useBookingProgress } from '@/hooks/useBookingProgress';
import { HOME_SIZE_RANGES } from '@/lib/new-pricing-system';
import { Check, Sparkles, CalendarCheck, Info, Gift } from 'lucide-react';
import { CleaningShowcaseCarousel } from '@/components/booking/CleaningShowcaseCarousel';
import { ServiceDetailsModal } from '@/components/booking/ServiceDetailsModal';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';

// NEW YEAR SPECIAL PRICING
const NEW_YEAR_PROMO = {
  deepCleanDiscount: 50, // $50 off first deep clean
  recurringDiscount: 0.15, // 15% off recurring service
  expirationDate: '2025-01-07',
};

export default function BookingOffer() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();
  const { trackStep } = useBookingProgress();
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsServiceType, setDetailsServiceType] = useState<'standard' | 'tester' | '90day'>('tester');

  // Find the selected home size range
  const selectedHomeSize = HOME_SIZE_RANGES.find(range => range.id === bookingData.homeSizeId);

  // Use the new pre-calculated pricing fields
  const baseDeepPrice = selectedHomeSize?.deepPrice || 250;
  const maintenancePrice = selectedHomeSize?.maintenancePrice || 170;
  
  // NEW YEAR SPECIAL: $50 off deep clean
  const deepCleanPrice = baseDeepPrice - NEW_YEAR_PROMO.deepCleanDiscount;
  
  // NEW YEAR SPECIAL: 15% off recurring maintenance
  const recurringPrice = Math.round(maintenancePrice * (1 - NEW_YEAR_PROMO.recurringDiscount));
  const recurringSavings = maintenancePrice - recurringPrice;

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
                  <span>• Deep Clean:</span>
                  <span className="font-semibold">Starting at ${selectedHomeSize.deepPrice}</span>
                </li>
                <li className="flex justify-between">
                  <span>• Recurring Maintenance:</span>
                  <span className="font-semibold">Starting at ${selectedHomeSize.maintenancePrice}/visit</span>
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
    offerType: 'deep_clean' | 'recurring',
    offerName: string,
    basePrice: number,
    visitCount: number,
    isRecurring: boolean
  ) => {
    setSelectedOffer(offerType);

    let serviceType: 'regular' | 'deep' | 'move_in_out' = offerType === 'deep_clean' ? 'deep' : 'regular';
    let frequency: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly' = offerType === 'deep_clean' ? 'one_time' : 'bi_weekly';

    updateBookingData({
      offerType,
      offerName,
      basePrice,
      visitCount,
      isRecurring,
      serviceType,
      frequency,
      promoCode: 'NEWYEAR2025',
      promoDiscount: offerType === 'deep_clean' ? NEW_YEAR_PROMO.deepCleanDiscount : recurringSavings
    });

    // Track progress for abandoned checkout
    trackStep('offer_selected', { 
      service_type: serviceType,
      frequency,
      base_price: basePrice
    });

    // Navigate after brief delay for visual feedback
    setTimeout(() => {
      navigate('/book/checkout');
    }, 200);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky New Year Special Banner */}
      <div className="sticky top-0 z-50 w-full bg-[hsl(220,50%,15%)] border-b-2 border-[hsl(45,93%,47%)]">
        <div className="max-w-5xl mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-center md:text-left">
              <Gift className="h-6 w-6 text-[hsl(45,93%,55%)] shrink-0 hidden md:block" />
              <div>
                <p className="text-[hsl(45,93%,55%)] font-bold text-sm md:text-base">
                  New Year Special: $50 Off Your First Clean + 15% Off Recurring Service
                </p>
                <p className="text-[hsl(45,93%,75%)] text-xs md:text-sm">
                  Book by Jan 7th to claim your discount
                </p>
              </div>
            </div>
            <Button 
              onClick={() => document.getElementById('offers-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-[hsl(45,93%,47%)] hover:bg-[hsl(45,93%,40%)] text-[hsl(220,50%,15%)] font-bold px-6 whitespace-nowrap"
            >
              Claim My Discount
            </Button>
          </div>
        </div>
      </div>

      <BookingProgressBar currentStep={3} totalSteps={6} />

      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12" id="offers-section">
        <div className="text-center mb-8 md:mb-12">
          <Badge className="mb-4 bg-[hsl(45,93%,47%)] text-[hsl(220,50%,15%)] px-4 py-1.5 text-sm font-bold">
            <Sparkles className="h-4 w-4 mr-2" />
            New Year Special — Ends Jan 7th
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Start 2025 With a Spotless Home
          </h1>
          <p className="text-lg text-muted-foreground">
            Choose your service and lock in your New Year savings.
          </p>
          <div className="flex justify-center mt-4">
            <GoogleGuaranteedBadge variant="compact" />
          </div>
        </div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-2">
          {/* Deep Clean - One Time with $50 Off */}
          <Card 
            className={`relative p-6 md:p-8 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedOffer === 'deep_clean' 
                ? 'border-primary shadow-lg' 
                : 'border-border hover:border-primary/50'
            }`} 
            onClick={() => handleSelectOffer(
              'deep_clean', 
              'Deep Clean — New Year Special', 
              deepCleanPrice, 
              1, 
              false
            )}
          >
            <div className="mb-4">
              <Badge className="bg-[hsl(45,93%,47%)] text-[hsl(220,50%,15%)] px-3 py-1 font-bold">
                <Gift className="h-3 w-3 mr-1.5" />
                $50 Off — New Year Special
              </Badge>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              Deep Clean
            </h2>
            <p className="text-sm text-muted-foreground mb-4">One-time reset for your home</p>

            <div className="mb-6">
              <div className="text-sm text-muted-foreground line-through mb-1">
                Regular: ${baseDeepPrice}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-bold text-primary">
                  ${deepCleanPrice}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Pay only ${Math.round(deepCleanPrice * 0.25)} today (25% deposit)
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">40-point Deep Clean checklist</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">2-person professional team</span>
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

            <div className="space-y-2">
              <Button 
                className="w-full" 
                size="lg" 
                variant={selectedOffer === 'deep_clean' ? 'default' : 'outline'}
              >
                Get Started — ${Math.round(deepCleanPrice * 0.25)} Today
              </Button>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailsServiceType('tester');
                  setShowDetailsModal(true);
                }} 
                variant="ghost" 
                size="sm" 
                className="w-full"
              >
                <Info className="h-4 w-4 mr-2" />
                What's Included?
              </Button>
            </div>
          </Card>

          {/* Recurring Maintenance - 15% Off */}
          <Card 
            className={`relative p-6 md:p-8 cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedOffer === 'recurring' 
                ? 'border-primary shadow-lg' 
                : 'border-primary/30 hover:border-primary'
            }`} 
            onClick={() => handleSelectOffer(
              'recurring', 
              'Recurring Maintenance — 15% Off', 
              recurringPrice, 
              1, 
              true
            )}
          >
            {/* Popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">
              Most Popular
            </div>

            <div className="mb-4 mt-2">
              <Badge className="bg-[hsl(45,93%,47%)] text-[hsl(220,50%,15%)] px-3 py-1 font-bold">
                <CalendarCheck className="h-3 w-3 mr-1.5" />
                15% Off — Recurring Service
              </Badge>
            </div>

            <h2 className="text-2xl font-bold text-foreground mb-2">
              Recurring Maintenance
            </h2>
            <p className="text-sm text-muted-foreground mb-4">Keep your home guest-ready, always</p>

            <div className="mb-6">
              <div className="text-sm text-muted-foreground line-through mb-1">
                Regular: ${maintenancePrice}/visit
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl md:text-5xl font-bold text-primary">
                  ${recurringPrice}
                </span>
                <span className="text-lg text-muted-foreground">/visit</span>
              </div>
              <p className="text-sm text-[hsl(45,93%,40%)] font-medium mt-2">
                You save ${recurringSavings} every visit!
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Pay only ${Math.round(recurringPrice * 0.25)} today (25% deposit)
              </p>
            </div>

            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">Bi-weekly or monthly scheduling</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">Same trusted cleaning team</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">Priority scheduling & member perks</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">Cancel or pause anytime</span>
              </li>
              <li className="flex items-start gap-2 text-sm">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-foreground">48-hour re-clean guarantee</span>
              </li>
            </ul>

            <div className="space-y-2">
              <Button 
                className="w-full" 
                size="lg"
                variant={selectedOffer === 'recurring' ? 'default' : 'outline'}
              >
                Get Started — ${Math.round(recurringPrice * 0.25)} Today
              </Button>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailsServiceType('standard');
                  setShowDetailsModal(true);
                }} 
                variant="ghost" 
                size="sm" 
                className="w-full"
              >
                <Info className="h-4 w-4 mr-2" />
                What's Included?
              </Button>
            </div>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate('/book/sqft')}>
            ← Back to Home Size
          </Button>
        </div>
        
        <CleaningShowcaseCarousel />
      </div>

      {/* Service Details Modal */}
      <ServiceDetailsModal 
        open={showDetailsModal} 
        onOpenChange={setShowDetailsModal} 
        serviceType={detailsServiceType} 
      />
    </div>
  );
}
