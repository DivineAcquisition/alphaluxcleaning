import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  BedDouble,
  Bath,
  Maximize2,
  Sparkles,
  MoveHorizontal,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';
import { useBookingProgress } from '@/hooks/useBookingProgress';
import {
  calculateQuote,
  DEEP_CLEAN_DISPLAY_TABLE,
  MOVE_OUT_DISPLAY_TABLE,
  BEDROOM_SURCHARGE,
  BATHROOM_SURCHARGE,
  WINDOW_PRICE_PER_WINDOW,
  type ServiceType,
} from '@/lib/alphalux-pricing';
import {
  NEW_CUSTOMER_PROMO_ACTIVE,
  NEW_CUSTOMER_PROMO_CODE,
  previewPromoDiscount,
} from '@/lib/promo';

type UiServiceType = 'deep' | 'moveout';

// Hourly quoting isn't a self-serve option right now — customers book
// one of the two flat-price service types and our team quotes anything
// custom by phone.
const SERVICE_OPTIONS: Array<{
  id: UiServiceType;
  title: string;
  subtitle: string;
  icon: typeof Sparkles;
}> = [
  {
    id: 'deep',
    title: 'Deep Clean',
    subtitle: 'Top-to-bottom reset, great for first-time service',
    icon: Sparkles,
  },
  {
    id: 'moveout',
    title: 'Move In / Move Out',
    subtitle: 'Empty-home detail clean on your move date',
    icon: MoveHorizontal,
  },
];

// Match UI service type -> persistent BookingContext service type.
const TO_BOOKING_SERVICE_TYPE: Record<UiServiceType, 'deep' | 'move_in_out'> = {
  deep: 'deep',
  moveout: 'move_in_out',
};

const TO_OFFER_TYPE: Record<UiServiceType, 'deep_clean'> = {
  deep: 'deep_clean',
  moveout: 'deep_clean',
};

function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 12,
  icon: Icon,
  helper,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  icon?: typeof Sparkles;
  helper?: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div>
          <div className="font-semibold text-sm text-foreground">{label}</div>
          {helper && (
            <div className="text-xs text-muted-foreground">{helper}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={`Decrease ${label}`}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center font-semibold">{value}</span>
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-full"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label={`Increase ${label}`}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function BookingPricing() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();
  const { trackStep } = useBookingProgress();

  const [serviceType, setServiceType] = useState<UiServiceType>(() => {
    if (bookingData.serviceType === 'move_in_out') return 'moveout';
    return 'deep';
  });

  const [sqft, setSqft] = useState<number>(
    bookingData.sqft && bookingData.sqft > 0 ? bookingData.sqft : 1500,
  );
  const [bedrooms, setBedrooms] = useState<number>(bookingData.bedrooms || 2);
  const [bathrooms, setBathrooms] = useState<number>(bookingData.bathrooms || 2);
  const [windowCount, setWindowCount] = useState<number>(0);
  const [extraBedrooms, setExtraBedrooms] = useState<number>(0);
  const [extraBathrooms, setExtraBathrooms] = useState<number>(0);

  useEffect(() => {
    if (!bookingData.zipCode) {
      navigate('/book/zip', { replace: true });
    }
  }, [bookingData.zipCode, navigate]);

  useEffect(() => {
    trackStep('pricing_calculator_opened', { service_type: serviceType });
  }, [serviceType, trackStep]);

  const quote = useMemo(
    () =>
      calculateQuote({
        serviceType: serviceType as ServiceType,
        sqft,
        bedrooms,
        bathrooms,
        windowCount,
        extraBedrooms,
        extraBathrooms,
      }),
    [
      serviceType,
      sqft,
      bedrooms,
      bathrooms,
      windowCount,
      extraBedrooms,
      extraBathrooms,
    ],
  );

  const promoPreview = previewPromoDiscount(quote.total);
  const promoTotal = promoPreview.total;
  const promoSavings = promoPreview.amount;
  const depositPercentage = 0.2;
  const depositAmount = Math.max(1, Math.round(promoTotal * depositPercentage));

  const handleContinue = () => {
    const serviceKey = TO_BOOKING_SERVICE_TYPE[serviceType];
    const offerKey = TO_OFFER_TYPE[serviceType];
    const serviceLabel =
      serviceType === 'deep' ? 'Deep Clean' : 'Move In / Move Out Clean';

    const promoSavings = Math.max(0, quote.total - promoTotal);

    updateBookingData({
      sqft,
      bedrooms,
      bathrooms,
      serviceType: serviceKey,
      frequency: 'one_time',
      offerType: offerKey,
      offerName: serviceLabel,
      // Checkout computes finalPrice = basePrice - promoDiscount, so
      // store the pre-promo total as basePrice and the actual savings
      // as promoDiscount. Promo is only attached if it's actually
      // enabled (otherwise promoSavings is 0 and we leave the code
      // blank so nothing shows on the confirmation screen).
      basePrice: quote.total,
      visitCount: 1,
      isRecurring: false,
      promoCode: NEW_CUSTOMER_PROMO_ACTIVE && promoSavings > 0 ? NEW_CUSTOMER_PROMO_CODE : '',
      promoDiscount: NEW_CUSTOMER_PROMO_ACTIVE ? promoSavings : 0,
    });

    trackStep('pricing_calculator_submitted', {
      service_type: serviceType,
      sqft,
      bedrooms,
      bathrooms,
      window_count: windowCount,
      total: quote.total,
    });

    setTimeout(() => navigate('/book/checkout'), 150);
  };

  const selectedIcon = SERVICE_OPTIONS.find((o) => o.id === serviceType)?.icon;
  const SelectedIcon = selectedIcon ?? Sparkles;

  return (
    <div className="min-h-screen bg-background">
      <BookingProgressBar currentStep={3} totalSteps={6} />

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-8">
        <div className="text-center space-y-3">
          <Badge className="bg-alx-gold/15 text-alx-gold-light border border-alx-gold/40 px-4 py-1.5 text-sm font-bold inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Transparent Pricing
          </Badge>
          <h1 className="text-2xl md:text-3xl font-bold">
            Build Your Quote
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Tell us about your space. The price updates live as you adjust —
            no contracts, no hidden fees.
          </p>
        </div>

        {/* Service selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SERVICE_OPTIONS.map((option) => {
            const isSelected = option.id === serviceType;
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setServiceType(option.id)}
                className={`text-left rounded-2xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-clean'
                    : 'border-border hover:border-primary/50'
                }`}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-bold">{option.title}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {option.subtitle}
                </p>
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Inputs column */}
          <div className="lg:col-span-3 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Maximize2 className="h-5 w-5 text-primary" />
                  Square Footage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Drag to match your home size
                  </div>
                  <div className="text-2xl font-bold">{sqft.toLocaleString()} sq ft</div>
                </div>
                <Slider
                  value={[sqft]}
                  min={500}
                  max={5000}
                  step={50}
                  onValueChange={(v) => setSqft(v[0] ?? 1500)}
                  aria-label="Square footage"
                />
                <div className="flex items-center gap-3">
                  <Label htmlFor="sqft-exact" className="text-sm">
                    Or enter exact:
                  </Label>
                  <Input
                    id="sqft-exact"
                    type="number"
                    min={200}
                    max={10000}
                    value={sqft}
                    onChange={(e) =>
                      setSqft(
                        Math.max(200, Math.min(10000, Number(e.target.value) || 0)),
                      )
                    }
                    className="w-32"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Rooms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Stepper
                  label="Bedrooms"
                  value={bedrooms}
                  onChange={setBedrooms}
                  min={0}
                  max={10}
                  icon={BedDouble}
                />
                <Stepper
                  label="Bathrooms"
                  value={bathrooms}
                  onChange={setBathrooms}
                  min={0}
                  max={8}
                  icon={Bath}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Extras</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div>
                    <div className="font-semibold text-sm">Interior windows</div>
                    <div className="text-xs text-muted-foreground">
                      ${WINDOW_PRICE_PER_WINDOW} per window
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setWindowCount(Math.max(0, windowCount - 1))}
                      disabled={windowCount <= 0}
                      aria-label="Decrease windows"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">
                      {windowCount}
                    </span>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 rounded-full"
                      onClick={() => setWindowCount(windowCount + 1)}
                      aria-label="Increase windows"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <Stepper
                  label="Extra bedrooms (beyond base plan)"
                  value={extraBedrooms}
                  onChange={setExtraBedrooms}
                  min={0}
                  max={5}
                  helper={`+$${BEDROOM_SURCHARGE} each`}
                />
                <Stepper
                  label="Extra bathrooms (beyond base plan)"
                  value={extraBathrooms}
                  onChange={setExtraBathrooms}
                  min={0}
                  max={5}
                  helper={`+$${BATHROOM_SURCHARGE} each`}
                />
              </CardContent>
            </Card>
          </div>

          {/* Live quote column */}
          <div className="lg:col-span-2">
            <div className="sticky top-28 space-y-4">
              <Card className="border-primary/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SelectedIcon className="h-5 w-5 text-primary" />
                    {serviceType === 'deep' ? 'Deep Clean Quote' : 'Move-Out Quote'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {serviceType === 'deep' ? 'Deep Clean base' : 'Move-Out base'}
                    </span>
                    <span className="font-semibold">
                      ${quote.basePrice.toFixed(0)}
                    </span>
                  </div>

                  {quote.windowsSurcharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Windows × {windowCount}
                      </span>
                      <span className="font-semibold">
                        +${quote.windowsSurcharge.toFixed(0)}
                      </span>
                    </div>
                  )}

                  {quote.additionalRoomsSurcharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Additional rooms
                      </span>
                      <span className="font-semibold">
                        +${quote.additionalRoomsSurcharge.toFixed(0)}
                      </span>
                    </div>
                  )}

                  <Separator />

                  {NEW_CUSTOMER_PROMO_ACTIVE && promoSavings > 0 ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground line-through">
                          Regular
                        </span>
                        <span className="line-through text-muted-foreground">
                          ${quote.total.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm text-primary font-semibold">
                          {NEW_CUSTOMER_PROMO_CODE} Applied
                        </span>
                        <span className="font-bold text-3xl text-primary">
                          ${promoTotal.toFixed(0)}
                        </span>
                      </div>
                      <div className="text-xs text-alx-gold font-semibold">
                        You save ${promoSavings.toFixed(0)}
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="font-bold text-3xl text-primary">
                        ${quote.total.toFixed(0)}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    Pay only{' '}
                    <strong className="text-foreground">
                      ${depositAmount}
                    </strong>{' '}
                    today (20% deposit). Remainder due after service.
                  </div>

                  <Button
                    size="lg"
                    className="w-full btn-alx-gold rounded-full font-semibold mt-2"
                    onClick={handleContinue}
                  >
                    Continue to Secure Checkout
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() => navigate('/book/sqft')}
                  >
                    ← Back
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-alx-gold/30 bg-alx-gold/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-alx-gold mt-0.5 shrink-0" />
                    <div>
                      <div className="font-semibold mb-1">
                        What's included in every clean
                      </div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Trained, insured team</li>
                        <li>• Eco-friendly products & equipment</li>
                        <li>• 100% satisfaction guarantee</li>
                        <li>• Secure payment via Stripe</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Reference pricing tables */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing Reference</CardTitle>
            <p className="text-sm text-muted-foreground">
              Published AlphaLux Cleaning rates. Ranges apply; final quote above
              reflects your selections.
            </p>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Deep Clean
              </h3>
              <ul className="text-sm space-y-1">
                {DEEP_CLEAN_DISPLAY_TABLE.map((row) => (
                  <li
                    key={row.label}
                    className="flex justify-between border-b border-border/60 last:border-0 py-1"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold">${row.price}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <MoveHorizontal className="h-4 w-4 text-primary" />
                Move In / Move Out
              </h3>
              <ul className="text-sm space-y-1">
                {MOVE_OUT_DISPLAY_TABLE.map((row) => (
                  <li
                    key={row.label}
                    className="flex justify-between border-b border-border/60 last:border-0 py-1"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold">${row.price}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
