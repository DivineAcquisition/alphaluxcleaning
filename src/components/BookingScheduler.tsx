import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, CheckCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SchedulingData {
  scheduledDate: string;
  scheduledTime: string;
  nextDayBooking: boolean;
  upchargeAmount: number;
  bookingType: 'regular' | 'priority';
}

interface BookingSchedulerProps {
  onSchedulingUpdate: (data: SchedulingData) => void;
}

interface AvailabilitySlot {
  date: string;
  time: string;
  available: boolean;
}

export function BookingScheduler({ onSchedulingUpdate }: BookingSchedulerProps) {
  const [schedulingData, setSchedulingData] = useState<SchedulingData>({
    scheduledDate: "",
    scheduledTime: "",
    nextDayBooking: false,
    upchargeAmount: 0,
    bookingType: 'regular'
  });
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  // Business hours time slots (allowing multiple bookings per slot)
  const timeSlots = [
    "8:00 AM - 9:00 AM",
    "9:00 AM - 10:00 AM",
    "10:00 AM - 11:00 AM",
    "11:00 AM - 12:00 PM",
    "12:00 PM - 1:00 PM",
    "1:00 PM - 2:00 PM",
    "2:00 PM - 3:00 PM",
    "3:00 PM - 4:00 PM",
    "4:00 PM - 5:00 PM",
    "5:00 PM - 6:00 PM"
  ];

  // Get next available dates (next 7 days, excluding Sundays)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) { // Look ahead 14 days
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip Sundays (0 = Sunday)
      if (date.getDay() !== 0) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: date.toLocaleDateString('en-US', { 
            weekday: 'long', 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
      
      if (dates.length >= 7) break; // Only show 7 available dates
    }
    
    return dates;
  };

  // Get tomorrow's date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Check calendar availability for priority bookings only
  const checkAvailability = async (date: string) => {
    if (!date) return;
    
    setIsCheckingAvailability(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-calendar-availability', {
        body: { date, timeSlots }
      });

      if (error) throw error;
      setAvailability(data.availability || []);
    } catch (error) {
      console.error('Error checking availability:', error);
      toast.error("Unable to check calendar availability. Please try again.");
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  // For regular scheduling, all time slots are available (multiple customers can book same slot)
  const getTimeSlotAvailability = (timeSlot: string) => {
    // For regular scheduling, always return true (allow multiple bookings)
    if (!schedulingData.nextDayBooking) {
      return true;
    }
    
    // For next day priority booking, check actual availability
    const slot = availability.find(a => a.time === timeSlot);
    return slot ? slot.available : true;
  };

  // Handle regular date selection
  const handleDateSelection = (date: string) => {
    const newSchedulingData = {
      ...schedulingData,
      scheduledDate: date,
      bookingType: 'regular' as const,
      nextDayBooking: false,
      upchargeAmount: 0
    };
    
    console.log('Regular date selected:', date);
    setSchedulingData(newSchedulingData);
    onSchedulingUpdate(newSchedulingData);
  };

  // Handle next day booking toggle
  const handleNextDayBooking = (enabled: boolean) => {
    console.log('Next day booking toggled:', enabled);
    const tomorrowDate = getTomorrowDate();
    const newSchedulingData = {
      ...schedulingData,
      nextDayBooking: enabled,
      scheduledDate: enabled ? tomorrowDate : "",
      scheduledTime: enabled ? schedulingData.scheduledTime : "",
      upchargeAmount: enabled ? 50 : 0,
      bookingType: enabled ? 'priority' as const : 'regular' as const
    };
    
    console.log('New scheduling data:', newSchedulingData);
    setSchedulingData(newSchedulingData);
    onSchedulingUpdate(newSchedulingData);

    if (enabled) {
      console.log('Checking availability for date:', tomorrowDate);
      checkAvailability(tomorrowDate);
    }
  };

  // Handle time selection
  const handleTimeSelection = (time: string) => {
    const newSchedulingData = {
      ...schedulingData,
      scheduledTime: time
    };
    
    setSchedulingData(newSchedulingData);
    onSchedulingUpdate(newSchedulingData);
  };

  // Check availability when component mounts if next day booking is enabled
  useEffect(() => {
    if (schedulingData.nextDayBooking && schedulingData.scheduledDate) {
      checkAvailability(schedulingData.scheduledDate);
    }
  }, []);

  const availableDates = getAvailableDates();

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Your Service
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Choose your preferred date and time within business hours (8 AM - 6 PM)
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {/* Regular Scheduling Section */}
        <div className="space-y-4">
          <div className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">📅 Regular Scheduling</h4>
            <p className="text-sm text-blue-600 mb-3">
              Book your cleaning service for any available date within business hours.
            </p>
            
            {/* Date Selection */}
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Select 
                value={schedulingData.nextDayBooking ? "" : schedulingData.scheduledDate} 
                onValueChange={handleDateSelection}
                disabled={schedulingData.nextDayBooking}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose your preferred date" />
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
          </div>
        </div>

        {/* Priority Next Day Booking Option */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
            <div className="flex-1">
              <h4 className="font-semibold text-orange-800">⚡ Next Day Priority Booking</h4>
              <p className="text-sm text-orange-600 mt-1">
                Get your home cleaned tomorrow! Perfect for urgent cleaning needs.
              </p>
              <p className="text-sm font-medium text-orange-700 mt-2">
                Additional $50.00 upcharge applies
              </p>
            </div>
            <Button
              variant={schedulingData.nextDayBooking ? "default" : "outline"}
              onClick={() => handleNextDayBooking(!schedulingData.nextDayBooking)}
              className="ml-4"
            >
              {schedulingData.nextDayBooking ? "Selected" : "Select"}
            </Button>
          </div>
        </div>

        {/* Time Selection - Always show when date is selected */}
        {(schedulingData.scheduledDate || schedulingData.nextDayBooking) && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select Time Slot *
                {isCheckingAvailability && schedulingData.nextDayBooking && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    <Clock className="inline h-3 w-3 animate-spin mr-1" />
                    Checking availability...
                  </span>
                )}
              </Label>
              <Select 
                value={schedulingData.scheduledTime} 
                onValueChange={handleTimeSelection}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose your time slot" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {timeSlots.map(slot => {
                    const isAvailable = getTimeSlotAvailability(slot);
                    return (
                      <SelectItem key={slot} value={slot} disabled={schedulingData.nextDayBooking && !isAvailable}>
                        <div className="flex items-center justify-between w-full">
                          <span className={schedulingData.nextDayBooking && !isAvailable ? 'text-muted-foreground' : ''}>{slot}</span>
                          <span className="ml-2">
                            {!schedulingData.nextDayBooking ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : isAvailable ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {!schedulingData.nextDayBooking && (
                <p className="text-xs text-muted-foreground mt-1">
                  ✓ Multiple customers can book the same time slot
                </p>
              )}
            </div>

            {/* Booking Summary */}
            {schedulingData.scheduledTime && schedulingData.scheduledDate && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                <h5 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  📅 Booking Summary
                </h5>
                <div className="space-y-1 text-sm text-green-700">
                  <p><strong>Date:</strong> {schedulingData.nextDayBooking ? `Tomorrow (${new Date(getTomorrowDate()).toLocaleDateString()})` : new Date(schedulingData.scheduledDate).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {schedulingData.scheduledTime}</p>
                  <p><strong>Type:</strong> {schedulingData.nextDayBooking ? 'Priority Booking' : 'Regular Booking'}</p>
                  {schedulingData.nextDayBooking && <p><strong>Priority Upcharge:</strong> $50.00</p>}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  <span>✓ Scheduling completed successfully</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Helper Message */}
        {!schedulingData.scheduledDate && !schedulingData.nextDayBooking && (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Choose a date to schedule your cleaning service</p>
            <p className="text-sm mt-1">Business hours: 8 AM - 6 PM (Monday - Saturday)</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}