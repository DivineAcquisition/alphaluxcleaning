import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, ArrowRight, DollarSign } from 'lucide-react';
import { HOME_SIZE_RANGES, DEFAULT_PRICING_CONFIG, calculateNewPricing } from '@/lib/new-pricing-system';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export function QuickQuoteWidget() {
  const navigate = useNavigate();
  const [selectedState, setSelectedState] = useState('TX');
  const [selectedHomeSize, setSelectedHomeSize] = useState('');
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number } | null>(null);

  // Calculate price range when selections change
  useEffect(() => {
    if (selectedHomeSize && selectedServiceType && selectedState) {
      try {
        const pricing = calculateNewPricing(
          selectedHomeSize,
          selectedServiceType,
          'one_time',
          selectedState
        );
        
        // Show price range based on service type
        setPriceRange({
          min: Math.round(pricing.finalPrice * 0.95),
          max: Math.round(pricing.finalPrice * 1.05)
        });
      } catch (error) {
        console.error('Price calculation error:', error);
        setPriceRange(null);
      }
    } else {
      setPriceRange(null);
    }
  }, [selectedHomeSize, selectedServiceType, selectedState]);

  const handleGetQuote = () => {
    // Navigate to new booking flow
    navigate('/book/home-details');
  };

  const isFormValid = selectedState && selectedHomeSize && selectedServiceType;

  return (
    <div id="quote-widget" className="py-12 lg:py-16 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <Card className="max-w-3xl mx-auto shadow-xl border-primary/20">
          <CardHeader className="text-center pb-6 space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <Badge variant="secondary" className="text-sm">Instant Quote</Badge>
            </div>
            <CardTitle className="text-2xl lg:text-3xl">Get Your Price in 30 Seconds</CardTitle>
            <p className="text-muted-foreground text-sm lg:text-base">
              No signup required • Transparent pricing • Special offers applied
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* State Selector */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">1. Select Your State</Label>
              <div className="grid grid-cols-3 gap-3">
                {DEFAULT_PRICING_CONFIG.states.map((state) => (
                  <Button
                    key={state.code}
                    variant={selectedState === state.code ? 'default' : 'outline'}
                    className="h-14 text-base font-medium"
                    onClick={() => setSelectedState(state.code)}
                  >
                    {state.code}
                  </Button>
                ))}
              </div>
            </div>

            {/* Home Size Selector */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">2. Choose Your Home Size</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {HOME_SIZE_RANGES.filter(h => !h.requiresEstimate).map((homeSize) => (
                  <Button
                    key={homeSize.id}
                    variant={selectedHomeSize === homeSize.id ? 'default' : 'outline'}
                    className="h-auto py-3 px-2 text-xs sm:text-sm flex flex-col items-center justify-center"
                    onClick={() => setSelectedHomeSize(homeSize.id)}
                  >
                    <span className="font-semibold">{homeSize.label}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground mt-1">
                      {homeSize.bedroomRange}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Service Type Selector */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">3. Select Service Type</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Button
                  variant={selectedServiceType === 'regular' ? 'default' : 'outline'}
                  className="h-auto py-4 flex flex-col items-center justify-center relative"
                  onClick={() => setSelectedServiceType('regular')}
                >
                  <span className="font-semibold mb-1">Standard Clean</span>
                  <span className="text-xs text-muted-foreground">Maintenance cleaning</span>
                  <Badge className="absolute top-2 right-2 bg-green-500 text-white text-[10px]">
                    10% OFF
                  </Badge>
                </Button>

                <Button
                  variant={selectedServiceType === 'deep' ? 'default' : 'outline'}
                  className="h-auto py-4 flex flex-col items-center justify-center relative"
                  onClick={() => setSelectedServiceType('deep')}
                >
                  <span className="font-semibold mb-1">Deep Clean</span>
                  <span className="text-xs text-muted-foreground">Thorough cleaning</span>
                  <Badge className="absolute top-2 right-2 bg-warning text-foreground text-[10px]">
                    20% OFF
                  </Badge>
                </Button>

                <Button
                  variant={selectedServiceType === 'move_in_out' ? 'default' : 'outline'}
                  className="h-auto py-4 flex flex-col items-center justify-center"
                  onClick={() => setSelectedServiceType('move_in_out')}
                >
                  <span className="font-semibold mb-1">Move-In/Out</span>
                  <span className="text-xs text-muted-foreground">Complete reset</span>
                </Button>
              </div>
            </div>

            {/* Price Display */}
            {priceRange && (
              <div className="bg-primary/5 border-2 border-primary/30 rounded-lg p-6 text-center animate-fade-in">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">Estimated Price Range</p>
                </div>
                <p className="text-3xl lg:text-4xl font-bold text-primary">
                  ${priceRange.min} - ${priceRange.max}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Special offer already applied • Only 25% deposit required
                </p>
              </div>
            )}

            {/* Get Quote Button */}
            <Button
              size="lg"
              className="w-full text-lg py-6 shadow-lg hover:shadow-xl transition-all"
              onClick={handleGetQuote}
              disabled={!isFormValid}
            >
              Get My Quote
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              🔒 Secure booking • 100% satisfaction guarantee • Same professional team every visit
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
