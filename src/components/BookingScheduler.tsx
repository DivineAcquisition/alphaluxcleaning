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
    upchargeAmount: 0
  });
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);

  const timeSlots = [
    "Early Morning (6-9 AM)",
    "Morning (9 AM-12 PM)",
    "Afternoon (12-5 PM)", 
    "Evening (5-8 PM)",
    "After Hours (8 PM+)"
  ];

  // Get tomorrow's date
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  // Check calendar availability
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

  // Get availability status for a time slot
  const getTimeSlotAvailability = (timeSlot: string) => {
    const slot = availability.find(a => a.time === timeSlot);
    return slot ? slot.available : true;
  };

  // Handle next day booking toggle
  const handleNextDayBooking = (enabled: boolean) => {
    const tomorrowDate = getTomorrowDate();
    const newSchedulingData = {
      ...schedulingData,
      nextDayBooking: enabled,
      scheduledDate: enabled ? tomorrowDate : "",
      scheduledTime: enabled ? schedulingData.scheduledTime : "",
      upchargeAmount: enabled ? 50 : 0
    };
    
    setSchedulingData(newSchedulingData);
    onSchedulingUpdate(newSchedulingData);

    if (enabled) {
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

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Your Service
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Book your cleaning service for tomorrow with priority scheduling
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Next Day Booking Option */}
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

        {/* Time Selection - Only show when next day booking is selected */}
        {schedulingData.nextDayBooking && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Select Time Slot *
                {isCheckingAvailability && (
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
                  <SelectValue placeholder="Choose your preferred time slot" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  {timeSlots.map(slot => {
                    const isAvailable = getTimeSlotAvailability(slot);
                    return (
                      <SelectItem key={slot} value={slot} disabled={!isAvailable}>
                        <div className="flex items-center justify-between w-full">
                          <span className={!isAvailable ? 'text-muted-foreground' : ''}>{slot}</span>
                          <span className="ml-2">
                            {isAvailable ? (
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
            </div>

            {/* Availability Display */}
            {availability.length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <h5 className="text-sm font-medium mb-2">Tomorrow's Available Time Slots</h5>
                <div className="grid grid-cols-1 gap-2">
                  {timeSlots.map(slot => {
                    const isAvailable = getTimeSlotAvailability(slot);
                    return (
                      <div key={slot} className="flex items-center justify-between text-sm">
                        <span className={!isAvailable ? 'text-muted-foreground' : ''}>{slot}</span>
                        <span className="flex items-center gap-1">
                          {isAvailable ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-green-600">Available</span>
                            </>
                          ) : (
                            <>
                              <X className="h-4 w-4 text-red-500" />
                              <span className="text-red-600">Unavailable</span>
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Booking Summary */}
            {schedulingData.scheduledTime && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
                <h5 className="font-semibold text-green-800 mb-2">📅 Booking Confirmed</h5>
                <div className="space-y-1 text-sm text-green-700">
                  <p><strong>Date:</strong> Tomorrow ({new Date(getTomorrowDate()).toLocaleDateString()})</p>
                  <p><strong>Time:</strong> {schedulingData.scheduledTime}</p>
                  <p><strong>Priority Upcharge:</strong> $50.00</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Regular Booking Note */}
        {!schedulingData.nextDayBooking && (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select next day priority booking to schedule your service</p>
            <p className="text-sm mt-1">Regular scheduling coming soon</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}