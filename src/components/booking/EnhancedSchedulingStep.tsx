import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Crown,
  ArrowRight
} from 'lucide-react';
import { format, addDays, isSunday, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';

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

  // Generate weeks for the weekly grid view - STABLE VERSION
  const generateWeeksData = React.useMemo(() => {
    const weeks = [];
    const today = new Date();
    const startDate = addDays(today, 5); // Start 5 days from now
    
    console.log('Date Debug Info:', {
      today: format(today, 'yyyy-MM-dd'),
      startDate: format(startDate, 'yyyy-MM-dd'),
      selectedDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null
    });
    
    for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
      const weekStart = addDays(startDate, weekIndex * 7);
      const weekStartMonday = startOfWeek(weekStart, { weekStartsOn: 1 }); // Start on Monday
      const weekEnd = endOfWeek(weekStartMonday, { weekStartsOn: 1 });
      
      const weekDays = eachDayOfInterval({ start: weekStartMonday, end: weekEnd })
        .filter(day => !isSunday(day)) // Exclude Sundays
        .filter(day => day >= startDate) // Only include dates from 5 days out
        .map(day => {
          // Normalize date to avoid timezone issues
          const normalizedDate = new Date(day.getFullYear(), day.getMonth(), day.getDate());
          // Use stable availability based on day of month to avoid shifting
          const dayOfMonth = normalizedDate.getDate();
          const isWeekend = normalizedDate.getDay() === 6;
          return {
            date: normalizedDate,
            available: !isWeekend && (dayOfMonth % 7 !== 0), // Stable availability pattern
            slotsCount: Math.max(3, 8 - (dayOfMonth % 6)) // Stable slot count 3-8
          };
        });

      if (weekDays.length > 0) {
        weeks.push({
          weekStart: weekStartMonday,
          weekEnd,
          days: weekDays
        });
      }
    }
    
    return weeks;
  }, []); // Empty dependency array - generate once

  const availableDates = React.useMemo(() => generateAvailableDates(), []);
  const weeksData = generateWeeksData;
  const tomorrow = addDays(new Date(), 1);
  const nextDayFee = 50;

  // All time slots are available (no calendar integration)
  const currentTimeSlots = baseTimeSlots.map(slot => ({ ...slot, available: true }));

  const quickSelectOptions = [
    { label: 'This Week', action: () => {
      const thisWeekStart = addDays(new Date(), 5);
      const firstAvailableThisWeek = weeksData[0]?.days.find(day => day.available);
      if (firstAvailableThisWeek) {
        onDateChange(firstAvailableThisWeek.date);
      }
    }},
    { label: 'Next Week', action: () => {
      const nextWeekData = weeksData[1];
      if (nextWeekData) {
        const firstAvailableNextWeek = nextWeekData.days.find(day => day.available);
        if (firstAvailableNextWeek) {
          onDateChange(firstAvailableNextWeek.date);
        }
      }
    }}
  ];

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
        </CardHeader>
        <CardContent className="space-y-6">
          {!nextDayUpsell ? (
            <div className="space-y-6">
              {/* Quick Select Options */}
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {quickSelectOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={option.action}
                    className="text-xs sm:text-sm flex-1 sm:flex-none min-h-[40px] sm:min-h-auto"
                  >
                    {option.label}
                    <ArrowRight className="h-3 w-3 ml-1 sm:ml-2" />
                  </Button>
                ))}
              </div>

              {/* Weekly Availability Grid */}
              <div>
                <Label className="text-sm sm:text-base font-medium mb-3 block">Select Date *</Label>
                <div className="space-y-4 sm:space-y-6">
                  {weeksData.map((week, weekIndex) => (
                    <div key={weekIndex} className="space-y-3">
                      <div className="text-xs sm:text-sm font-medium text-muted-foreground px-1">
                        Week of {format(week.weekStart, 'MMM d')} - {format(week.weekEnd, 'MMM d')}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
                        {week.days.map((day, dayIndex) => (
                          <Card
                            key={dayIndex}
                            className={cn(
                              "cursor-pointer border-2 transition-colors duration-200 hover:shadow-sm p-0",
                              selectedDate && isSameDay(selectedDate, day.date)
                                ? "border-primary bg-primary/10 shadow-sm"
                                : day.available
                                  ? "border-border hover:border-primary/50 hover:bg-primary/5"
                                  : "border-muted bg-muted/30 cursor-not-allowed opacity-60"
                            )}
                            onClick={() => {
                              if (day.available) {
                                console.log('📅 Date selected:', {
                                  clickedDate: format(day.date, 'yyyy-MM-dd'),
                                  displayedDate: format(day.date, 'd'),
                                  dayOfWeek: format(day.date, 'EEE')
                                });
                                onDateChange(day.date);
                              }
                            }}
                          >
                            <CardContent className="p-3 sm:p-4 text-center min-h-[80px] sm:min-h-[90px] flex flex-col justify-center">
                              <div className="space-y-1 sm:space-y-2">
                                <div className="text-xs sm:text-sm font-medium text-muted-foreground">
                                  {format(day.date, 'EEE')}
                                </div>
                                <div className={cn(
                                  "text-xl sm:text-2xl font-bold",
                                  selectedDate && isSameDay(selectedDate, day.date)
                                    ? "text-primary"
                                    : day.available ? "text-foreground" : "text-muted-foreground"
                                )}>
                                  {format(day.date, 'd')}
                                </div>
                                <div className="text-xs">
                                  {day.available ? (
                                    <Badge variant="secondary" className="text-xs px-2 py-1">
                                      {day.slotsCount} slots
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground font-medium">Busy</span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mt-4 px-2 sm:px-0 text-center sm:text-left">
                  We require at least 5 days advance notice. Sundays are not available.
                </p>
              </div>

              {/* Time Slots */}
                {selectedDate && (
                <div className="space-y-4">
                  <Separator />
                  <div>
                    <Label className="text-sm sm:text-base font-medium mb-4 block">
                      Select Time for {format(selectedDate, 'EEEE, MMMM d')} *
                    </Label>
                    <div className="grid grid-cols-1 gap-3">
                      {currentTimeSlots.map((slot) => (
                        <Button
                          key={slot.value}
                          variant={selectedTime === slot.value ? "default" : "outline"}
                          className={cn(
                            "justify-between h-auto p-4 sm:p-3 min-h-[60px] sm:min-h-[50px] text-left",
                            !slot.available && "opacity-50 cursor-not-allowed",
                            selectedTime === slot.value && "ring-2 ring-primary ring-offset-2",
                            "transition-colors duration-200"
                          )}
                          disabled={!slot.available}
                          onClick={() => slot.available && onTimeChange(slot.value)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex flex-col items-start">
                              <span className="font-semibold text-sm sm:text-base">{slot.label}</span>
                              {slot.popular && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  <Star className="h-3 w-3 mr-1" />
                                  Popular Choice
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {slot.available ? (
                              <CheckCircle2 className="h-5 w-5 sm:h-4 sm:w-4 text-green-600" />
                            ) : (
                              <span className="text-xs text-muted-foreground">Full</span>
                            )}
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
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