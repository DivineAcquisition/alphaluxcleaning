import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { HomeSizeGrid } from './HomeSizeGrid';
import { ServiceTypeSelector } from './ServiceTypeSelector';
import { FrequencySelector } from './FrequencySelector';
import { PricingSummaryCard } from './PricingSummaryCard';
import { calculateNewPricing, DEFAULT_PRICING_CONFIG, HOME_SIZE_RANGES, type PricingResult } from '@/lib/new-pricing-system';
import { applyGlobalDiscount } from '@/lib/pricing-utils';
import { MapPin, ArrowRight } from 'lucide-react';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';

interface NewPricingInterfaceProps {
  onBookingSelect?: (data: {
    homeSizeId: string;
    serviceTypeId: string;
    frequencyId: string;
    stateCode: string;
    pricing: PricingResult;
  }) => void;
}

export function NewPricingInterface({ onBookingSelect }: NewPricingInterfaceProps) {
  const [homeSizeId, setHomeSizeId] = useState<string>('');
  const [serviceTypeId, setServiceTypeId] = useState<string>('');
  const [frequencyId, setFrequencyId] = useState<string>('');
  const [stateCode, setStateCode] = useState<string>('TX');
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const { trackViewContent, trackAddToCart } = useFacebookPixel();

  // Track ViewContent when component loads (pricing page view)
  useEffect(() => {
    trackViewContent({
      content_name: 'Pricing Page',
      content_type: 'service'
    });
  }, []);

  // Calculate pricing when selections change
  useEffect(() => {
    if (homeSizeId && serviceTypeId && frequencyId && stateCode) {
      try {
        const result = calculateNewPricing(homeSizeId, serviceTypeId, frequencyId, stateCode);
        
        // Apply 20% global discount to the final price
        const discountedResult = {
          ...result,
          finalPrice: applyGlobalDiscount(result.finalPrice)
        };
        
        setPricingResult(discountedResult);
        
        // Track AddToCart when user has made full selection
        if (discountedResult.finalPrice > 0) {
          const serviceType = DEFAULT_PRICING_CONFIG.serviceTypes.find(s => s.id === serviceTypeId);
          trackAddToCart({
            content_name: serviceType?.name || serviceTypeId,
            value: discountedResult.finalPrice
          });
        }
      } catch (error) {
        console.error('Pricing calculation error:', error);
        setPricingResult(null);
      }
    } else {
      setPricingResult(null);
    }
  }, [homeSizeId, serviceTypeId, frequencyId, stateCode]);

  const handleProceedToBook = () => {
    if (pricingResult && onBookingSelect) {
      onBookingSelect({
        homeSizeId,
        serviceTypeId,
        frequencyId,
        stateCode,
        pricing: pricingResult
      });
    }
  };

  const canProceed = homeSizeId && serviceTypeId && frequencyId && stateCode && pricingResult && pricingResult.finalPrice > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground">
          Get Your Cleaning Quote
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Professional cleaning services throughout Cali & Texas with transparent, upfront pricing
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* State Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Service Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={stateCode} onValueChange={setStateCode}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Select your state" />
                </SelectTrigger>
                <SelectContent>
                  {DEFAULT_PRICING_CONFIG.states.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Home Size Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Home Size</CardTitle>
              <p className="text-muted-foreground">
                Select the size range that best matches your home
              </p>
            </CardHeader>
            <CardContent>
              <HomeSizeGrid
                selectedId={homeSizeId}
                onSelect={setHomeSizeId}
              />
            </CardContent>
          </Card>

          {/* Service Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Service Type</CardTitle>
              <p className="text-muted-foreground">
                Choose the type of cleaning service you need
              </p>
            </CardHeader>
            <CardContent>
              <ServiceTypeSelector
                selectedId={serviceTypeId}
                onSelect={setServiceTypeId}
              />
            </CardContent>
          </Card>

          {/* Frequency Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Cleaning Frequency</CardTitle>
              <p className="text-muted-foreground">
                Regular service gets better rates and priority scheduling
              </p>
            </CardHeader>
            <CardContent>
              <FrequencySelector
                selectedId={frequencyId}
                onSelect={setFrequencyId}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sticky Pricing Summary */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <PricingSummaryCard
            serviceTypeId={serviceTypeId}
            frequencyId={frequencyId}
            homeSizeId={homeSizeId}
            stateCode={stateCode}
            className="mb-4"
          />
          
          {canProceed && (
            <Button
              onClick={handleProceedToBook}
              className="w-full"
              size="lg"
            >
              Proceed to Book
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}