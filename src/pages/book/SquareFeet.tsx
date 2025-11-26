import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBooking } from '@/contexts/BookingContext';
import { HOME_SIZE_RANGES } from '@/lib/new-pricing-system';
import { Home, ArrowRight, CheckCircle } from 'lucide-react';
import { CleaningShowcaseCarousel } from '@/components/booking/CleaningShowcaseCarousel';
import { ReviewsWidget } from '@/components/booking/ReviewsWidget';
import { GoogleGuaranteedBadge } from '@/components/trust/GoogleGuaranteedBadge';

export default function BookingSquareFeet() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData, pricing } = useBooking();
  const [selectedId, setSelectedId] = useState(bookingData.homeSizeId);

  useEffect(() => {
    if (!bookingData.zipCode) {
      navigate('/book/zip');
    }
  }, [bookingData.zipCode, navigate]);

  const handleSelect = (homeSizeId: string) => {
    setSelectedId(homeSizeId);
    updateBookingData({ homeSizeId });
    
    // Auto-navigate to offer after selection
    setTimeout(() => {
      navigate('/book/offer');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <BookingProgressBar currentStep={2} totalSteps={6} />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            How big is your home?
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Select your home size to see instant pricing for a professional deep clean
          </p>
          <div className="flex justify-center mt-4">
            <GoogleGuaranteedBadge variant="compact" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {HOME_SIZE_RANGES.filter(range => !range.requiresEstimate).map((range) => {
            const isSelected = selectedId === range.id;
            
            return (
              <Card
                key={range.id}
                className={`relative p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${
                  isSelected 
                    ? 'border-primary border-2 bg-primary/5 shadow-lg' 
                    : 'border-border hover:border-primary/50 hover:shadow-md'
                }`}
                onClick={() => handleSelect(range.id)}
              >
                {isSelected && (
                  <div className="absolute -top-3 -right-3 bg-primary rounded-full p-2">
                    <CheckCircle className="h-5 w-5 text-primary-foreground" />
                  </div>
                )}
                
                <div className="text-center space-y-3">
                  <div className="text-2xl font-bold text-foreground">
                    {range.label}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {range.bedroomRange}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Custom size option */}
        <Card className="p-6 text-center border-dashed">
          <p className="text-muted-foreground mb-3">
            Home larger than 5,000 sq ft?
          </p>
          <Button variant="outline" asChild>
            <a href="tel:+19725590223" className="flex items-center gap-2">
              Call for Custom Quote
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </Card>
        
        <CleaningShowcaseCarousel />
        
        <ReviewsWidget />
      </div>
    </div>
  );
}
