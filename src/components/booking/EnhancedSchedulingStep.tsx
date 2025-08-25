import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Star, 
  Zap, 
  CheckCircle2, 
  Loader2,
  Crown
} from 'lucide-react';
import { format, addDays, isWeekend, isSunday } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface TimeSlot {
  value: string;
  label: string;
  popular: boolean;
  available: boolean;
}

interface EnhancedSchedulingStepProps {
  selectedDate?: Date;
  selectedTime?: string;
  nextDayUpsell?: boolean;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
  onNextDayToggle: (enabled: boolean) => void;
  serviceType?: string;
}

export function EnhancedSchedulingStep({
  selectedDate,
  selectedTime,
  nextDayUpsell = false,
  onDateChange,
  onTimeChange,
  onNextDayToggle,
  serviceType = 'general'
}: EnhancedSchedulingStepProps) {
  const [availabilityData, setAvailabilityData] = useState<{[key: string]: TimeSlot[]}>({});
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [calendarConnected, setCalendarConnected] = useState(false);

  const baseTimeSlots: Omit<TimeSlot, 'available'>[] = [
    { value: '8:00 AM', label: '8:00 AM - 10:00 AM', popular: false },
    { value: '9:00 AM', label: '9:00 AM - 11:00 AM', popular: true },
    { value: '10:00 AM', label: '10:00 AM - 12:00 PM', popular: true },
    { value: '11:00 AM', label: '11:00 AM - 1:00 PM', popular: false },
    { value: '12:00 PM', label: '12:00 PM - 2:00 PM', popular: false },
    { value: '1:00 PM', label: '1:00 PM - 3:00 PM', popular: true },
    { value: '2:00 PM', label: '2:00 PM - 4:00 PM', popular: true },
    { value: '3:00 PM', label: '3:00 PM - 5:00 PM', popular: false },
    { value: '4:00 PM', label: '4:00 PM - 6:00 PM', popular: false }
  ];

  const getServiceDuration = (type: string) => {
    const durations: { [key: string]: number } = {
      'general': 2,
      'deep': 3,
      'move-in': 4,
      'move-out': 4
    };
    return durations[type] || 2;
  };

  const checkDateAvailability = async (date: Date) => {
    if (!date) return;
    
    setIsCheckingAvailability(true);
    const dateKey = format(date, 'yyyy-MM-dd');
    
    try {
      // Check calendar connection first
      const { data: connectionData } = await supabase.functions.invoke('get-live-availability', {
        body: { action: 'check_connection' }
      });
      
      setCalendarConnected(connectionData?.connected || false);
      
      // Get availability for the date
      const { data: availabilityResponse } = await supabase.functions.invoke('get-live-availability', {
        body: { 
          date: dateKey,
          duration: getServiceDuration(serviceType)
        }
      });

      // Process availability data
      const timeSlotsWithAvailability = baseTimeSlots.map(slot => ({
        ...slot,
        available: availabilityResponse?.available_slots?.some((availableSlot: any) => 
          availableSlot.start.includes(slot.value.replace(' AM', '').replace(' PM', ''))
        ) ?? true // Default to available if no data
      }));

      setAvailabilityData(prev => ({
        ...prev,
        [dateKey]: timeSlotsWithAvailability
      }));
    } catch (error) {
      console.error('Error checking availability:', error);
      // Fallback: set all slots as available
      const fallbackSlots = baseTimeSlots.map(slot => ({ ...slot, available: true }));
      setAvailabilityData(prev => ({
        ...prev,
        [dateKey]: fallbackSlots
      }));
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // Generate available dates (5 days out, excluding Sundays)
  const generateAvailableDates = () => {
    const dates = [];
    let currentDate = addDays(new Date(), 5); // Start 5 days from now
    
    for (let i = 0; i < 30; i++) {
      if (!isSunday(currentDate)) {
        dates.push(new Date(currentDate));
      }
      currentDate = addDays(currentDate, 1);
    }
    return dates;
  };

  const availableDates = generateAvailableDates();
  const tomorrow = addDays(new Date(), 1);
  const nextDayFee = 50;

  // Check availability when date changes
  useEffect(() => {
    if (selectedDate && !nextDayUpsell) {
      checkDateAvailability(selectedDate);
    }
  }, [selectedDate, serviceType, nextDayUpsell]);

  const currentTimeSlots = selectedDate && !nextDayUpsell 
    ? availabilityData[format(selectedDate, 'yyyy-MM-dd')] || []
    : baseTimeSlots.map(slot => ({ ...slot, available: true }));

  const disabledDates = (date: Date) => {
    // Disable dates before 5 days from now
    const minDate = addDays(new Date(), 5);
    if (date < minDate) return true;
    
    // Disable Sundays
    if (isSunday(date)) return true;
    
    // Only allow dates in our available range
    return !availableDates.some(availableDate => 
      format(availableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  return (
    <div className="space-y-6">
      {/* Next Day Priority Booking */}
      <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-600" />
            <CardTitle className="text-amber-900">Priority Next-Day Service</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3">
            <Checkbox
              id="nextDayUpsell"
              checked={nextDayUpsell}
              onCheckedChange={onNextDayToggle}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="nextDayUpsell" className="text-sm font-medium text-amber-900 cursor-pointer">
                Get priority service as early as {format(tomorrow, 'EEEE, MMMM d')}
              </Label>
              <div className="mt-2 space-y-2">
                <p className="text-sm text-amber-700">
                  Skip the wait! Get your cleaning service tomorrow with our premium next-day booking.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                    +${nextDayFee} Premium Fee
                  </Badge>
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    <Zap className="h-3 w-3 mr-1" />
                    Priority Service
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Date & Time Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            {nextDayUpsell ? 'Next-Day Service Time' : 'Choose Your Date & Time'}
          </CardTitle>
          {!calendarConnected && !nextDayUpsell && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
              Calendar integration unavailable - showing estimated availability
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {!nextDayUpsell ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Calendar */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Select Date *</Label>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={onDateChange}
                  disabled={disabledDates}
                  className="rounded-md border shadow-sm p-3 pointer-events-auto"
                  classNames={{
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_disabled: "text-muted-foreground opacity-50"
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  We require at least 5 days advance notice. Sundays are not available.
                </p>
              </div>

              {/* Time Slots */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Select Time * 
                  {selectedDate && (
                    <span className="text-muted-foreground font-normal">
                      for {format(selectedDate, 'EEEE, MMMM d')}
                    </span>
                  )}
                </Label>
                
                {isCheckingAvailability ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-muted-foreground">
                      Checking availability...
                    </span>
                  </div>
                ) : selectedDate ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {currentTimeSlots.map((slot) => (
                      <Button
                        key={slot.value}
                        variant={selectedTime === slot.value ? "default" : "outline"}
                        className={cn(
                          "w-full justify-between h-auto p-3",
                          !slot.available && "opacity-50 cursor-not-allowed",
                          selectedTime === slot.value && "ring-2 ring-primary ring-offset-2"
                        )}
                        disabled={!slot.available}
                        onClick={() => slot.available && onTimeChange(slot.value)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{slot.label}</span>
                          {slot.popular && (
                            <Badge variant="secondary" className="text-xs">
                              <Star className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        {slot.available ? (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Unavailable</span>
                        )}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Please select a date first</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Next-day time selection
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Select Time for {format(tomorrow, 'EEEE, MMMM d')} *
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {baseTimeSlots.map((slot) => (
                  <Button
                    key={slot.value}
                    variant={selectedTime === slot.value ? "default" : "outline"}
                    className={cn(
                      "justify-between h-auto p-3",
                      selectedTime === slot.value && "ring-2 ring-primary ring-offset-2"
                    )}
                    onClick={() => onTimeChange(slot.value)}
                  >
                    <span className="font-medium">{slot.label}</span>
                    {slot.popular && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  <Crown className="h-4 w-4 inline mr-1" />
                  Priority next-day service with ${nextDayFee} premium fee
                </p>
              </div>
            </div>
          )}

          {/* Service Duration Info */}
          <div className="bg-muted/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">
                Estimated Duration: {getServiceDuration(serviceType)} hours
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              We'll confirm your exact appointment time within 24 hours and send you all the details.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}