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
}

interface VisualSchedulerProps {
  onSchedulingUpdate: (data: SchedulingData) => void;
  selectedDate?: string;
  selectedTime?: string;
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

export function VisualScheduler({ onSchedulingUpdate, selectedDate, selectedTime }: VisualSchedulerProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [availability, setAvailability] = useState<DayAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDateState, setSelectedDateState] = useState<string>(selectedDate || "");
  const [selectedTimeState, setSelectedTimeState] = useState<string>(selectedTime || "");

  const timeSlots: TimeSlot[] = [
    { id: "early", label: "Early Morning", startTime: "06:00", endTime: "09:00", available: true },
    { id: "morning", label: "Morning", startTime: "09:00", endTime: "12:00", available: true },
    { id: "afternoon", label: "Afternoon", startTime: "12:00", endTime: "17:00", available: true },
    { id: "evening", label: "Evening", startTime: "17:00", endTime: "20:00", available: true },
    { id: "late", label: "After Hours", startTime: "20:00", endTime: "23:00", available: true }
  ];

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

        try {
          const { data, error } = await supabase.functions.invoke('check-calendar-availability', {
            body: { 
              date: format(date, 'yyyy-MM-dd'),
              timeSlots: timeSlots.map(slot => `${slot.label} (${slot.startTime}-${slot.endTime})`)
            }
          });

          if (error) throw error;

          const daySlots = timeSlots.map(slot => {
            const availabilitySlot = data.availability?.find((a: any) => 
              a.time.includes(slot.label)
            );
            return {
              ...slot,
              available: availabilitySlot ? availabilitySlot.available : true
            };
          });

          return {
            date: format(date, 'yyyy-MM-dd'),
            available: daySlots.some(slot => slot.available),
            timeSlots: daySlots
          };
        } catch (error) {
          console.error(`Error checking availability for ${format(date, 'yyyy-MM-dd')}:`, error);
          return {
            date: format(date, 'yyyy-MM-dd'),
            available: true,
            timeSlots: timeSlots.map(slot => ({ ...slot, available: true }))
          };
        }
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
    onSchedulingUpdate({ scheduledDate: date, scheduledTime: "" });
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
    onSchedulingUpdate({ scheduledDate: selectedDateState, scheduledTime: timeLabel });
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

  // Initialize with current week
  useEffect(() => {
    checkWeekAvailability(currentWeek);
  }, [currentWeek]);

  const weekDates = getWeekDates(currentWeek);

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Schedule Your Service
        </CardTitle>
        <CardDescription className="text-primary-foreground/80">
          Select your preferred date and time slot
        </CardDescription>
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

        {/* Calendar Grid */}
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

        {/* Time Slot Selection */}
        {selectedDateState && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="font-medium">
                  Available Time Slots for {format(new Date(selectedDateState), 'EEEE, MMMM d')}
                </span>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {getDayAvailability(selectedDateState)?.timeSlots.map(slot => {
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
              <p><strong>Date:</strong> {format(new Date(selectedDateState), 'EEEE, MMMM d, yyyy')}</p>
              <p><strong>Time:</strong> {selectedTimeState}</p>
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