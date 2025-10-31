import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { LiveEstimateCard } from '@/components/booking/LiveEstimateCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { useBooking } from '@/contexts/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlot {
  id: string;
  time_slot: string;
  available_slots: number;
  booked_slots: number;
}

export default function BookingSchedule() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData, pricing } = useBooking();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  useEffect(() => {
    if (!bookingData.zipCode) {
      navigate('/book/zip');
    }
  }, [bookingData.zipCode, navigate]);

  useEffect(() => {
    if (selectedDate) {
      fetchTimeSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchTimeSlots = async (date: Date) => {
    setIsLoadingSlots(true);
    try {
      const dateStr = date.toISOString().split('T')[0];
      const { data, error } = await supabase.functions.invoke('get-available-slots', {
        body: { date: dateStr, zipCode: bookingData.zipCode },
      });

      if (error) throw error;
      setTimeSlots(data?.slots || []);
    } catch (err) {
      console.error('Failed to fetch time slots:', err);
      setTimeSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleTimeSlotSelect = (slot: string) => {
    updateBookingData({ timeSlot: slot });
  };

  const handleContinue = () => {
    if (selectedDate && bookingData.timeSlot) {
      updateBookingData({ date: selectedDate.toISOString().split('T')[0] });
      navigate('/book/checkout');
    }
  };

  const today = new Date();
  const maxDate = addDays(today, 30);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingProgressBar currentStep={5} totalSteps={6} />
      
      <div className="flex-1 flex flex-col lg:flex-row">
        <main className="flex-1 px-4 py-8 lg:py-12 max-w-4xl mx-auto lg:mx-0 lg:max-w-none lg:w-3/5 lg:px-12">
          <Link 
            to="/book/frequency" 
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block transition-colors"
          >
            ← Previous
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Pick a date & time
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Secure your spot in under 60 seconds
          </p>
          
          <div className="space-y-6">
            <div>
              <Label className="mb-3 block">Select Date</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => {
                  return date < today || date > maxDate || date.getDay() === 0;
                }}
                className="rounded-md border mx-auto"
              />
            </div>
            
            {selectedDate && (
              <div>
                <Label className="mb-3 block">Select Time</Label>
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : timeSlots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No slots available for this date
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {timeSlots.map((slot) => {
                      const available = slot.available_slots - slot.booked_slots;
                      const isSelected = bookingData.timeSlot === slot.time_slot;
                      
                      return (
                        <Button
                          key={slot.id}
                          variant={isSelected ? 'default' : 'outline'}
                          className={cn(
                            'h-auto py-4 flex flex-col items-center justify-center',
                            available <= 3 && 'border-warning'
                          )}
                          onClick={() => handleTimeSlotSelect(slot.time_slot)}
                          disabled={available < 1}
                        >
                          <span className="font-medium text-base">{slot.time_slot}</span>
                          {available <= 3 && available > 0 && (
                            <Badge className="mt-2 text-xs bg-warning text-warning-foreground">
                              Only {available} spots left
                            </Badge>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
            <Button 
              size="lg" 
              className="w-full h-14 text-lg" 
              onClick={handleContinue}
              disabled={!selectedDate || !bookingData.timeSlot}
            >
              Continue to Checkout
            </Button>
          </div>
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
