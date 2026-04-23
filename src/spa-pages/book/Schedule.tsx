import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/contexts/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { addDays } from 'date-fns';
import { EnhancedDateTimePicker } from '@/components/booking/EnhancedDateTimePicker';

interface TimeSlot {
  id: string;
  time_slot: string;
  available_slots: number;
  booked_slots: number;
}

export default function BookingSchedule() {
  const navigate = useNavigate();
  const { bookingData, updateBookingData } = useBooking();
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
      // Set expiration time to 15 minutes from now
      const expiresAt = Date.now() + (15 * 60 * 1000);
      updateBookingData({ 
        date: selectedDate.toISOString().split('T')[0],
        bookingExpiresAt: expiresAt
      });
      navigate('/book/summary');
    }
  };

  const today = new Date();
  const maxDate = addDays(today, 30);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <BookingProgressBar currentStep={5} totalSteps={7} />
      
      <div className="flex-1 flex flex-col">
        <main className="flex-1 px-4 py-8 lg:py-12 max-w-4xl mx-auto w-full">
          <Link 
            to="/book/frequency" 
            className="text-sm text-muted-foreground hover:text-foreground mb-6 inline-block transition-colors"
          >
            ← Previous
          </Link>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-3">
            Pick a date & time
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Secure your spot in under 60 seconds
          </p>
          
          <div className="space-y-6">
            <EnhancedDateTimePicker
              selectedDate={selectedDate}
              selectedTime={bookingData.timeSlot}
              timeSlots={timeSlots}
              isLoadingSlots={isLoadingSlots}
              onDateSelect={setSelectedDate}
              onTimeSelect={handleTimeSlotSelect}
              minDate={today}
              maxDate={maxDate}
            />
            
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
      </div>
    </div>
  );
}
