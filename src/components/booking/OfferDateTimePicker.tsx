import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Sun,
  Sunset,
  Moon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type TimeSlotId = 'morning' | 'afternoon' | 'evening';

export const TIME_SLOTS: Array<{
  id: TimeSlotId;
  label: string;
  window: string;
  helper: string;
  icon: typeof Sun;
}> = [
  {
    id: 'morning',
    label: 'Morning',
    window: '8 AM – 11 AM',
    helper: 'Start fresh, head out clean',
    icon: Sun,
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    window: '12 PM – 3 PM',
    helper: 'Popular lunch-hour window',
    icon: Sunset,
  },
  {
    id: 'evening',
    label: 'Evening',
    window: '3 PM – 6 PM',
    helper: 'Home by the time you are',
    icon: Moon,
  },
];

interface OfferDateTimePickerProps {
  date: string; // YYYY-MM-DD
  timeSlot: TimeSlotId | '';
  onDateChange: (date: string) => void;
  onTimeSlotChange: (slot: TimeSlotId) => void;
  /** Days to show starting at today. Defaults to 14. */
  days?: number;
  /** Skip today (useful when next-day lead time is enforced). */
  minLeadDays?: number;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatMonthRange(start: Date, days: number): string {
  const end = new Date(start);
  end.setDate(end.getDate() + days - 1);
  const sameMonth =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth();
  const monthFmt = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  });
  if (sameMonth) return monthFmt.format(start);
  const shortMonthFmt = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  });
  return `${shortMonthFmt.format(start)} – ${shortMonthFmt.format(end)}`;
}

/**
 * Weekly calendar chip picker (like Calendly / Novara's scheduler)
 * with a horizontally scrollable row of days and a 3-card time-block
 * selector underneath.
 *
 * - Renders a 14-day window by default.
 * - First paged view starts today (or today+`minLeadDays` if set).
 * - Weekends are allowed; the picker is purely UI — business hours
 *   come from the `TIME_SLOTS` table above.
 */
export function OfferDateTimePicker({
  date,
  timeSlot,
  onDateChange,
  onTimeSlotChange,
  days = 14,
  minLeadDays = 0,
}: OfferDateTimePickerProps) {
  const [pageStartIso, setPageStartIso] = useState<string>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + minLeadDays);
    return toYMD(d);
  });

  const windowDays = useMemo(() => {
    const start = new Date(pageStartIso + 'T00:00:00');
    return Array.from({ length: days }, (_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      return {
        iso: toYMD(d),
        weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
        day: d.getDate(),
        monthShort: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d),
        full: new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }).format(d),
        dateObj: d,
      };
    });
  }, [pageStartIso, days]);

  const handleShiftWindow = (delta: number) => {
    const base = new Date(pageStartIso + 'T00:00:00');
    base.setDate(base.getDate() + delta);
    const todayFloor = new Date();
    todayFloor.setHours(0, 0, 0, 0);
    todayFloor.setDate(todayFloor.getDate() + minLeadDays);
    if (base < todayFloor) {
      setPageStartIso(toYMD(todayFloor));
    } else {
      setPageStartIso(toYMD(base));
    }
  };

  const selectedDateLabel = useMemo(() => {
    if (!date) return null;
    const d = new Date(date + 'T00:00:00');
    if (Number.isNaN(d.valueOf())) return null;
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(d);
  }, [date]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Pick a date</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {formatMonthRange(new Date(pageStartIso + 'T00:00:00'), days)}
            </span>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full"
              onClick={() => handleShiftWindow(-7)}
              aria-label="Earlier dates"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full"
              onClick={() => handleShiftWindow(7)}
              aria-label="Later dates"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth snap-x">
          {windowDays.map((d) => {
            const isSelected = date === d.iso;
            const todayFloor = new Date();
            todayFloor.setHours(0, 0, 0, 0);
            const isToday = toYMD(todayFloor) === d.iso;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => onDateChange(d.iso)}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[72px] rounded-2xl border-2 px-3 py-3 transition-all snap-start',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground shadow-clean'
                    : 'border-border hover:border-primary/60',
                )}
                aria-pressed={isSelected}
                aria-label={d.full}
              >
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wider font-semibold',
                    isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground',
                  )}
                >
                  {d.weekday}
                </span>
                <span
                  className={cn(
                    'text-2xl font-bold mt-0.5',
                    isSelected ? 'text-primary-foreground' : 'text-foreground',
                  )}
                >
                  {d.day}
                </span>
                <span
                  className={cn(
                    'text-[10px] uppercase tracking-wider',
                    isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground',
                  )}
                >
                  {isToday ? 'Today' : d.monthShort}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sun className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Pick an arrival window</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TIME_SLOTS.map((slot) => {
            const Icon = slot.icon;
            const isSelected = timeSlot === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => onTimeSlotChange(slot.id)}
                className={cn(
                  'rounded-2xl border-2 p-4 text-left transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-clean'
                    : 'border-border hover:border-primary/50',
                )}
                aria-pressed={isSelected}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center',
                      isSelected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-semibold">{slot.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {slot.window}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{slot.helper}</p>
              </button>
            );
          })}
        </div>
      </div>

      {date && timeSlot && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          <span>
            Scheduled for{' '}
            <strong>{selectedDateLabel}</strong>
            {' · '}
            <strong>
              {TIME_SLOTS.find((s) => s.id === timeSlot)?.window}
            </strong>
          </span>
        </div>
      )}
    </div>
  );
}
