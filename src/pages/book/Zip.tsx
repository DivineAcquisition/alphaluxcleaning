import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBooking } from '@/contexts/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { CleaningShowcaseCarousel } from '@/components/booking/CleaningShowcaseCarousel';
import { ReviewsWidget } from '@/components/booking/ReviewsWidget';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';

export default function BookingZip() {
  const navigate = useNavigate();
  const {
    updateBookingData
  } = useBooking();
  const [zipCode, setZipCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleZipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
    setZipCode(value);
    setError('');
  };
  const handleCheckAvailability = async () => {
    if (zipCode.length !== 5) {
      setError('Please enter a valid 5-digit ZIP code');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const {
        data,
        error: functionError
      } = await supabase.functions.invoke('validate-zip', {
        body: {
          zipCode
        }
      });
      if (functionError) throw functionError;
      if (data?.isValid) {
        // Store ZIP data and proceed
        updateBookingData({
          zipCode,
          city: data.city,
          state: data.state
        });

        // Pre-fill contact info city/state/zip
        updateBookingData({
          contactInfo: {
            city: data.city,
            state: data.state,
            zip: zipCode
          } as any
        });
        navigate('/book/sqft');
      } else {
        setError(data?.message || "We don't service this area yet.");
      }
    } catch (err: any) {
      console.error('ZIP validation error:', err);
      setError('Failed to validate ZIP code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && zipCode.length === 5) {
      handleCheckAvailability();
    }
  };
  return <div className="min-h-screen flex flex-col bg-background">
      <BookingProgressBar currentStep={1} totalSteps={6} />
      
      <main className="flex-1 flex items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-2xl">
          {/* Google Guaranteed Badge */}
          <div className="flex justify-center mb-6">
            <GoogleGuaranteedBadge variant="standard" />
          </div>
          
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-5xl font-jakarta font-bold mb-3 leading-tight">
              New Year Special: $50 Off Your First Clean
              <span className="block text-primary mt-2">
                + 15% Off Recurring Service
              </span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl">
              Book by Jan 7th — Enter your ZIP to get started
            </p>
          </div>
          
          <Card className="p-6 md:p-8">
            <div className="space-y-4">
              <div>
                <Label htmlFor="zip" className="text-base mb-2">
                  ZIP Code
                </Label>
                <Input id="zip" type="text" inputMode="numeric" maxLength={5} placeholder="75001" value={zipCode} onChange={handleZipChange} onKeyPress={handleKeyPress} className="text-lg md:text-2xl text-center h-12 md:h-16 tracking-wider" autoFocus disabled={isLoading} />
              </div>
              
              {error && <Alert variant="destructive">
                  <AlertDescription className="text-center">
                    {error}
                    {error.includes("don't service") && <div className="mt-2">
                        <a href="tel:9725590223" className="font-medium underline">
                          Call (972) 559-0223
                        </a>
                        {' '}for options
                      </div>}
                  </AlertDescription>
                </Alert>}
              
              <Button size="lg" className="w-full h-14 text-lg" onClick={handleCheckAvailability} disabled={isLoading || zipCode.length !== 5}>
                {isLoading ? <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Checking...
                  </> : 'Check Availability'}
              </Button>
            </div>
          </Card>
          
          <CleaningShowcaseCarousel />
          
          <ReviewsWidget />
          
          <p className="text-sm text-center text-muted-foreground mt-6">
            By booking you agree to AlphaLuxClean's terms & service policy
          </p>
        </div>
      </main>
    </div>;
}