import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBooking } from '@/contexts/BookingContext';
import { HOME_SIZE_RANGES } from '@/lib/new-pricing-system';

export default function BookingHome() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();

  useEffect(() => {
    if (!bookingData.zipCode) {
      navigate('/book/zip');
    }
  }, [bookingData.zipCode, navigate]);

  const handleContinue = () => {
    navigate('/book/service');
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingProgressBar currentStep={2} totalSteps={7} />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 px-4 py-8 lg:py-12 max-w-4xl mx-auto w-full">
          <Link 
            to="/book/zip" 
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block transition-colors"
          >
            ← Previous
          </Link>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            Tell us about your home
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            We'll personalize your quote instantly
          </p>
          
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bedrooms" className="mb-2">Bedrooms</Label>
                <Select 
                  value={bookingData.bedrooms.toString()} 
                  onValueChange={(val) => updateBookingData({ bedrooms: parseInt(val) })}
                >
                  <SelectTrigger id="bedrooms" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Bedroom' : 'Bedrooms'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="bathrooms" className="mb-2">Bathrooms</Label>
                <Select 
                  value={bookingData.bathrooms.toString()} 
                  onValueChange={(val) => updateBookingData({ bathrooms: parseInt(val) })}
                >
                  <SelectTrigger id="bathrooms" className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6].map(num => (
                      <SelectItem key={num} value={num.toString()}>
                        {num} {num === 1 ? 'Bathroom' : 'Bathrooms'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="sqft" className="mb-2">Home Size</Label>
              <Select 
                value={bookingData.homeSizeId || '2001_2500'} 
                onValueChange={(val) => {
                  const range = HOME_SIZE_RANGES.find(r => r.id === val);
                  if (range) {
                    const midpoint = Math.floor((range.minSqft + range.maxSqft) / 2);
                    updateBookingData({ homeSizeId: val, sqft: midpoint });
                  }
                }}
              >
                <SelectTrigger id="sqft" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {HOME_SIZE_RANGES
                    .filter(range => !range.requiresEstimate)
                    .map(range => (
                      <SelectItem key={range.id} value={range.id}>
                        {range.label} ({range.bedroomRange})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="homeType" className="mb-2">Home Type</Label>
              <Select 
                value={bookingData.homeType} 
                onValueChange={(val: any) => updateBookingData({ homeType: val })}
              >
                <SelectTrigger id="homeType" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="house">House</SelectItem>
                  <SelectItem value="apartment">Apartment</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              size="lg" 
              className="w-full h-14 text-lg" 
              onClick={handleContinue}
            >
              Continue
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}
