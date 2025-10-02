import { format, addDays, startOfDay, isSameDay } from 'date-fns';
import { Calendar, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WeeklyDateGridProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
}

export function WeeklyDateGrid({ selectedDate, onSelectDate }: WeeklyDateGridProps) {
  // Generate 4 weeks of dates starting 5 days from today, excluding Sundays
  const generateAvailableDates = () => {
    const dates = [];
    const startDate = addDays(new Date(), 5);
    let currentDate = startOfDay(startDate);
    
    while (dates.length < 24) {
      // Skip Sundays (0 = Sunday)
      if (currentDate.getDay() !== 0) {
        dates.push(currentDate);
      }
      currentDate = addDays(currentDate, 1);
    }
    
    return dates;
  };

  const availableDates = generateAvailableDates();

  // Generate random slot counts for visual variety (3-8 slots)
  const getAvailableSlots = (date: Date) => {
    const seed = date.getDate() + date.getMonth();
    return Math.floor((seed % 6) + 3);
  };

  // Quick select functions
  const selectThisWeek = () => {
    const thisWeekDates = availableDates.slice(0, 6);
    if (thisWeekDates.length > 0) {
      onSelectDate(thisWeekDates[0]);
    }
  };

  const selectNextWeek = () => {
    const nextWeekDates = availableDates.slice(6, 12);
    if (nextWeekDates.length > 0) {
      onSelectDate(nextWeekDates[0]);
    }
  };

  const selectWeekend = () => {
    const weekend = availableDates.find(date => date.getDay() === 6); // Saturday
    if (weekend) {
      onSelectDate(weekend);
    }
  };

  // Group dates by week
  const weeks: Date[][] = [];
  for (let i = 0; i < availableDates.length; i += 6) {
    weeks.push(availableDates.slice(i, i + 6));
  }

  return (
    <div className="space-y-6 w-full">
      {/* Quick Select Bar */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={selectThisWeek}
          className="text-sm"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          This Week
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={selectNextWeek}
          className="text-sm"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Next Week
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={selectWeekend}
          className="text-sm"
        >
          Weekends Only
        </Button>
      </div>

      {/* Info Message */}
      <div className="text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          We require 5 days advance notice • No Sunday service
        </p>
      </div>

      {/* Weekly Grid */}
      <div className="space-y-8">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex}>
            {/* Week Header */}
            <div className="text-sm font-medium text-muted-foreground mb-3">
              Week of {format(week[0], 'MMM d')} - {format(week[week.length - 1], 'MMM d')}
            </div>

            {/* Date Cards Grid */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {week.map((date) => {
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                const availableSlots = getAvailableSlots(date);

                return (
                  <Card
                    key={date.toISOString()}
                    className={cn(
                      "relative p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
                      isSelected 
                        ? "ring-2 ring-primary bg-primary/5 shadow-lg" 
                        : "hover:bg-accent/50"
                    )}
                    onClick={() => onSelectDate(date)}
                  >
                    {/* Selected Checkmark */}
                    {isSelected && (
                      <div className="absolute -top-2 -right-2">
                        <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center">
                          <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"></path>
                          </svg>
                        </div>
                      </div>
                    )}

                    <div className="text-center space-y-1">
                      {/* Day of Week */}
                      <div className="text-xs font-medium text-muted-foreground uppercase">
                        {format(date, 'EEE')}
                      </div>

                      {/* Date Number */}
                      <div className={cn(
                        "text-2xl font-bold",
                        isSelected ? "text-primary" : ""
                      )}>
                        {format(date, 'd')}
                      </div>

                      {/* Available Slots Badge */}
                      <div className={cn(
                        "text-xs px-2 py-0.5 rounded-full inline-block",
                        isSelected 
                          ? "bg-primary/20 text-primary" 
                          : "bg-accent text-accent-foreground"
                      )}>
                        {availableSlots} slots
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
