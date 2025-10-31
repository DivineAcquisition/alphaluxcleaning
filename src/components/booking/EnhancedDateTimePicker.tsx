import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { addDays, format, startOfWeek, isSameDay, isAfter, isBefore } from 'date-fns';

interface TimeSlot {
  id: string;
  time_slot: string;
  available_slots: number;
  booked_slots: number;
}

interface EnhancedDateTimePickerProps {
  selectedDate?: Date;
  selectedTime?: string;
  timeSlots: TimeSlot[];
  isLoadingSlots: boolean;
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function EnhancedDateTimePicker({
  selectedDate,
  selectedTime,
  timeSlots,
  isLoadingSlots,
  onDateSelect,
  onTimeSelect,
  minDate = new Date(),
  maxDate = addDays(new Date(), 30)
}: EnhancedDateTimePickerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const goToPreviousWeek = () => {
    const newWeekStart = addDays(currentWeekStart, -7);
    if (!isBefore(newWeekStart, minDate)) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const goToNextWeek = () => {
    const newWeekStart = addDays(currentWeekStart, 7);
    if (!isAfter(newWeekStart, maxDate)) {
      setCurrentWeekStart(newWeekStart);
    }
  };

  const isDateDisabled = (date: Date) => {
    return isBefore(date, minDate) || isAfter(date, maxDate) || date.getDay() === 0; // Disable Sundays
  };

  const isDateSelected = (date: Date) => {
    return selectedDate && isSameDay(date, selectedDate);
  };

  return (
    <div className="space-y-6">
      {/* Date Selection */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Select Date</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPreviousWeek}
              disabled={isBefore(addDays(currentWeekStart, -7), minDate)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextWeek}
              disabled={isAfter(addDays(currentWeekStart, 7), maxDate)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date) => {
            const disabled = isDateDisabled(date);
            const selected = isDateSelected(date);
            const isSunday = date.getDay() === 0;

            return (
              <button
                key={date.toISOString()}
                onClick={() => !disabled && onDateSelect(date)}
                disabled={disabled}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-lg transition-all",
                  "hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary",
                  disabled && "opacity-40 cursor-not-allowed hover:bg-transparent",
                  selected && "bg-primary text-primary-foreground hover:bg-primary/90",
                  !selected && !disabled && "bg-secondary"
                )}
              >
                <span className="text-xs font-medium mb-1">
                  {format(date, 'EEE')}
                </span>
                <span className={cn(
                  "text-lg font-semibold",
                  isSunday && !selected && "text-muted-foreground"
                )}>
                  {format(date, 'd')}
                </span>
                {isSunday && (
                  <span className="text-[10px] mt-1 text-muted-foreground">Closed</span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Time Selection */}
      {selectedDate && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Select Time</h3>
          </div>

          {isLoadingSlots ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No slots available</p>
              <p className="text-sm mt-1">Please try another date</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {timeSlots.map((slot) => {
                const available = slot.available_slots - slot.booked_slots;
                const isSelected = selectedTime === slot.time_slot;
                const isLowAvailability = available <= 3 && available > 0;

                return (
                  <button
                    key={slot.id}
                    onClick={() => onTimeSelect(slot.time_slot)}
                    disabled={available < 1}
                    className={cn(
                      "relative flex flex-col items-center justify-center p-4 rounded-lg transition-all",
                      "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary",
                      available < 1 && "opacity-40 cursor-not-allowed hover:scale-100",
                      isSelected && "bg-primary text-primary-foreground shadow-lg scale-105",
                      !isSelected && available > 0 && "bg-secondary hover:bg-accent",
                      isLowAvailability && !isSelected && "border-2 border-warning"
                    )}
                  >
                    <span className="font-semibold text-base">
                      {slot.time_slot}
                    </span>
                    {isLowAvailability && (
                      <Badge 
                        variant="secondary" 
                        className="mt-2 text-[10px] px-2 py-0 bg-warning text-warning-foreground"
                      >
                        {available} left
                      </Badge>
                    )}
                    {available < 1 && (
                      <span className="text-xs mt-2 text-muted-foreground">
                        Fully booked
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
