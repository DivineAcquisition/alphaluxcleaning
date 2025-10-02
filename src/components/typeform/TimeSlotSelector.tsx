import { Clock, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

interface TimeSlotSelectorProps {
  selectedTime: string;
  onSelectTime: (time: string) => void;
}

const TIME_SLOTS = [
  { time: '8:00 AM', range: '8:00 AM - 10:00 AM', popular: false },
  { time: '10:00 AM', range: '10:00 AM - 12:00 PM', popular: true },
  { time: '12:00 PM', range: '12:00 PM - 2:00 PM', popular: true },
  { time: '2:00 PM', range: '2:00 PM - 4:00 PM', popular: true },
  { time: '4:00 PM', range: '4:00 PM - 6:00 PM', popular: false },
  { time: '6:00 PM', range: '6:00 PM - 8:00 PM', popular: false },
];

export function TimeSlotSelector({ selectedTime, onSelectTime }: TimeSlotSelectorProps) {
  return (
    <div className="space-y-4 w-full animate-fade-in">
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Select your preferred time slot
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedTime === slot.time;

          return (
            <Card
              key={slot.time}
              className={cn(
                "relative p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
                isSelected 
                  ? "ring-2 ring-primary bg-primary/5 shadow-lg" 
                  : "hover:bg-accent/50"
              )}
              onClick={() => onSelectTime(slot.time)}
            >
              {/* Popular Badge */}
              {slot.popular && !isSelected && (
                <div className="absolute -top-2 -right-2">
                  <div className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" />
                    Popular
                  </div>
                </div>
              )}

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

              <div className="flex items-center gap-3">
                {/* Clock Icon */}
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center",
                  isSelected ? "bg-primary/20" : "bg-accent"
                )}>
                  <Clock className={cn(
                    "w-5 h-5",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>

                {/* Time Info */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-lg font-semibold",
                    isSelected ? "text-primary" : ""
                  )}>
                    {slot.time}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {slot.range}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Service Duration Info */}
      <div className="text-center pt-2">
        <p className="text-xs text-muted-foreground">
          💡 Service duration varies by home size (typically 2-4 hours)
        </p>
      </div>
    </div>
  );
}
