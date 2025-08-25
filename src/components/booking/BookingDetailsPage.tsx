import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, MapPin, Phone, MessageSquare, ArrowLeft, ArrowRight, Star, Sparkles } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { US_STATES } from '@/lib/states';
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
  bookingData: Partial<BookingData>;
  updateBookingData: (updates: Partial<BookingData>) => void;
  onNext: () => void;
  onBack: () => void;
}

const timeSlots = [
  { value: '8:00 AM', label: '8:00 AM', range: '8:00 - 10:00 AM' },
  { value: '9:00 AM', label: '9:00 AM', range: '9:00 - 11:00 AM' },
  { value: '10:00 AM', label: '10:00 AM', range: '10:00 - 12:00 PM' },
  { value: '11:00 AM', label: '11:00 AM', range: '11:00 AM - 1:00 PM' },
  { value: '12:00 PM', label: '12:00 PM', range: '12:00 - 2:00 PM' },
  { value: '1:00 PM', label: '1:00 PM', range: '1:00 - 3:00 PM' },
  { value: '2:00 PM', label: '2:00 PM', range: '2:00 - 4:00 PM' },
  { value: '3:00 PM', label: '3:00 PM', range: '3:00 - 5:00 PM' },
  { value: '4:00 PM', label: '4:00 PM', range: '4:00 - 6:00 PM' }
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

  // Removed auto-scroll effects to prevent unwanted page jumping

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

      {/* Date & Time Selection */}
      <Card className="shadow-clean animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Choose Your Date & Time
          </CardTitle>
          <p className="text-muted-foreground mt-2">
            Select your preferred date and time for your cleaning service
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Date Selection Dropdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-primary" />
              <h4 className="font-semibold">Select Date</h4>
            </div>
            <Select 
              value={selectedDate ? selectedDate.toISOString() : ''} 
              onValueChange={(value) => handleDateSelect(new Date(value))}
            >
              <SelectTrigger className="w-full h-12 text-left">
                <SelectValue placeholder="Choose your preferred date" />
              </SelectTrigger>
              <SelectContent>
                {availableDates.map((date, index) => {
                  const isTomorrow = index === 0;
                  const isNextDay = nextDayBooking && index === 0;
                  
                  return (
                    <SelectItem 
                      key={date.toISOString()} 
                      value={date.toISOString()}
                      className="py-3"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-medium">
                            {date.toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {date.toLocaleDateString('en-US', { year: 'numeric' })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isTomorrow && (
                            <Badge variant="secondary" className="text-xs">Tomorrow</Badge>
                          )}
                          {isNextDay && (
                            <Badge className="bg-primary text-xs">Priority</Badge>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Time Selection Dropdown */}
          {selectedDate && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h4 className="font-semibold">Select Time</h4>
              </div>
              <Select 
                value={bookingData.serviceTime} 
                onValueChange={(value) => updateBookingData({ serviceTime: value })}
              >
                <SelectTrigger className="w-full h-12 text-left">
                  <SelectValue placeholder="Choose your preferred time" />
                </SelectTrigger>
                <SelectContent>
                  {timeSlots.map((slot) => (
                    <SelectItem 
                      key={slot.value} 
                      value={slot.value}
                      className="py-3"
                    >
                       <div className="flex items-center justify-between w-full">
                         <div>
                           <div className="font-medium">{slot.label}</div>
                           <div className="text-sm text-muted-foreground">{slot.range}</div>
                         </div>
                       </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Selected Summary */}
          {selectedDate && bookingData.serviceTime && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 animate-fade-in">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Star className="h-4 w-4" />
                <span className="font-semibold">Your Booking Summary</span>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Date:</span> {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </p>
                <p>
                  <span className="font-medium">Time:</span> {timeSlots.find(t => t.value === bookingData.serviceTime)?.label}
                </p>
                {nextDayBooking && (
                  <p className="text-primary font-medium">
                    <Sparkles className="h-3 w-3 inline mr-1" />
                    Priority Next-Day Service (+$50)
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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
                <div className="space-y-4">
                  <Label htmlFor="street" className="text-base font-medium">
                    Street Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="street"
                    placeholder="123 Main Street, Apt 4B"
                    value={bookingData.address.street}
                    onChange={(e) => handleAddressChange('street', e.target.value)}
                    className="border-border focus:border-primary"
                  />
                  <p className="text-sm text-muted-foreground">Include apartment/unit number if applicable</p>
                </div>
              
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-base font-medium">
                      City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="city"
                      placeholder="San Francisco"
                      value={bookingData.address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className="border-border focus:border-primary"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-base font-medium">State</Label>
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
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-base font-medium">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      placeholder="94102"
                      value={bookingData.address.zipCode}
                      onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                      className="border-border focus:border-primary"
                    />
                  </div>
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
            <div className="space-y-4">
              <Label htmlFor="phone" className="text-base font-medium">
                Phone Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="(555) 123-4567"
                value={bookingData.contactNumber}
                onChange={(e) => updateBookingData({ contactNumber: e.target.value })}
                className="border-border focus:border-primary"
              />
              <p className="text-sm text-muted-foreground">We'll send booking confirmations and updates to this number</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-base font-medium">Special Instructions</Label>
              <Textarea
                id="instructions"
                placeholder="Any special requests or areas that need extra attention..."
                value={bookingData.specialInstructions}
                onChange={(e) => updateBookingData({ specialInstructions: e.target.value })}
                className="border-border focus:border-primary min-h-[100px] resize-none"
                rows={4}
              />
              <p className="text-sm text-muted-foreground">Optional - Let us know about any specific areas of focus or access instructions</p>
            </div>
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