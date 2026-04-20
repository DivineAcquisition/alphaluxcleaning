import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBooking } from '@/contexts/BookingContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Home, Calendar } from 'lucide-react';

const generateAvailableDates = () => {
  const dates = [];
  const today = new Date();
  
  for (let i = 1; i <= 14; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    if (date.getDay() !== 0) {
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        })
      });
    }
  }
  
  return dates;
};

const timeSlots = [
  { value: '8am-12pm', label: '8:00 AM - 12:00 PM' },
  { value: '12pm-4pm', label: '12:00 PM - 4:00 PM' },
  { value: '2pm-6pm', label: '2:00 PM - 6:00 PM' },
];

export default function AdditionalDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { bookingData, updateBookingData } = useBooking();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [bedrooms, setBedrooms] = useState(bookingData.bedrooms);
  const [bathrooms, setBathrooms] = useState(bookingData.bathrooms);
  const [homeType, setHomeType] = useState(bookingData.homeType);
  const [preferredDate, setPreferredDate] = useState(bookingData.date);
  const [preferredTime, setPreferredTime] = useState(bookingData.timeSlot);
  const [notes, setNotes] = useState(bookingData.specialInstructions);

  const bookingId = searchParams.get('booking_id');
  const availableDates = generateAvailableDates();

  useEffect(() => {
    if (!bookingId) {
      navigate('/book/zip');
    }
  }, [bookingId, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Update booking context
      updateBookingData({
        bedrooms,
        bathrooms,
        homeType,
        date: preferredDate,
        timeSlot: preferredTime,
        specialInstructions: notes,
        additionalDetailsCollected: true,
      });

      // Update booking record in database
      const { error } = await supabase
        .from('bookings')
        .update({
          property_details: {
            bedrooms,
            bathrooms,
            homeType,
          },
          service_date: preferredDate,
          time_slot: preferredTime,
          special_instructions: notes,
        })
        .eq('id', bookingId);

      if (error) throw error;

      toast.success('Details saved successfully!');
      navigate(`/book/success?booking_id=${bookingId}`);
    } catch (error: any) {
      console.error('Error saving details:', error);
      toast.error('Failed to save details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Home className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Just a few more details...
          </h1>
          <p className="text-lg text-muted-foreground">
            Help us prepare the perfect deep clean for your home
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Home Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Select value={bedrooms.toString()} onValueChange={(val) => setBedrooms(Number(val))}>
                    <SelectTrigger id="bedrooms">
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
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Select value={bathrooms.toString()} onValueChange={(val) => setBathrooms(Number(val))}>
                    <SelectTrigger id="bathrooms">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(num => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? 'Bathroom' : 'Bathrooms'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="homeType">Home Type</Label>
                <Select value={homeType} onValueChange={(val: any) => setHomeType(val)}>
                  <SelectTrigger id="homeType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="condo">Condo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Preferred Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="preferredDate">Preferred Date</Label>
                <Select value={preferredDate} onValueChange={setPreferredDate}>
                  <SelectTrigger id="preferredDate">
                    <SelectValue placeholder="Select a date" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableDates.map(date => (
                      <SelectItem key={date.value} value={date.value}>
                        {date.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="preferredTime">Preferred Time</Label>
                <Select value={preferredTime} onValueChange={setPreferredTime}>
                  <SelectTrigger id="preferredTime">
                    <SelectValue placeholder="Select a time" />
                  </SelectTrigger>
                  <SelectContent>
                    {timeSlots.map(slot => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Special Requests (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                placeholder="Any specific areas of focus, pets, access instructions, or special requests..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          <Button 
            type="submit" 
            size="lg" 
            className="w-full"
            disabled={isSubmitting || !preferredDate || !preferredTime}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Saving...
              </>
            ) : (
              'Continue to Confirmation'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
