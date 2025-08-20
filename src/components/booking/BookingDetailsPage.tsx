import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, MapPin, Phone, MessageSquare, ArrowLeft, ArrowRight, Star, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { US_STATES } from '@/lib/states';
import { MobileTimeSlotPicker, MobileFormField } from './MobileBookingOptimizations';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBookingRetry, bookingRetryStrategies } from '@/hooks/useBookingRetry';

interface BookingData {
  serviceDate: string;
  serviceTime: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  contactNumber: string;
  specialInstructions: string;
  nextDayFee?: number;
}

interface Props {
  bookingData: BookingData;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const timeSlots = [
  { value: '8:00 AM', label: '8:00 AM', range: '8:00 - 10:00 AM', popular: false },
  { value: '9:00 AM', label: '9:00 AM', range: '9:00 - 11:00 AM', popular: true },
  { value: '10:00 AM', label: '10:00 AM', range: '10:00 - 12:00 PM', popular: true },
  { value: '11:00 AM', label: '11:00 AM', range: '11:00 AM - 1:00 PM', popular: false },
  { value: '12:00 PM', label: '12:00 PM', range: '12:00 - 2:00 PM', popular: false },
  { value: '1:00 PM', label: '1:00 PM', range: '1:00 - 3:00 PM', popular: true },
  { value: '2:00 PM', label: '2:00 PM', range: '2:00 - 4:00 PM', popular: true },
  { value: '3:00 PM', label: '3:00 PM', range: '3:00 - 5:00 PM', popular: false },
  { value: '4:00 PM', label: '4:00 PM', range: '4:00 - 6:00 PM', popular: false }
];

export function BookingDetailsPage({ bookingData, updateBookingData, onNext, onBack }: Props) {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    bookingData.serviceDate ? new Date(bookingData.serviceDate) : undefined
  );
  const [nextDayBooking, setNextDayBooking] = useState(false);
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
  
  // Retry hook for availability checks
  const { executeWithRetry, isRetrying } = useBookingRetry({
    ...bookingRetryStrategies.availability,
    onError: (error) => {
      toast.error('Failed to check availability', {
        description: error.message
      });
    }
  });

  // Generate available dates starting 5 days out (next 21 days, excluding Sundays)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 5; i <= 35; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      if (date.getDay() !== 0) { // Skip Sundays
        dates.push(date);
      }
      
      if (dates.length >= 21) break;
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  // Auto-scroll effect when form sections are completed
  useEffect(() => {
    if (selectedDate) {
      const timeSlotSection = document.getElementById('time-slot-section');
      timeSlotSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedDate]);

  useEffect(() => {
    if (bookingData.serviceTime) {
      const addressSection = document.getElementById('address-section');
      addressSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [bookingData.serviceTime]);

  const handleDateSelect = async (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setIsLoadingAvailability(true);
      
      try {
        await executeWithRetry(async () => {
          // Simulate availability check
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const nextDayFee = isNextDay(date) && nextDayBooking ? 50 : 0;
          updateBookingData({ 
            serviceDate: date.toISOString().split('T')[0],
            nextDayFee
          });
        }, 'availability check');
      } finally {
        setIsLoadingAvailability(false);
      }
    }
  };

  const isNextDay = (date: Date) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const handleNextDayToggle = (checked: boolean) => {
    setNextDayBooking(checked);
    if (selectedDate) {
      const nextDayFee = isNextDay(selectedDate) && checked ? 50 : 0;
      updateBookingData({ nextDayFee });
    }
  };

  const handleTimeSelect = (time: string) => {
    updateBookingData({ serviceTime: time });
  };

  const handleAddressChange = (field: string, value: string) => {
    updateBookingData({
      address: {
        ...bookingData.address,
        [field]: value
      }
    });
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable dates before tomorrow or Sundays
    return date < today || date.getDay() === 0 || !availableDates.some(d => 
      d.toDateString() === date.toDateString()
    );
  };

  const canProceed = () => {
    return bookingData.serviceDate && 
           bookingData.serviceTime && 
           bookingData.address.street && 
           bookingData.contactNumber;
  };

  return (
    <div className="space-y-8">
      
      {/* Next Day Priority */}
      <Card className="shadow-clean border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Next Day Priority Service
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-background">
            <div className="flex-1">
              <h4 className="font-semibold text-primary">Get Priority Booking Tomorrow</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Guaranteed service within 24 hours with premium scheduling
              </p>
              <Badge className="mt-2 bg-primary text-primary-foreground">
                +$50 Priority Fee
              </Badge>
            </div>
            <Switch
              checked={nextDayBooking}
              onCheckedChange={handleNextDayToggle}
            />
          </div>
        </CardContent>
      </Card>

      {/* Date Selection */}
      <Card className="shadow-clean animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Choose Your Date
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex-1">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                className="rounded-md border mx-auto"
                classNames={{
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground",
                }}
              />
            </div>
            
            {/* Quick Date Selection */}
            <div className="flex-1 space-y-3">
              <h4 className="font-semibold">Quick Select</h4>
              <div className="grid grid-cols-1 gap-2">
                {availableDates.slice(0, 6).map((date, index) => {
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const isTomorrow = index === 0;
                  
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleDateSelect(date)}
                      className={cn(
                        "p-3 rounded-lg border text-left transition-all duration-200 hover:shadow-md",
                        isSelected 
                          ? "border-primary bg-primary/5 shadow-clean"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {date.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          {isTomorrow && (
                            <Badge variant="secondary" className="mt-1">Tomorrow</Badge>
                          )}
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slot Selection */}
      {selectedDate && (
        <Card className="shadow-clean animate-fade-in" id="time-slot-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Select Your Time
              {isLoadingAvailability && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-2" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MobileTimeSlotPicker
              timeSlots={timeSlots}
              selectedTime={bookingData.serviceTime}
              onTimeSelect={handleTimeSelect}
            />
          </CardContent>
        </Card>
      )}

      {/* Address Information */}
      {bookingData.serviceTime && (
        <Card className="shadow-clean animate-fade-in" id="address-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Service Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <MobileFormField 
                label="Street Address" 
                required
                help="Include apartment/unit number if applicable"
              >
                <Input
                  id="street"
                  placeholder="123 Main Street, Apt 4B"
                  value={bookingData.address.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  className="border-border focus:border-primary"
                />
              </MobileFormField>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MobileFormField label="City" required>
                  <Input
                    id="city"
                    placeholder="San Francisco"
                    value={bookingData.address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="border-border focus:border-primary"
                  />
                </MobileFormField>
                
                <MobileFormField label="State">
                  <Select 
                    value={bookingData.address.state} 
                    onValueChange={(value) => handleAddressChange('state', value)}
                  >
                    <SelectTrigger className="min-h-[48px]">
                      <SelectValue placeholder="CA" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(state => (
                        <SelectItem key={state.abbreviation} value={state.abbreviation}>
                          {state.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </MobileFormField>
                
                <MobileFormField label="ZIP Code">
                  <Input
                    id="zipCode"
                    placeholder="94102"
                    value={bookingData.address.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    className="border-border focus:border-primary"
                  />
                </MobileFormField>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      {bookingData.address.street && (
        <Card className="shadow-clean animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <MobileFormField 
              label="Phone Number" 
              required
              help="We'll send booking confirmations and updates to this number"
            >
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={bookingData.contactNumber}
                onChange={(e) => updateBookingData({ contactNumber: e.target.value })}
                className="border-border focus:border-primary"
              />
            </MobileFormField>
            
            <MobileFormField 
              label="Special Instructions"
              help="Optional - Let us know about any specific areas of focus or access instructions"
            >
              <Textarea
                id="instructions"
                placeholder="Any special requests or areas that need extra attention..."
                value={bookingData.specialInstructions}
                onChange={(e) => updateBookingData({ specialInstructions: e.target.value })}
                className="border-border focus:border-primary min-h-[100px] resize-none"
                rows={4}
              />
            </MobileFormField>
          </CardContent>
        </Card>
      )}

      {/* Navigation - Hidden on mobile (handled by MobileBottomNav) */}
      {!isMobile && (
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Button 
            variant="outline"
            onClick={onBack}
            className="flex items-center gap-2"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Service Selection
          </Button>
          
          <Button 
            onClick={onNext}
            disabled={!canProceed() || isRetrying}
            className="flex items-center gap-2"
            size="lg"
          >
            {isRetrying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Checking Availability...
              </>
            ) : (
              <>
                Continue to Payment
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}