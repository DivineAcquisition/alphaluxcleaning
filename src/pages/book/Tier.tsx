import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBooking } from '@/contexts/BookingContext';
import { Sparkles, Home as HomeIcon, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BookingTier() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();
  const [selectedBedrooms, setSelectedBedrooms] = useState<number>(bookingData.bedrooms || 2);
  const [selectedTier, setSelectedTier] = useState<'essential' | 'premium'>(bookingData.tier || 'premium');

  useEffect(() => {
    if (!bookingData.zipCode) {
      navigate('/book/zip');
    }
  }, [bookingData.zipCode, navigate]);

  const bedroomOptions = [
    { value: 1, label: '1 BR' },
    { value: 2, label: '2 BR' },
    { value: 3, label: '3 BR' },
    { value: 4, label: '4 BR' },
    { value: 5, label: '5+ BR' },
  ];

  // Essential pricing by bedrooms
  const essentialPrices: Record<number, number> = {
    1: 139,
    2: 179,
    3: 219,
    4: 259,
    5: 299, // Custom quote flow can be added later
  };

  const essentialPrice = essentialPrices[selectedBedrooms];
  const premiumPrice = Math.round(essentialPrice * 1.75);

  const handleContinue = () => {
    updateBookingData({ 
      tier: selectedTier,
      bedrooms: selectedBedrooms 
    });
    navigate('/book/frequency');
  };

  const essentialFeatures = [
    'Surface cleaning',
    'Bathrooms & kitchen',
    'Vacuum & mop floors',
    'Dust surfaces',
  ];

  const premiumFeatures = [
    'Everything in Essential',
    'Baseboards & window sills',
    'Inside cabinets',
    'Appliance detailing',
    'Deeper bathroom scrubbing',
    'More thorough attention',
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingProgressBar currentStep={2} totalSteps={6} />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 px-4 py-8 lg:py-12 max-w-6xl mx-auto w-full">
          <Link 
            to="/book/zip" 
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block transition-colors"
          >
            ← Previous
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Choose Your Clean
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Select your home size and service level
          </p>

          {/* Bedroom Selection */}
          <div className="mb-8">
            <label className="text-sm font-medium mb-3 block">
              How many bedrooms?
            </label>
            <div className="flex flex-wrap gap-3">
              {bedroomOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedBedrooms === option.value ? 'default' : 'outline'}
                  size="lg"
                  onClick={() => setSelectedBedrooms(option.value)}
                  className="min-w-[100px]"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Tier Comparison */}
          <div className="grid gap-6 md:grid-cols-2 mb-8">
            {/* Essential Clean */}
            <Card
              className={cn(
                'cursor-pointer hover:border-primary transition-all p-6 relative',
                selectedTier === 'essential' && 'border-primary ring-2 ring-primary'
              )}
              onClick={() => setSelectedTier('essential')}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <Sparkles className="h-8 w-8 text-primary mb-3" />
                  <h3 className="text-2xl font-bold mb-1">Essential Clean</h3>
                  <p className="text-sm text-muted-foreground">
                    For homes that just need to feel clean again
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-bold">${essentialPrice}</div>
                <div className="text-sm text-muted-foreground">per clean</div>
              </div>

              <div className="space-y-2 mb-6">
                {essentialFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={selectedTier === 'essential' ? 'default' : 'outline'}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTier('essential');
                }}
              >
                {selectedTier === 'essential' ? 'Selected' : 'Select Essential'}
              </Button>
            </Card>

            {/* Premium Reset */}
            <Card
              className={cn(
                'cursor-pointer hover:border-primary transition-all p-6 relative border-2 border-primary/50',
                selectedTier === 'premium' && 'border-primary ring-2 ring-primary'
              )}
              onClick={() => setSelectedTier('premium')}
            >
              <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-primary">
                ⭐ Recommended
              </Badge>

              <div className="flex items-start justify-between mb-4 mt-2">
                <div>
                  <HomeIcon className="h-8 w-8 text-primary mb-3" />
                  <h3 className="text-2xl font-bold mb-1">Premium Reset</h3>
                  <p className="text-sm text-muted-foreground">
                    For busy professionals who want a hotel-level reset
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="text-3xl font-bold">${premiumPrice}</div>
                <div className="text-sm text-muted-foreground">per clean</div>
              </div>

              <div className="space-y-2 mb-6">
                {premiumFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span className={idx === 0 ? 'font-medium' : ''}>{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={selectedTier === 'premium' ? 'default' : 'outline'}
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTier('premium');
                }}
              >
                {selectedTier === 'premium' ? 'Selected' : 'Select Premium'}
              </Button>
            </Card>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 mb-8 text-center">
            <p className="text-sm text-muted-foreground">
              💡 <strong>40% of customers</strong> upgrade to Premium for the hotel-level clean
            </p>
          </div>
          
          <Button 
            size="lg" 
            className="w-full h-14 text-lg" 
            onClick={handleContinue}
          >
            Continue to Frequency
          </Button>
        </main>
      </div>
    </div>
  );
}
