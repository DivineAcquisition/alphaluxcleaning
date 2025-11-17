import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleProgressBar } from '@/components/booking/SimpleProgressBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSimpleBooking } from '@/contexts/SimpleBookingContext';
import { Check, ArrowRight, Sparkles, Calendar } from 'lucide-react';

const OFFERS = [
  {
    offerType: 'tester_deep_clean' as const,
    offerName: 'Home Reset Deep Clean (Tester)',
    basePrice: 250,
    visitCount: 1,
    isRecurring: false,
    badge: 'Best for first-time customers',
    badgeVariant: 'secondary' as const,
    icon: Sparkles,
    description: 'One-time deep clean for homes up to 2 bed / 2 bath or approx. 1,200–1,500 sq ft.',
    subtext: 'Perfect if you just want to try us or get your home back to baseline.',
    bullets: [
      '40-point Deep Clean checklist (kitchen, bathrooms, living areas, baseboards, blinds, etc.)',
      'All supplies & equipment included',
      '48-hour re-clean guarantee on any missed checklist item',
    ],
  },
  {
    offerType: '90_day_plan' as const,
    offerName: '90-Day Reset & Maintain Plan',
    basePrice: 699,
    visitCount: 4,
    isRecurring: true,
    badge: 'Most Popular • Best Value',
    badgeVariant: 'default' as const,
    icon: Calendar,
    description: 'One deep clean today + 3 maintenance cleanings over the next 90 days.',
    subtext: 'Designed to keep your home feeling like Day 1 without slipping back.',
    bullets: [
      'Visit 1: Full 40-point Deep Clean',
      'Visits 2–4: Standard maintenance clean (kitchen, bathrooms, surfaces, floors)',
      'Priority booking and member support',
      'Lower effective per-visit rate than booking individually',
    ],
    effectivePrice: '≈ $174 per visit',
  },
];

export default function ChoosePlan() {
  const navigate = useNavigate();
  const { bookingData, updatePlanOffer } = useSimpleBooking();
  const [selectedOffer, setSelectedOffer] = useState<typeof OFFERS[0] | null>(
    bookingData.planOffer.offerType
      ? OFFERS.find(o => o.offerType === bookingData.planOffer.offerType) || null
      : null
  );

  const handleSelectOffer = (offer: typeof OFFERS[0]) => {
    setSelectedOffer(offer);
    updatePlanOffer({
      offerType: offer.offerType,
      offerName: offer.offerName,
      basePrice: offer.basePrice,
      visitCount: offer.visitCount,
      isRecurring: offer.isRecurring,
    });
  };

  const handleNext = () => {
    if (selectedOffer) {
      navigate('/simple-book/confirm');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <SimpleProgressBar currentStep={2} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground">
            Select the option that works best for you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {OFFERS.map((offer) => {
            const Icon = offer.icon;
            const isSelected = selectedOffer?.offerType === offer.offerType;
            const isRecommended = offer.offerType === '90_day_plan';

            return (
              <Card
                key={offer.offerType}
                className={`
                  relative p-6 cursor-pointer transition-all duration-300
                  ${isSelected ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : 'hover:shadow-md'}
                  ${isRecommended ? 'border-primary/50' : ''}
                `}
                onClick={() => handleSelectOffer(offer)}
              >
                {isSelected && (
                  <div className="absolute -top-3 -right-3 bg-primary rounded-full p-2">
                    <Check className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold">{offer.offerName}</h3>
                        <Badge variant={offer.badgeVariant} className="mt-1">
                          {offer.badge}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-4xl font-bold text-primary mb-1">
                      ${offer.basePrice}
                    </div>
                    {offer.effectivePrice && (
                      <p className="text-sm text-muted-foreground">
                        {offer.effectivePrice}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-foreground">{offer.description}</p>
                    <p className="text-sm text-muted-foreground">{offer.subtext}</p>
                  </div>

                  <ul className="space-y-2">
                    {offer.bullets.map((bullet, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>

        {selectedOffer && (
          <Card className="p-6 bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Selected Plan:</p>
                <p className="font-semibold text-lg">{selectedOffer.offerName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total today: ${selectedOffer.basePrice} • {selectedOffer.visitCount} visit{selectedOffer.visitCount > 1 ? 's' : ''} included
                </p>
              </div>
              <Button onClick={handleNext} size="lg">
                Next: Confirm & Book
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>
        )}

        {!selectedOffer && (
          <div className="text-center">
            <Button disabled size="lg" className="opacity-50">
              Select a plan to continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
