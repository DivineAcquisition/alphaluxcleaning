import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';
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
  Info,
  BadgePercent,
  Home,
  ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { CleaningShowcaseCarousel } from '@/components/booking/CleaningShowcaseCarousel';
import { ServiceDetailsModal } from '@/components/booking/ServiceDetailsModal';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';
import {
  OfferDateTimePicker,
  type TimeSlotId,
} from '@/components/booking/OfferDateTimePicker';

/**
 * Local offer-card identifier.
 *
 * AlphaLux now leads with a single packaged offer — the **Deep +
 * Standard Combo** — instead of three separate service tiers. The
 * earlier `standard | deep_clean | recurring` set is dropped at the
 * UI layer (the BookingContext union still accepts the legacy
 * values so any draft bookings in localStorage from before this
 * change still resolve cleanly). Adding a new option here is a
 * conscious product decision: the funnel is intentionally one-card.
 */
type OfferType = 'combo';

export default function BookingOffer() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();
  const { trackStep } = useBookingProgress();
  const { trackViewContent, trackAddToCart } = useFacebookPixel();
  const [selectedOffer, setSelectedOffer] = useState<OfferType | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsServiceType, setDetailsServiceType] =
    useState<'standard' | 'tester' | '90day'>('tester');

  // Date + time appear *after* a service is selected. They're the
  // final gate before /book/checkout so the customer always reserves
  // a specific slot before seeing the payment form.
  const [scheduledDate, setScheduledDate] = useState<string>(
    bookingData.date || '',
  );
  const [scheduledTimeSlot, setScheduledTimeSlot] = useState<TimeSlotId | ''>(
    (bookingData.timeSlot as TimeSlotId) || '',
  );
  const pickerRef = useRef<HTMLDivElement | null>(null);

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

  // ── Combo offer pricing ──
  //
  // The combo is sold as a single line item that bundles one Deep
  // Clean (the first visit, ~4 hours) plus one Standard Clean
  // follow-up (~2 hours, scheduled separately after the combo
  // ships). Retail = deep + standard at their tier prices for
  // this home size. The ALC2026 new-customer promo discounts the
  // *combined* total in one shot so customers see one clean
  // strike-through price rather than two stacked discounts.
  const baseComboPrice = baseDeepPrice + baseStandardPrice;
  const comboPreview = previewPromoDiscount(baseComboPrice);
  const comboPrice = comboPreview.total;
  const comboSavings = comboPreview.amount;

  useEffect(() => {
    if (!bookingData.zipCode || !bookingData.homeSizeId) {
      navigate('/book');
    }
  }, [bookingData.zipCode, bookingData.homeSizeId, navigate]);

  // Meta Pixel — fire ViewContent once when the service menu is
  // visible to the customer. We use the smallest non-zero price on
  // the page as the event value so it isn't ambiguous to Meta's
  // attribution model while still being conservative.
  useEffect(() => {
    if (!selectedHomeSize || selectedHomeSize?.requiresEstimate) return;
    // Combo is the only purchasable offer now, so we fire
    // ViewContent for it specifically — Meta gets a clean signal
    // for the actual cart value the customer is being shown.
    trackViewContent({
      content_name: 'Deep + Standard Combo',
      content_type: 'service',
      value: Number.isFinite(comboPrice) && comboPrice > 0 ? comboPrice : undefined,
      currency: 'USD',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedHomeSize?.id]);

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
                Estimated Starting Price:
              </h3>
              <ul className="space-y-2">
                <li className="flex justify-between">
                  <span>• Deep + Standard Combo:</span>
                  <span className="font-semibold">
                    Starting at ${baseComboPrice}
                  </span>
                </li>
              </ul>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                Includes one Deep Clean (~4 hrs) + one Standard Clean follow-up.
              </p>
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

  /**
   * Descriptor for the offer the customer is currently reviewing. We
   * cache the full set of metadata on click so the commit step below
   * doesn't need the button's closures.
   */
  type SelectedOfferState = {
    offerType: OfferType;
    offerName: string;
    basePrice: number;
    visitCount: number;
    isRecurring: boolean;
  };
  const [pendingOffer, setPendingOffer] = useState<SelectedOfferState | null>(
    null,
  );

  /**
   * Clicking a service card only *selects* the card and reveals the
   * date / time picker. It does NOT navigate — that happens when the
   * customer hits the "Continue to Payment" CTA which lives inside
   * the newly-revealed picker panel below.
   */
  const handleSelectOffer = (
    offerType: OfferType,
    offerName: string,
    basePrice: number,
    visitCount: number,
    isRecurring: boolean,
  ) => {
    setSelectedOffer(offerType);
    setPendingOffer({
      offerType,
      offerName,
      basePrice,
      visitCount,
      isRecurring,
    });

    // Meta Pixel — service selected. Fires before the date/time
    // gate so Meta sees clear intent even when the customer hasn't
    // yet picked a slot.
    trackAddToCart({
      content_name: offerName,
      value: basePrice,
      currency: 'USD',
    });

    // Give React a tick to mount the reveal panel, then ease the
    // viewport down to the picker so the customer physically sees
    // the page "pull them" toward the next step.
    setTimeout(() => {
      const el = pickerRef.current;
      if (!el) return;
      const y = el.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }, 80);
  };

  /**
   * Commits the selected service + date + time to the booking
   * context and navigates to the checkout page. Called by the CTA
   * inside the reveal panel.
   */
  const handleConfirmSchedule = () => {
    if (!pendingOffer) return;
    if (!scheduledDate || !scheduledTimeSlot) {
      toast.error('Pick a date and arrival window first.');
      pickerRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
      return;
    }

    const { offerType, offerName, basePrice, visitCount, isRecurring } =
      pendingOffer;

    // Currently `combo` is the only offer rendered. The first
    // visit is the Deep Clean (4 hr, scheduled now); the Standard
    // Clean follow-up is billed in the same checkout and scheduled
    // by ops separately. `serviceType` tracks the *first* visit so
    // HCP and the calendar duration math behave correctly.
    let serviceType: 'regular' | 'deep' | 'move_in_out' = 'deep';
    let frequency: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly' =
      'one_time';
    let contextOfferType:
      | 'combo_deep_standard'
      | 'standard_clean'
      | 'deep_clean'
      | 'recurring' = 'combo_deep_standard';

    if (offerType === 'combo') {
      serviceType = 'deep';
      frequency = 'one_time';
      contextOfferType = 'combo_deep_standard';
    }

    // Retail (pre-promo) price for this offer. The combo's retail is
    // the sum of the Deep + Standard tier prices for this home size.
    const originalPrice = baseComboPrice;

    const promoSavings = Math.max(0, originalPrice - basePrice);
    // IMPORTANT: BookingContext stores `basePrice` as the **pre-promo**
    // subtotal so checkout can render it as the strike-through line
    // and compute `finalPrice = basePrice - promoDiscount`. If we
    // wrote the already-discounted `basePrice` here, the discount
    // would be subtracted twice and the checkout total would crash to
    // $0.00 (and the deposit to the $1 floor). See Checkout.tsx
    // line ~96 and ~750 for the consumers.
    updateBookingData({
      offerType: contextOfferType,
      offerName,
      basePrice: originalPrice,
      visitCount,
      isRecurring,
      serviceType,
      frequency,
      date: scheduledDate,
      timeSlot: scheduledTimeSlot,
      promoCode:
        NEW_CUSTOMER_PROMO_ACTIVE && promoSavings > 0
          ? NEW_CUSTOMER_PROMO_CODE
          : '',
      promoDiscount: NEW_CUSTOMER_PROMO_ACTIVE ? promoSavings : 0,
    });

    trackStep('offer_selected', {
      service_type: serviceType,
      frequency,
      base_price: basePrice,
      service_date: scheduledDate,
      time_slot: scheduledTimeSlot,
      promo_code: NEW_CUSTOMER_PROMO_ACTIVE ? NEW_CUSTOMER_PROMO_CODE : '',
    });

    navigate('/book/checkout');
  };

  return (
    <div className="min-h-screen bg-background">
      <BookingProgressBar currentStep={3} totalSteps={6} />

      <div
        className="max-w-6xl mx-auto px-4 py-8 md:py-12"
        id="offers-section"
      >
        <div className="text-center mb-6 md:mb-10">
          {NEW_CUSTOMER_PROMO_ACTIVE ? (
            <>
              <Badge className="mb-3 bg-alx-gold/15 text-alx-gold-light border border-alx-gold/40 px-3 py-1 text-xs font-bold">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                New Customer Special — {NEW_CUSTOMER_PROMO_PERCENT}% OFF
              </Badge>
              <h1 className="font-serif text-2xl md:text-4xl font-bold text-foreground mb-2 leading-tight">
                Save{' '}
                <span className="text-alx-gradient-gold">
                  {NEW_CUSTOMER_PROMO_PERCENT}%
                </span>{' '}
                On Your First Cleaning
              </h1>
              <p className="text-xs md:text-sm uppercase tracking-[0.22em] text-alx-gold font-semibold mb-2">
                Code{' '}
                <span className="text-alx-gold-light">
                  {NEW_CUSTOMER_PROMO_CODE}
                </span>{' '}
                applied automatically
              </p>
            </>
          ) : (
            <h1 className="font-serif text-2xl md:text-4xl font-bold text-foreground mb-2 leading-tight">
              Pick Your Cleaning Service
            </h1>
          )}
          <p className="text-sm md:text-base text-muted-foreground">
            {NEW_CUSTOMER_PROMO_ACTIVE
              ? 'Pick any service — the new-customer discount is locked in.'
              : 'Transparent pricing. No contracts. Book in minutes.'}
          </p>

          {/* Always-visible promo code callout — the 50% off is code-
              entry only, so we nudge the customer to apply it at checkout.
              Shows the code in a pill that can be tapped to copy. */}
          <button
            type="button"
            onClick={() => {
              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                navigator.clipboard.writeText(NEW_CUSTOMER_PROMO_CODE).catch(() => {});
                toast.success(`Code ${NEW_CUSTOMER_PROMO_CODE} copied — paste it at checkout`);
              }
            }}
            className="mt-4 inline-flex items-center gap-2 rounded-full border-2 border-dashed border-alx-gold/70 bg-alx-gold/10 px-4 py-1.5 text-sm font-semibold text-alx-gold-dark hover:bg-alx-gold/20 transition-colors"
            aria-label={`Copy promo code ${NEW_CUSTOMER_PROMO_CODE}`}
          >
            <BadgePercent className="h-4 w-4" />
            Use code <span className="font-mono tracking-[0.18em]">{NEW_CUSTOMER_PROMO_CODE}</span>
            <span className="hidden sm:inline text-alx-gold/80">
              for {NEW_CUSTOMER_PROMO_PERCENT}% off your first clean
            </span>
          </button>

          <div className="flex justify-center mt-4">
            <GoogleGuaranteedBadge variant="compact" />
          </div>
        </div>

        {/* AlphaLux now offers a single packaged service — the
            Deep + Standard Combo — instead of three separate
            tiers. We centre the card on the page rather than using
            a 3-col grid so it reads as the hero offer rather than
            "one of several". */}
        <div id="service-cards" className="max-w-2xl mx-auto">
          <OfferCard
            selected={selectedOffer === 'combo'}
            highlighted
            icon={Sparkles}
            title="Deep + Standard Combo"
            description="One 40-point Deep Clean reset, plus a follow-up Standard Clean to keep your place feeling brand new."
            originalPrice={baseComboPrice}
            finalPrice={comboPrice}
            priceSuffix="for both visits"
            savingsLabel={
              NEW_CUSTOMER_PROMO_ACTIVE && comboSavings > 0
                ? `You save $${comboSavings}`
                : ''
            }
            includes={[
              `Visit 1 — Deep Clean (~4 hrs): 40-point top-to-bottom reset`,
              `Visit 2 — Standard Clean (~2 hrs): kitchens, baths, bedrooms, living areas`,
              `Same trained, insured AlphaLux team for both visits`,
              `Baseboards, inside appliances & detail work on visit 1`,
              `Schedule visit 1 now — we'll coordinate visit 2 with you after`,
              `All supplies & equipment included`,
              ...(NEW_CUSTOMER_PROMO_ACTIVE
                ? [
                    `${NEW_CUSTOMER_PROMO_PERCENT}% off the whole combo with code ${NEW_CUSTOMER_PROMO_CODE}`,
                  ]
                : []),
            ]}
            ctaLabel={
              NEW_CUSTOMER_PROMO_ACTIVE
                ? `Book Combo — Save ${NEW_CUSTOMER_PROMO_PERCENT}%`
                : 'Book the Combo'
            }
            onSelect={() =>
              handleSelectOffer(
                'combo',
                NEW_CUSTOMER_PROMO_ACTIVE
                  ? `Deep + Standard Combo — ${NEW_CUSTOMER_PROMO_PERCENT}% New Customer Special`
                  : 'Deep + Standard Combo',
                comboPrice,
                2,
                false,
              )
            }
            onViewDetails={() => {
              setDetailsServiceType('tester');
              setShowDetailsModal(true);
            }}
          />
        </div>

        {pendingOffer && (
          <Card
            ref={pickerRef}
            id="date-time-picker"
            className="mt-8 p-5 md:p-6 border-alx-gold/40 shadow-clean animate-in fade-in slide-in-from-top-4 duration-300"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-alx-gold font-semibold mb-1">
                  Selected Service
                </p>
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  {pendingOffer.offerName}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Pick a date and arrival window to finish booking.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPendingOffer(null);
                  setSelectedOffer(null);
                }}
              >
                Change
              </Button>
            </div>

            <OfferDateTimePicker
              date={scheduledDate}
              timeSlot={scheduledTimeSlot}
              onDateChange={setScheduledDate}
              onTimeSlotChange={setScheduledTimeSlot}
              // The combo's first visit IS a Deep Clean, so we
              // budget ~4 hours of crew time when filtering
              // available arrival windows.
              serviceDurationHours={pendingOffer.offerType === 'combo' ? 4 : 2}
              serviceLabel={pendingOffer.offerName}
            />

            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <Button
                size="lg"
                className="btn-alx-gold rounded-full font-semibold px-8"
                onClick={handleConfirmSchedule}
                disabled={!scheduledDate || !scheduledTimeSlot}
              >
                Continue to Payment
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

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
      className={`relative p-5 md:p-6 cursor-pointer transition-all duration-200 hover:shadow-clean border-2 ${
        selected
          ? 'border-alx-gold shadow-clean'
          : highlighted
            ? 'border-alx-gold/50 hover:border-alx-gold'
            : 'border-border hover:border-alx-gold/50'
      }`}
      onClick={onSelect}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-gold text-alx-black-ink rounded-full text-[10px] font-semibold shadow-gold uppercase tracking-wider bg-slate-700 text-slate-50">
          Most Popular
        </div>
      )}

      <div className="mb-3 mt-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-alx-black text-alx-gold-light flex items-center justify-center shadow-soft">
            <Icon className="h-4 w-4" />
          </div>
          <Badge
            variant="outline"
            className="bg-alx-gold/10 text-alx-gold-dark border-alx-gold/40 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          >
            <BadgePercent className="h-3 w-3 mr-1" />
            Code {NEW_CUSTOMER_PROMO_CODE} · {NEW_CUSTOMER_PROMO_PERCENT}% off
          </Badge>
        </div>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1">{title}</h2>
      <p className="text-xs md:text-sm text-muted-foreground mb-4">{description}</p>

      <div className="mb-5">
        {NEW_CUSTOMER_PROMO_ACTIVE && originalPrice > finalPrice && (
          <div className="text-xs text-muted-foreground line-through mb-1">
            Regular: ${originalPrice}
            {priceSuffix ? `/${priceSuffix}` : ''}
          </div>
        )}
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl md:text-4xl font-bold text-alx-gradient-gold">
            ${finalPrice}
          </span>
          {priceSuffix && (
            <span className="text-sm text-muted-foreground">
              /{priceSuffix}
            </span>
          )}
        </div>
        <p className="text-xs text-alx-gold-dark font-semibold mt-1.5">
          {NEW_CUSTOMER_PROMO_PERCENT}% off applied with code{' '}
          <span className="font-mono tracking-wider">{NEW_CUSTOMER_PROMO_CODE}</span>
        </p>
        {savingsLabel && (
          <p className="text-xs text-alx-gold font-semibold mt-1">{savingsLabel}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          Pay only ${depositToday} today (20% deposit)
        </p>
      </div>

      <ul className="space-y-2 mb-5">
        {includes.map((line, i) => (
          <li key={i} className="flex items-start gap-2 text-xs md:text-sm">
            <Check className="h-4 w-4 text-alx-gold shrink-0 mt-0.5" />
            <span className="text-foreground">{line}</span>
          </li>
        ))}
      </ul>

      <div className="space-y-2">
        <Button className="w-full btn-alx-gold rounded-full font-semibold">
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
