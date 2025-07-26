import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, CheckCircle, X, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, startOfWeek, isSameDay, isToday, isBefore } from "date-fns";

interface SchedulingData {
  scheduledDate: string;
  scheduledTime: string;
  nextDayBooking?: boolean;
  upchargeAmount?: number;
}

interface VisualSchedulerProps {
  onSchedulingUpdate: (data: SchedulingData) => void;
  selectedDate?: string;
  selectedTime?: string;
  serviceType?: string; // Add this to determine time slots
}

interface TimeSlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  available: boolean;
}

interface DayAvailability {
  date: string;
  available: boolean;
  timeSlots: TimeSlot[];
}

export function VisualScheduler({ onSchedulingUpdate, selectedDate, selectedTime, serviceType }: VisualSchedulerProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDateState, setSelectedDateState] = useState<string>(selectedDate || "");
  const [selectedTimeState, setSelectedTimeState] = useState<string>(selectedTime || "");
  const [showNextDayOption, setShowNextDayOption] = useState(false);
  const [isNextDayBooking, setIsNextDayBooking] = useState(false);

  // Business hours time slots correlated with service duration
  const getTimeSlots = () => {
    const serviceDuration = getServiceDuration(serviceType || 'general');
    console.log('Service type:', serviceType, 'Duration:', serviceDuration);
    
    if (serviceDuration <= 1.5) {
      // Short services (1-1.5 hours): More time slot options
      return [
        { id: "8am", label: "8:00 AM - 9:30 AM", startTime: "8:00 AM", endTime: "9:30 AM", available: true },
        { id: "9am", label: "9:00 AM - 10:30 AM", startTime: "9:00 AM", endTime: "10:30 AM", available: true },
        { id: "10am", label: "10:00 AM - 11:30 AM", startTime: "10:00 AM", endTime: "11:30 AM", available: true },
        { id: "11am", label: "11:00 AM - 12:30 PM", startTime: "11:00 AM", endTime: "12:30 PM", available: true },
        { id: "12pm", label: "12:00 PM - 1:30 PM", startTime: "12:00 PM", endTime: "1:30 PM", available: true },
        { id: "1pm", label: "1:00 PM - 2:30 PM", startTime: "1:00 PM", endTime: "2:30 PM", available: true },
        { id: "2pm", label: "2:00 PM - 3:30 PM", startTime: "2:00 PM", endTime: "3:30 PM", available: true },
        { id: "3pm", label: "3:00 PM - 4:30 PM", startTime: "3:00 PM", endTime: "4:30 PM", available: true },
        { id: "4pm", label: "4:00 PM - 5:30 PM", startTime: "4:00 PM", endTime: "5:30 PM", available: true },
        { id: "430pm", label: "4:30 PM - 6:00 PM", startTime: "4:30 PM", endTime: "6:00 PM", available: true }
      ];
    } else if (serviceDuration <= 2.5) {
      // Medium services (2-2.5 hours): Moderate time slot options
      return [
        { id: "8am", label: "8:00 AM - 10:30 AM", startTime: "8:00 AM", endTime: "10:30 AM", available: true },
        { id: "9am", label: "9:00 AM - 11:30 AM", startTime: "9:00 AM", endTime: "11:30 AM", available: true },
        { id: "10am", label: "10:00 AM - 12:30 PM", startTime: "10:00 AM", endTime: "12:30 PM", available: true },
        { id: "11am", label: "11:00 AM - 1:30 PM", startTime: "11:00 AM", endTime: "1:30 PM", available: true },
        { id: "12pm", label: "12:00 PM - 2:30 PM", startTime: "12:00 PM", endTime: "2:30 PM", available: true },
        { id: "1pm", label: "1:00 PM - 3:30 PM", startTime: "1:00 PM", endTime: "3:30 PM", available: true },
        { id: "2pm", label: "2:00 PM - 4:30 PM", startTime: "2:00 PM", endTime: "4:30 PM", available: true },
        { id: "3pm", label: "3:00 PM - 5:30 PM", startTime: "3:00 PM", endTime: "5:30 PM", available: true },
        { id: "330pm", label: "3:30 PM - 6:00 PM", startTime: "3:30 PM", endTime: "6:00 PM", available: true }
      ];
    } else {
      // Long services (3+ hours): Fewer time slot options  
      return [
        { id: "8am", label: "8:00 AM - 11:30 AM", startTime: "8:00 AM", endTime: "11:30 AM", available: true },
        { id: "9am", label: "9:00 AM - 12:30 PM", startTime: "9:00 AM", endTime: "12:30 PM", available: true },
        { id: "10am", label: "10:00 AM - 1:30 PM", startTime: "10:00 AM", endTime: "1:30 PM", available: true },
        { id: "11am", label: "11:00 AM - 2:30 PM", startTime: "11:00 AM", endTime: "2:30 PM", available: true },
        { id: "12pm", label: "12:00 PM - 3:30 PM", startTime: "12:00 PM", endTime: "3:30 PM", available: true },
        { id: "1pm", label: "1:00 PM - 4:30 PM", startTime: "1:00 PM", endTime: "4:30 PM", available: true },
        { id: "2pm", label: "2:00 PM - 5:30 PM", startTime: "2:00 PM", endTime: "5:30 PM", available: true },
        { id: "3pm", label: "3:00 PM - 6:00 PM", startTime: "3:00 PM", endTime: "6:00 PM", available: true }
      ];
    }
  };

  const timeSlots: TimeSlot[] = getTimeSlots();
  const nextDayTimeSlots: TimeSlot[] = getTimeSlots();

  // Helper function to get service duration
  function getServiceDuration(serviceType: string): number {
    const type = serviceType?.toLowerCase() || '';
    if (type.includes('deep')) return 3; // 3 hours
    if (type.includes('move')) return 2; // 2 hours  
    if (type.includes('recurring')) return 1.5; // 1.5 hours
    return 1.5; // General cleaning default 1.5 hours
  }

  // Get week dates starting from Monday
  const getWeekDates = (date: Date) => {
    const startOfCurrentWeek = startOfWeek(date, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));
  };

  // Check calendar availability for the current week
  const checkWeekAvailability = async (weekStart: Date) => {
    setIsLoading(true);
    try {
      const weekDates = getWeekDates(weekStart);
      const availabilityPromises = weekDates.map(async (date) => {
        // Skip dates in the past
        if (isBefore(date, new Date()) && !isToday(date)) {
          return {
            date: format(date, 'yyyy-MM-dd'),
            available: false,
            timeSlots: timeSlots.map(slot => ({ ...slot, available: false }))
          };
        }

        // For regular booking, all slots are available (multiple customers can book same slot)
        // For next day priority booking, use actual availability checking
        const regularSlots = timeSlots.map(slot => ({
          ...slot,
          available: true // Always available for regular bookings
        }));
        
        return {
          date: format(date, 'yyyy-MM-dd'),
          available: true, // All days available for regular booking
          timeSlots: regularSlots
        };
      });

      const weekAvailability = await Promise.all(availabilityPromises);
      setAvailability(weekAvailability);
    } catch (error) {
      console.error('Error checking week availability:', error);
      toast.error("Unable to check availability. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle date selection
  const handleDateSelect = (date: string) => {
    setSelectedDateState(date);
    setSelectedTimeState(""); // Reset time when date changes
    setIsNextDayBooking(false); // Reset next day booking
    onSchedulingUpdate({ scheduledDate: date, scheduledTime: "" });
  };

  // Handle next day booking selection
  const handleNextDaySelect = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    setSelectedDateState(tomorrowStr);
    setSelectedTimeState("");
    setIsNextDayBooking(true);
    onSchedulingUpdate({ 
      scheduledDate: tomorrowStr, 
      scheduledTime: "",
      nextDayBooking: true,
      upchargeAmount: 50
    });
  };

  // Handle canceling next day booking
  const handleCancelNextDay = () => {
    setSelectedDateState("");
    setSelectedTimeState("");
    setIsNextDayBooking(false);
    onSchedulingUpdate({ 
      scheduledDate: "", 
      scheduledTime: ""
    });
    toast.success("Next day booking cancelled. Please select a date from the calendar.");
  };

  // Handle time selection
  const handleTimeSelect = (timeSlot: TimeSlot) => {
    if (!selectedDateState) {
      toast.error("Please select a date first");
      return;
    }

    if (!timeSlot.available) {
      toast.error("This time slot is not available");
      return;
    }

    const timeLabel = `${timeSlot.label} (${timeSlot.startTime}-${timeSlot.endTime})`;
    setSelectedTimeState(timeLabel);
    
    const updateData: any = { 
      scheduledDate: selectedDateState, 
      scheduledTime: timeLabel 
    };
    
    if (isNextDayBooking) {
      updateData.nextDayBooking = true;
      updateData.upchargeAmount = 50;
    }
    
    onSchedulingUpdate(updateData);
    toast.success("Time slot selected successfully!");
  };

  // Navigate weeks
  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = addDays(currentWeek, direction === 'next' ? 7 : -7);
    setCurrentWeek(newWeek);
  };

  // Get availability for a specific date
  const getDayAvailability = (date: string) => {
    return availability.find(day => day.date === date);
  };

  // Initialize with current week and check if today is past business hours
  useEffect(() => {
    checkWeekAvailability(currentWeek);
    
    // Always show next day option
    setShowNextDayOption(true);
  }, [currentWeek]);

  // Update availability when service type changes (time slots change based on duration)
  useEffect(() => {
    if (serviceType) {
      console.log('Service type changed, updating availability:', serviceType);
      checkWeekAvailability(currentWeek);
      // Reset selected time when service type changes
      setSelectedTimeState("");
      if (selectedDateState) {
        onSchedulingUpdate({ scheduledDate: selectedDateState, scheduledTime: "" });
      }
    }
  }, [serviceType]);

  const weekDates = getWeekDates(currentWeek);

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Your Service
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Select your preferred date and time slot. Business hours: 8 AM - 6 PM
        </CardDescription>
        <div className="text-xs text-primary-foreground/60 mt-1">
          ✓ Multiple customers can book the same time slot • Service duration: {getServiceDuration(serviceType || 'general')}h
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Week Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('prev')}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="text-lg font-semibold">
            {format(weekDates[0], 'MMM d')} - {format(weekDates[6], 'MMM d, yyyy')}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeek('next')}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Next Day Priority Booking Option */}
        {showNextDayOption && (
          <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="font-semibold text-orange-800">Need Service Tomorrow?</h4>
                <p className="text-sm text-orange-600">Priority next-day booking available (+$50)</p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={isNextDayBooking ? "default" : "outline"}
                  onClick={handleNextDaySelect}
                  className={isNextDayBooking ? "bg-orange-500 hover:bg-orange-600" : "border-orange-300 text-orange-700 hover:bg-orange-50"}
                >
                  {isNextDayBooking ? "Selected" : "Book Tomorrow"}
                </Button>
                {isNextDayBooking && (
                  <Button
                    variant="outline"
                    onClick={handleCancelNextDay}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Calendar Grid - Only show if not next day booking */}
        {!isNextDayBooking && (
          <div className="space-y-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Date Buttons */}
            <div className="grid grid-cols-7 gap-2">
              {weekDates.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayAvailability = getDayAvailability(dateStr);
                const isPast = isBefore(date, new Date()) && !isToday(date);
                const isSelected = selectedDateState === dateStr;
                const hasAvailability = dayAvailability?.available;

                return (
                  <Button
                    key={dateStr}
                    variant={isSelected ? "default" : "outline"}
                    className={`
                      h-16 flex flex-col items-center justify-center relative
                      ${isPast ? 'opacity-50 cursor-not-allowed' : ''}
                      ${!hasAvailability && !isPast ? 'bg-red-50 border-red-200 text-red-600' : ''}
                      ${hasAvailability && !isPast && !isSelected ? 'hover:bg-green-50 border-green-200' : ''}
                    `}
                    onClick={() => !isPast && handleDateSelect(dateStr)}
                    disabled={isPast || isLoading}
                  >
                    <span className="text-lg font-semibold">{format(date, 'd')}</span>
                    <span className="text-xs">
                      {isToday(date) ? 'Today' : format(date, 'EEE')}
                    </span>
                    
                    {/* Availability indicator */}
                    {!isPast && (
                      <div className="absolute bottom-1 right-1">
                        {isLoading ? (
                          <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse" />
                        ) : hasAvailability ? (
                          <div className="w-2 h-2 bg-green-500 rounded-full" />
                        ) : (
                          <div className="w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </div>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Time Slot Selection */}
        {selectedDateState && (
          <div className="space-y-4">
              <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">
                  {isNextDayBooking 
                    ? "Select Time for Tomorrow's Priority Service" 
                    : `Available Time Slots for ${format(new Date(selectedDateState), 'EEEE, MMMM d')}`
                  }
                </span>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(isNextDayBooking ? nextDayTimeSlots : getDayAvailability(selectedDateState)?.timeSlots || []).map(slot => {
                    const isSelected = selectedTimeState.includes(slot.label);
                    return (
                      <Button
                        key={slot.id}
                        variant={isSelected ? "default" : "outline"}
                        className={`
                          h-16 flex flex-col items-center justify-center
                          ${!slot.available ? 'opacity-50 cursor-not-allowed bg-red-50 border-red-200' : ''}
                          ${slot.available && !isSelected ? 'hover:bg-green-50 border-green-200' : ''}
                        `}
                        onClick={() => handleTimeSelect(slot)}
                        disabled={!slot.available}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{slot.label}</span>
                          {slot.available ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <X className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Selection Summary */}
        {selectedDateState && selectedTimeState && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg">
            <h5 className="font-semibold text-green-800 mb-2">📅 Booking Summary</h5>
            <div className="space-y-1 text-sm text-green-700">
              <p><strong>Date:</strong> {isNextDayBooking ? 'Tomorrow' : format(new Date(selectedDateState), 'EEEE, MMMM d, yyyy')}</p>
              <p><strong>Time:</strong> {selectedTimeState}</p>
              {isNextDayBooking && <p><strong>Priority Fee:</strong> +$50.00</p>}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full" />
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full" />
            <span>Past Date</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}