import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBooking } from '@/contexts/BookingContext';
import { useBookingProgress } from '@/hooks/useBookingProgress';
import { HOME_SIZE_RANGES, resolveHomeSizeId } from '@/lib/new-pricing-system';
import {
  NEW_CUSTOMER_PROMO_ACTIVE,
  NEW_CUSTOMER_PROMO_CODE,
  NEW_CUSTOMER_PROMO_PERCENT,
  previewPromoDiscount,
} from '@/lib/promo';
import {
  Check,
  Sparkles,
  CalendarCheck,
  Info,
  Gift,
  BadgePercent,
  Home,
} from 'lucide-react';
import { CleaningShowcaseCarousel } from '@/components/booking/CleaningShowcaseCarousel';
import { ServiceDetailsModal } from '@/components/booking/ServiceDetailsModal';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';

type OfferType = 'standard' | 'deep_clean' | 'recurring';

export default function BookingOffer() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();
  const { trackStep } = useBookingProgress();
  const [selectedOffer, setSelectedOffer] = useState<OfferType | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsServiceType, setDetailsServiceType] =
    useState<'standard' | 'tester' | '90day'>('tester');

  const resolvedHomeSizeId = resolveHomeSizeId(bookingData.homeSizeId);
  const selectedHomeSize = HOME_SIZE_RANGES.find(
    (range) => range.id === resolvedHomeSizeId,
  );

  const baseDeepPrice = selectedHomeSize?.deepPrice || 250;
  const maintenancePrice = selectedHomeSize?.maintenancePrice || 170;
  // Legacy pricing model uses `regularPrice` for standard; fall back to
  // maintenance price + a modest markup if regularPrice is missing.
  const baseStandardPrice =
    selectedHomeSize?.regularPrice || Math.round(maintenancePrice * 1.05);

  // ALC2026 — new customer 50% off preview.
  const standardPreview = previewPromoDiscount(baseStandardPrice);
  const deepPreview = previewPromoDiscount(baseDeepPrice);
  const recurringPreview = previewPromoDiscount(maintenancePrice);

  const standardPrice = standardPreview.total;
  const deepCleanPrice = deepPreview.total;
  const recurringPrice = recurringPreview.total;
  const recurringSavings = recurringPreview.amount;

  useEffect(() => {
    if (!bookingData.zipCode || !bookingData.homeSizeId) {
      navigate('/book');
    }
  }, [bookingData.zipCode, bookingData.homeSizeId, navigate]);

  if (selectedHomeSize?.requiresEstimate) {
    return (
      <div className="min-h-screen bg-background">
        <BookingProgressBar currentStep={3} totalSteps={6} />

        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          <Card className="p-6 md:p-8 text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">
              Custom Quote Required
            </h1>
            <p className="text-base md:text-lg text-muted-foreground mb-6">
              Your home (5,000+ sq ft) requires a customized quote for the most
              accurate pricing.
            </p>

            <div className="bg-muted p-6 rounded-lg mb-6 text-left">
              <h3 className="font-bold text-xl mb-4 text-center">
                Estimated Starting Prices:
              </h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>• Standard Cleaning:</span>
                  <span className="font-semibold">
                    Starting at ${baseStandardPrice}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>• Deep Clean:</span>
                  <span className="font-semibold">
                    Starting at ${selectedHomeSize.deepPrice}
                  </span>
                </li>
                <li className="flex justify-between">
                  <span>• Recurring Maintenance:</span>
                  <span className="font-semibold">
                    Starting at ${selectedHomeSize.maintenancePrice}/visit
                  </span>
                </li>
              </ul>
            </div>

            <p className="mb-6 text-lg">
              Call us at{' '}
              <strong className="text-primary">(857) 754-4557</strong> for a
              personalized quote.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => (window.location.href = 'tel:8577544557')}
              >
                📞 Call Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/book/sqft')}
              >
                ← Back
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  const handleSelectOffer = (
    offerType: OfferType,
    offerName: string,
    basePrice: number,
    visitCount: number,
    isRecurring: boolean,
  ) => {
    setSelectedOffer(offerType);

    let serviceType: 'regular' | 'deep' | 'move_in_out';
    let frequency: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly';

    if (offerType === 'deep_clean') {
      serviceType = 'deep';
      frequency = 'one_time';
    } else if (offerType === 'recurring') {
      serviceType = 'regular';
      frequency = 'bi_weekly';
    } else {
      // standard one-time
      serviceType = 'regular';
      frequency = 'one_time';
    }

    const originalPrice =
      offerType === 'deep_clean'
        ? baseDeepPrice
        : offerType === 'recurring'
          ? maintenancePrice
          : baseStandardPrice;

    const promoSavings = Math.max(0, originalPrice - basePrice);
    updateBookingData({
      offerType,
      offerName,
      basePrice,
      visitCount,
      isRecurring,
      serviceType,
      frequency,
      promoCode: NEW_CUSTOMER_PROMO_ACTIVE && promoSavings > 0 ? NEW_CUSTOMER_PROMO_CODE : '',
      promoDiscount: NEW_CUSTOMER_PROMO_ACTIVE ? promoSavings : 0,
    });

    trackStep('offer_selected', {
      service_type: serviceType,
      frequency,
      base_price: basePrice,
      promo_code: NEW_CUSTOMER_PROMO_ACTIVE ? NEW_CUSTOMER_PROMO_CODE : '',
    });

    setTimeout(() => {
      navigate('/book/checkout');
    }, 200);
  };

  return (
    <div className="min-h-screen bg-background">
      {NEW_CUSTOMER_PROMO_ACTIVE && (
        <div className="sticky top-0 z-50 w-full bg-alx-promo text-alx-gold-pale border-b border-alx-gold/20">
          <div className="max-w-5xl mx-auto px-4 py-3 md:py-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-center md:text-left">
                <Gift className="h-6 w-6 text-alx-gold-light shrink-0 hidden md:block" />
                <div>
                  <p className="font-bold text-sm md:text-base">
                    New Customer Special:{' '}
                    <span className="text-alx-gold-light">
                      {NEW_CUSTOMER_PROMO_PERCENT}% OFF
                    </span>{' '}
                    Any First Cleaning
                  </p>
                  <p className="text-alx-gold-pale/75 text-xs md:text-sm">
                    Use code{' '}
                    <span className="font-bold tracking-[0.14em] text-alx-gold-light">
                      {NEW_CUSTOMER_PROMO_CODE}
                    </span>{' '}
                    — limit one redemption per customer.
                  </p>
                </div>
              </div>
              <Button
                onClick={() =>
                  document
                    .getElementById('offers-section')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }
                className="btn-alx-gold rounded-full px-6 whitespace-nowrap font-bold"
              >
                Claim My Discount
              </Button>
            </div>
          </div>
        </div>
      )}

      <BookingProgressBar currentStep={3} totalSteps={6} />

      <div
        className="max-w-6xl mx-auto px-4 py-8 md:py-12"
        id="offers-section"
      >
        <div className="text-center mb-8 md:mb-12">
          {NEW_CUSTOMER_PROMO_ACTIVE ? (
            <>
              <Badge className="mb-4 bg-alx-gold/15 text-alx-gold-light border border-alx-gold/40 px-4 py-1.5 text-sm font-bold">
                <Sparkles className="h-4 w-4 mr-2" />
                New Customer Special — {NEW_CUSTOMER_PROMO_PERCENT}% OFF
              </Badge>
              <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-3 leading-tight">
                Save{' '}
                <span className="text-alx-gradient-gold">
                  {NEW_CUSTOMER_PROMO_PERCENT}%
                </span>{' '}
                On Your First Cleaning
              </h1>
              <p className="text-sm md:text-base uppercase tracking-[0.22em] text-alx-gold font-semibold mb-2">
                Code{' '}
                <span className="text-alx-gold-light">
                  {NEW_CUSTOMER_PROMO_CODE}
                </span>{' '}
                applied automatically
              </p>
            </>
          ) : (
            <h1 className="font-serif text-3xl md:text-5xl font-bold text-foreground mb-3 leading-tight">
              Pick Your Cleaning Service
            </h1>
          )}
          <p className="text-lg text-muted-foreground">
            {NEW_CUSTOMER_PROMO_ACTIVE
              ? 'Pick any service — the new-customer discount is locked in.'
              : 'Transparent pricing. No contracts. Book in minutes.'}
          </p>
          <div className="flex justify-center mt-4">
            <GoogleGuaranteedBadge variant="compact" />
          </div>
        </div>

        <div className="grid gap-6 md:gap-8 md:grid-cols-3">
          {/* Standard Clean — One Time */}
          <OfferCard
            selected={selectedOffer === 'standard'}
            icon={Home}
            title="Standard Clean"
            description="One-time refresh of the spaces you use every day"
            originalPrice={baseStandardPrice}
            finalPrice={standardPrice}
            priceSuffix=""
            savingsLabel={
              NEW_CUSTOMER_PROMO_ACTIVE && standardPreview.amount > 0
                ? `You save $${standardPreview.amount}`
                : ''
            }
            includes={[
              'Kitchens, bathrooms, living areas & bedrooms',
              'Dusting, vacuuming & mopping',
              'All supplies & equipment included',
              'Trained, insured AlphaLux team',
              'Secure payment via Stripe',
            ]}
            ctaLabel={
              NEW_CUSTOMER_PROMO_ACTIVE
                ? `Book Standard — Save ${NEW_CUSTOMER_PROMO_PERCENT}%`
                : 'Book Standard'
            }
            onSelect={() =>
              handleSelectOffer(
                'standard',
                NEW_CUSTOMER_PROMO_ACTIVE
                  ? `Standard Clean — ${NEW_CUSTOMER_PROMO_PERCENT}% New Customer Special`
                  : 'Standard Clean',
                standardPrice,
                1,
                false,
              )
            }
            onViewDetails={() => {
              setDetailsServiceType('standard');
              setShowDetailsModal(true);
            }}
          />

          {/* Deep Clean — One Time */}
          <OfferCard
            selected={selectedOffer === 'deep_clean'}
            icon={Sparkles}
            title="Deep Clean"
            description="40-point reset for top-to-bottom freshness"
            originalPrice={baseDeepPrice}
            finalPrice={deepCleanPrice}
            priceSuffix=""
            savingsLabel={
              NEW_CUSTOMER_PROMO_ACTIVE && deepPreview.amount > 0
                ? `You save $${deepPreview.amount}`
                : ''
            }
            includes={[
              '40-point Deep Clean checklist',
              '2-person professional team',
              'Baseboards, inside appliances & detail work',
              'Trained, insured AlphaLux team',
              'Secure payment via Stripe',
            ]}
            ctaLabel={
              NEW_CUSTOMER_PROMO_ACTIVE
                ? `Book Deep — Save ${NEW_CUSTOMER_PROMO_PERCENT}%`
                : 'Book Deep Clean'
            }
            onSelect={() =>
              handleSelectOffer(
                'deep_clean',
                NEW_CUSTOMER_PROMO_ACTIVE
                  ? `Deep Clean — ${NEW_CUSTOMER_PROMO_PERCENT}% New Customer Special`
                  : 'Deep Clean',
                deepCleanPrice,
                1,
                false,
              )
            }
            onViewDetails={() => {
              setDetailsServiceType('tester');
              setShowDetailsModal(true);
            }}
          />

          {/* Recurring Maintenance */}
          <OfferCard
            selected={selectedOffer === 'recurring'}
            highlighted
            icon={CalendarCheck}
            title="Recurring Maintenance"
            description="Keep your home guest-ready, always"
            originalPrice={maintenancePrice}
            finalPrice={recurringPrice}
            priceSuffix="first visit"
            savingsLabel={
              NEW_CUSTOMER_PROMO_ACTIVE && recurringSavings > 0
                ? `You save $${recurringSavings} on visit 1`
                : ''
            }
            includes={[
              'Bi-weekly or monthly scheduling',
              'Same trusted cleaning team',
              'Priority scheduling & member perks',
              'Cancel or pause anytime',
              ...(NEW_CUSTOMER_PROMO_ACTIVE
                ? [`${NEW_CUSTOMER_PROMO_PERCENT}% off your first visit with ${NEW_CUSTOMER_PROMO_CODE}`]
                : []),
            ]}
            ctaLabel={
              NEW_CUSTOMER_PROMO_ACTIVE
                ? `Start Recurring — Save ${NEW_CUSTOMER_PROMO_PERCENT}%`
                : 'Start Recurring'
            }
            onSelect={() =>
              handleSelectOffer(
                'recurring',
                NEW_CUSTOMER_PROMO_ACTIVE
                  ? `Recurring Maintenance — ${NEW_CUSTOMER_PROMO_PERCENT}% Off First Visit`
                  : 'Recurring Maintenance',
                recurringPrice,
                1,
                true,
              )
            }
            onViewDetails={() => {
              setDetailsServiceType('standard');
              setShowDetailsModal(true);
            }}
          />
        </div>

        <div className="mt-8 text-center space-y-3">
          <Button
            variant="outline"
            onClick={() => navigate('/book/pricing')}
            className="border-alx-gold/50 text-alx-gold hover:bg-alx-gold/10"
          >
            Need a custom quote? Open pricing calculator →
          </Button>
          <div>
            <Button variant="ghost" onClick={() => navigate('/book/sqft')}>
              ← Back to Home Size
            </Button>
          </div>
        </div>

        <CleaningShowcaseCarousel />
      </div>

      <ServiceDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        serviceType={detailsServiceType}
      />
    </div>
  );
}

interface OfferCardProps {
  selected: boolean;
  highlighted?: boolean;
  icon: typeof Home;
  title: string;
  description: string;
  originalPrice: number;
  finalPrice: number;
  priceSuffix?: string;
  savingsLabel: string;
  includes: string[];
  ctaLabel: string;
  onSelect: () => void;
  onViewDetails: () => void;
}

function OfferCard({
  selected,
  highlighted,
  icon: Icon,
  title,
  description,
  originalPrice,
  finalPrice,
  priceSuffix,
  savingsLabel,
  includes,
  ctaLabel,
  onSelect,
  onViewDetails,
}: OfferCardProps) {
  const depositToday = Math.max(1, Math.round(finalPrice * 0.25));
  return (
    <Card
      className={`relative p-6 md:p-8 cursor-pointer transition-all duration-200 hover:shadow-clean border-2 ${
        selected
          ? 'border-alx-gold shadow-clean'
          : highlighted
            ? 'border-alx-gold/50 hover:border-alx-gold'
            : 'border-border hover:border-alx-gold/50'
      }`}
      onClick={onSelect}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-gold text-alx-black-ink rounded-full text-xs font-semibold shadow-gold uppercase tracking-wider">
          Most Popular
        </div>
      )}

      <div className="mb-4 mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-alx-black text-alx-gold-light flex items-center justify-center shadow-soft">
            <Icon className="h-5 w-5" />
          </div>
          {NEW_CUSTOMER_PROMO_ACTIVE && (
            <Badge className="bg-alx-gold/10 text-alx-gold border border-alx-gold/30 px-3 py-1 font-bold">
              <BadgePercent className="h-3 w-3 mr-1.5" />
              {NEW_CUSTOMER_PROMO_PERCENT}% OFF · {NEW_CUSTOMER_PROMO_CODE}
            </Badge>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-1">{title}</h2>
      <p className="text-sm text-muted-foreground mb-4">{description}</p>

      <div className="mb-6">
        {NEW_CUSTOMER_PROMO_ACTIVE && originalPrice > finalPrice && (
          <div className="text-sm text-muted-foreground line-through mb-1">
            Regular: ${originalPrice}
            {priceSuffix ? `/${priceSuffix}` : ''}
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-4xl md:text-5xl font-bold text-alx-gradient-gold">
            ${finalPrice}
          </span>
          {priceSuffix && (
            <span className="text-lg text-muted-foreground">
              /{priceSuffix}
            </span>
          )}
        </div>
        {savingsLabel && (
          <p className="text-sm text-alx-gold font-semibold mt-2">
            {savingsLabel}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Pay only ${depositToday} today (20% deposit)
        </p>
      </div>

      <ul className="space-y-3 mb-6">
        {includes.map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <Check className="h-5 w-5 text-alx-gold shrink-0 mt-0.5" />
            <span className="text-foreground">{line}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Button className="w-full btn-alx-gold rounded-full font-semibold" size="lg">
          {ctaLabel}
        </Button>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails();
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
  );
}
