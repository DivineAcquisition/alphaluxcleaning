import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { BookingProgressBar } from '@/components/booking/BookingProgressBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar } from 'lucide-react';

export default function BookingDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const bookingId = searchParams.get('booking_id');

  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeBlock, setPreferredTimeBlock] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!bookingId) {
      toast.error('No booking found');
      navigate('/book/zip');
      return;
    }

    fetchBookingData();
  }, [bookingId, navigate]);

  const fetchBookingData = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, customers(*)')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      if (!data || data.payment_status !== 'paid') {
        toast.error('Payment not confirmed');
        navigate('/book/zip');
        return;
      }

      setBookingData(data);
      
      // Pre-fill city, state, zip from booking
      setCity(data.customers?.city || '');
      setState(data.customers?.state || '');
      setZipCode(data.zip_code || '');
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Failed to load booking data');
      navigate('/book/zip');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addressLine1 || !city || !state || !zipCode || !preferredDate || !preferredTimeBlock) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Update booking with address and scheduling details
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          address_line1: addressLine1,
          address_line2: addressLine2 || null,
          preferred_date: preferredDate,
          preferred_time_block: preferredTimeBlock,
          special_instructions: notes || null,
          status: 'confirmed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Update customer with full address
      if (bookingData?.customer_id) {
        const { error: customerError } = await supabase
          .from('customers')
          .update({
            address_line1: addressLine1,
            address_line2: addressLine2 || null,
            city,
            state,
            postal_code: zipCode,
          })
          .eq('id', bookingData.customer_id);

        if (customerError) throw customerError;
      }

      toast.success('Booking confirmed!');
      navigate(`/book/confirmation?booking_id=${bookingId}`);
    } catch (error) {
      console.error('Error updating booking:', error);
      toast.error('Failed to update booking details');
    } finally {
      setLoading(false);
    }
  };

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <BookingProgressBar currentStep={5} totalSteps={6} />

      <div className="max-w-2xl mx-auto px-4 py-8 md:py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
            Almost Done! Let's Schedule Your Clean
          </h1>
          <p className="text-lg text-muted-foreground">
            We have your payment. Now let's get your home details.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Address */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Service Address</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="address1">Address Line 1 *</Label>
                <Input
                  id="address1"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  value={addressLine2}
                  onChange={(e) => setAddressLine2(e.target.value)}
                  placeholder="Apt, Suite, Unit (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="zip">ZIP Code *</Label>
                <Input
                  id="zip"
                  value={zipCode}
                  onChange={(e) => setZipCode(e.target.value)}
                  required
                />
              </div>
            </div>
          </Card>

          {/* Scheduling */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Preferred Scheduling
            </h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="date">Preferred Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={preferredDate}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="timeBlock">Preferred Time Block *</Label>
                <Select value={preferredTimeBlock} onValueChange={setPreferredTimeBlock} required>
                  <SelectTrigger id="timeBlock">
                    <SelectValue placeholder="Select a time window" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning (8-11 AM)</SelectItem>
                    <SelectItem value="afternoon">Afternoon (12-3 PM)</SelectItem>
                    <SelectItem value="evening">Evening (3-6 PM)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Additional Notes */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Additional Notes</h2>
            
            <div>
              <Label htmlFor="notes">Anything we should know before arriving?</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate code, pets, parking instructions, special requests..."
                rows={4}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Optional: Let us know about pets, access codes, or any special instructions
              </p>
            </div>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Completing Booking...' : 'Complete Booking'}
          </Button>
        </form>
      </div>
    </div>
  );
}
