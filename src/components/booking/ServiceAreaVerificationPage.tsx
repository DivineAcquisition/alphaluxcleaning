import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MapPin, ArrowRight, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateServiceAreaZipCode, SERVICE_AREA_INFO } from '@/lib/service-area-validation';

interface Props {
  bookingData: { serviceZipCode?: string };
  updateBookingData: (updates: { serviceZipCode: string }) => void;
  onNext: () => void;
}

export function ServiceAreaVerificationPage({ bookingData, updateBookingData, onNext }: Props) {
  const [zipError, setZipError] = useState<string>('');
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    if (bookingData.serviceZipCode && bookingData.serviceZipCode.length >= 5) {
      const validation = validateServiceAreaZipCode(bookingData.serviceZipCode);
      setIsValid(validation.isValid);
      setZipError(validation.isValid ? '' : validation.message || 'Invalid ZIP code');
    } else {
      setIsValid(false);
      setZipError('');
    }
  }, [bookingData.serviceZipCode]);

  const handleZipCodeChange = (zipCode: string) => {
    updateBookingData({ serviceZipCode: zipCode });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <MapPin className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Bay Area Cleaning Services
        </h1>
        <p className="text-lg text-muted-foreground">
          Professional cleaning services for the Greater Baytown area
        </p>
      </div>

      <Card className="shadow-clean border-primary/20">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 text-center">
          <CardTitle className="text-xl">
            Check Service Area Availability
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Enter your ZIP code to verify we service your location
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-3">
            <label htmlFor="zipcode" className="block text-sm font-medium">
              Your ZIP Code
            </label>
            <div className="relative">
              <Input
                id="zipcode"
                placeholder="Enter your 5-digit ZIP code (e.g. 77520)"
                value={bookingData.serviceZipCode || ''}
                onChange={(e) => handleZipCodeChange(e.target.value)}
                className={cn(
                  "text-lg h-12 pr-12",
                  zipError ? "border-destructive focus:border-destructive" : 
                  isValid ? "border-success focus:border-success" : ""
                )}
                maxLength={5}
              />
              {isValid && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-success" />
              )}
            </div>

            {zipError && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-destructive text-sm">{zipError}</p>
              </div>
            )}

            {isValid && (
              <div className="bg-success/10 border border-success/20 rounded-lg p-3">
                <p className="text-success text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Excellent! We service your area.
                </p>
                <p className="text-success/80 text-sm mt-1">
                  You're within our {SERVICE_AREA_INFO.radiusMiles}-mile service radius from {SERVICE_AREA_INFO.centerCity}.
                </p>
              </div>
            )}
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-foreground">Our Service Area</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Bay Area Cleaning Services</strong> provides professional residential cleaning 
                throughout the Greater Baytown area within a {SERVICE_AREA_INFO.radiusMiles}-mile radius.
              </p>
              <p className="font-medium">We serve:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Baytown and all surrounding neighborhoods</li>
                <li>Pasadena, Deer Park, and La Porte</li>
                <li>East Houston communities</li>
                <li>Channelview, Highlands, and Mont Belvieu</li>
                <li>Crosby, Huffman, and nearby areas</li>
              </ul>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              onClick={onNext}
              disabled={!isValid}
              className="w-full h-12 text-lg"
              size="lg"
            >
              {isValid ? 'Continue to Service Selection' : 'Enter Valid ZIP Code to Continue'}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          {!isValid && bookingData.serviceZipCode && (
            <div className="text-center text-sm text-muted-foreground border-t pt-4">
              <p>Outside our service area?</p>
              <p>Contact us at <span className="font-medium">{SERVICE_AREA_INFO.contactPhone}</span> for special requests.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}