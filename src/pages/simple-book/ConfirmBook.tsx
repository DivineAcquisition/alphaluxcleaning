import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SimpleProgressBar } from '@/components/booking/SimpleProgressBar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSimpleBooking } from '@/contexts/SimpleBookingContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Home, DollarSign, Calendar, Shield, CheckCircle2 } from 'lucide-react';

const TIME_BLOCKS = [
  { value: 'morning', label: 'Morning (8–11 AM)' },
  { value: 'afternoon', label: 'Afternoon (12–3 PM)' },
  { value: 'evening', label: 'Evening (3–6 PM)' },
];

export default function ConfirmBook() {
  const navigate = useNavigate();
  const { bookingData, updateScheduleDetails, clearBookingData } = useSimpleBooking();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleData, setScheduleData] = useState(bookingData.scheduleDetails);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setScheduleData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!scheduleData.preferredDate) {
      newErrors.preferredDate = 'Please select a preferred date';
    } else {
      const selectedDate = new Date(scheduleData.preferredDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        newErrors.preferredDate = 'Date cannot be in the past';
      }
    }

    if (!scheduleData.preferredTimeBlock) {
      newErrors.preferredTimeBlock = 'Please select a time block';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirmBooking = async () => {
    if (!validate()) return;

    updateScheduleDetails(scheduleData);

    setIsSubmitting(true);

    try {
      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .insert({
          email: bookingData.homeDetails.email,
          name: bookingData.homeDetails.fullName,
          first_name: bookingData.homeDetails.fullName.split(' ')[0],
          last_name: bookingData.homeDetails.fullName.split(' ').slice(1).join(' '),
          phone: bookingData.homeDetails.phone,
          address_line1: bookingData.homeDetails.addressLine1,
          address_line2: bookingData.homeDetails.addressLine2,
          city: bookingData.homeDetails.city,
          state: bookingData.homeDetails.state,
          postal_code: bookingData.homeDetails.zipCode,
        })
        .select()
        .single();

      if (customerError) throw customerError;

      const { data: bookingRecord, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          customer_id: customerData.id,
          full_name: bookingData.homeDetails.fullName,
          email: bookingData.homeDetails.email,
          phone: bookingData.homeDetails.phone,
          address_line1: bookingData.homeDetails.addressLine1,
          address_line2: bookingData.homeDetails.addressLine2,
          city: bookingData.homeDetails.city,
          state: bookingData.homeDetails.state,
          zip_code: bookingData.homeDetails.zipCode,
          home_size: bookingData.homeDetails.homeSize,
          sqft_or_bedrooms: bookingData.homeDetails.sqFt || bookingData.homeDetails.homeSize,
          offer_type: bookingData.planOffer.offerType,
          offer_name: bookingData.planOffer.offerName,
          base_price: bookingData.planOffer.basePrice,
          visit_count: bookingData.planOffer.visitCount,
          is_recurring: bookingData.planOffer.isRecurring,
          preferred_date: scheduleData.preferredDate,
          preferred_time_block: scheduleData.preferredTimeBlock,
          notes: scheduleData.notes,
          status: 'pending',
          service_type: 'deep',
          frequency: bookingData.planOffer.isRecurring ? 'monthly' : 'one_time',
          est_price: bookingData.planOffer.basePrice,
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      toast({
        title: 'Booking Confirmed! 🎉',
        description: 'Your deep clean is locked in. Check your email for details.',
      });

      navigate(`/simple-book/success?booking_id=${bookingRecord.id}`);
      
      setTimeout(() => {
        clearBookingData();
      }, 1000);
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: 'Booking Failed',
        description: 'Something went wrong. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { homeDetails, planOffer } = bookingData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <SimpleProgressBar currentStep={3} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Confirm Your Booking
          </h1>
          <p className="text-lg text-muted-foreground">
            Review your details and schedule your service
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Your Details */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Your Details</h2>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-medium">Name:</span> {homeDetails.fullName}</p>
                <p><span className="font-medium">Email:</span> {homeDetails.email}</p>
                <p><span className="font-medium">Phone:</span> {homeDetails.phone}</p>
                <p><span className="font-medium">Address:</span> {homeDetails.addressLine1}</p>
                {homeDetails.addressLine2 && <p className="pl-16">{homeDetails.addressLine2}</p>}
                <p className="pl-16">{homeDetails.city}, {homeDetails.state} {homeDetails.zipCode}</p>
                <p><span className="font-medium">Home Size:</span> {homeDetails.homeSize}</p>
              </div>
            </Card>

            {/* Your Plan */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Home className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Your Plan</h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{planOffer.offerName}</span>
                  <span className="text-2xl font-bold text-primary">${planOffer.basePrice}</span>
                </div>
                {planOffer.isRecurring && (
                  <p className="text-sm text-muted-foreground">
                    Includes 1 Deep Clean + 3 Maintenance Visits
                  </p>
                )}
              </div>
            </Card>

            {/* Schedule */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Schedule Your Service</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="preferredDate">Preferred Date *</Label>
                  <input
                    type="date"
                    id="preferredDate"
                    value={scheduleData.preferredDate}
                    onChange={e => handleChange('preferredDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={`
                      flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm
                      ${errors.preferredDate ? 'border-destructive' : 'border-input'}
                    `}
                  />
                  {errors.preferredDate && (
                    <p className="text-sm text-destructive mt-1">{errors.preferredDate}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="preferredTimeBlock">Preferred Time Block *</Label>
                  <Select
                    value={scheduleData.preferredTimeBlock}
                    onValueChange={value => handleChange('preferredTimeBlock', value)}
                  >
                    <SelectTrigger className={errors.preferredTimeBlock ? 'border-destructive' : ''}>
                      <SelectValue placeholder="Select time block" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_BLOCKS.map(block => (
                        <SelectItem key={block.value} value={block.value}>
                          {block.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.preferredTimeBlock && (
                    <p className="text-sm text-destructive mt-1">{errors.preferredTimeBlock}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="notes">Anything we should know before arriving?</Label>
                  <Textarea
                    id="notes"
                    value={scheduleData.notes}
                    onChange={e => handleChange('notes', e.target.value)}
                    placeholder="Pet info, parking instructions, gate codes, etc."
                    rows={3}
                  />
                </div>
              </div>
            </Card>

            {/* Guarantee */}
            <Card className="p-6 bg-muted/50">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">48-Hour Re-Clean Guarantee</h3>
                  <p className="text-sm text-muted-foreground">
                    If we miss anything on our checklist, text us within 48 hours and we'll come back to fix it free.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar - Order Summary */}
          <div>
            <Card className="p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Order Summary</h2>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span>{planOffer.offerName}</span>
                  <span className="font-medium">${planOffer.basePrice}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="font-semibold">Total</span>
                  <span className="text-2xl font-bold text-primary">${planOffer.basePrice}</span>
                </div>
              </div>

              <Button
                onClick={handleConfirmBooking}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                <CheckCircle2 className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-xs text-muted-foreground text-center mt-4">
                You'll receive confirmation via email and SMS
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
