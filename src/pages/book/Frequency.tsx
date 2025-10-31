import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { LiveEstimateCard } from '@/components/booking/LiveEstimateCard';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBooking } from '@/contexts/BookingContext';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BookingFrequency() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData, pricing } = useBooking();

  useEffect(() => {
    if (!bookingData.zipCode) {
      navigate('/book/zip');
    }
  }, [bookingData.zipCode, navigate]);

  const canRecur = bookingData.serviceType === 'regular';

  const handleFrequencySelect = (frequency: 'one_time' | 'weekly' | 'bi_weekly' | 'monthly') => {
    updateBookingData({ frequency });
  };

  const handleContinue = () => {
    navigate('/book/schedule');
  };

  const frequencies = [
    {
      id: 'one_time' as const,
      name: 'One-Time',
      description: 'Perfect for occasional needs',
      discount: null,
      allowedForAll: true,
    },
    {
      id: 'bi_weekly' as const,
      name: 'Every 2 Weeks',
      description: '2× per month',
      discount: 10,
      allowedForAll: false,
    },
    {
      id: 'monthly' as const,
      name: 'Monthly',
      description: 'Once per month',
      discount: 5,
      allowedForAll: false,
    },
    {
      id: 'weekly' as const,
      name: 'Weekly',
      description: '4× per month',
      discount: 15,
      allowedForAll: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingProgressBar currentStep={4} totalSteps={6} />
      
      <div className="flex-1 flex flex-col lg:flex-row">
        <main className="flex-1 px-4 py-8 lg:py-12 max-w-4xl mx-auto lg:mx-0 lg:max-w-none lg:w-3/5 lg:px-12">
          <Link 
            to="/book/service" 
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block transition-colors"
          >
            ← Previous
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            How often?
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Save up to 15% with recurring
          </p>
          
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            {frequencies.map((freq) => {
              const isSelected = bookingData.frequency === freq.id;
              const isDisabled = !freq.allowedForAll && !canRecur;
              
              return (
                <Card
                  key={freq.id}
                  className={cn(
                    'cursor-pointer hover:border-primary transition-all p-6',
                    isSelected && 'border-primary ring-2 ring-primary',
                    isDisabled && 'opacity-50 cursor-not-allowed hover:border-border'
                  )}
                  onClick={() => !isDisabled && handleFrequencySelect(freq.id)}
                >
                  {freq.discount && (
                    <Badge className="mb-3 bg-success text-success-foreground">
                      Save {freq.discount}%
                    </Badge>
                  )}
                  
                  <Calendar className="h-8 w-8 text-primary mb-3" />
                  <h3 className="text-xl font-bold mb-2">{freq.name}</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    {freq.description}
                  </p>
                  
                  {pricing && freq.id === bookingData.frequency && (
                    <p className="text-2xl font-bold text-primary">
                      ${pricing.finalPrice.toFixed(2)}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
          
          {!canRecur && (
            <Alert className="mb-6">
              <AlertDescription>
                Recurring service is only available for Standard Cleaning. 
                Deep and Move-In/Out cleanings are one-time services.
              </AlertDescription>
            </Alert>
          )}
          
          <p className="text-sm text-center text-muted-foreground mb-6">
            💎 <strong>Members</strong> save more + get priority booking
          </p>
          
          <Button 
            size="lg" 
            className="w-full h-14 text-lg" 
            onClick={handleContinue}
          >
            Continue
          </Button>
        </main>
        
        <aside className="hidden lg:block w-2/5 p-8 bg-muted/30">
          {pricing && (
            <LiveEstimateCard
              serviceType={bookingData.serviceType}
              frequency={bookingData.frequency}
              basePrice={pricing.basePrice}
              discountAmount={pricing.discountAmount}
              discountRate={pricing.basePrice > 0 ? Math.round((pricing.discountAmount / pricing.basePrice) * 100) : 0}
              finalPrice={pricing.finalPrice}
              depositAmount={49}
            />
          )}
        </aside>
      </div>
      
      {pricing && (
        <div className="lg:hidden sticky bottom-0 border-t bg-background p-4 shadow-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Estimated Total</span>
            <span className="text-2xl font-bold text-primary">
              ${pricing.finalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
