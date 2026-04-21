import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Arrival window ids. Values match what we persist on the booking row
 * (bookings.time_slot) and what /api/create-job converts to
 * scheduled_start / scheduled_end for Housecall Pro.
 *
 * The "morning" / "afternoon" / "evening" ids are kept for backwards
 * compatibility with existing bookings.
 */
export type TimeSlotId =
  | 'early_morning'
  | 'morning'
  | 'late_morning'
  | 'afternoon'
  | 'late_afternoon'
  | 'evening';

export interface TimeSlotDefinition {
  id: TimeSlotId;
  label: string;
  window: string;
  helper: string;
  /** Start hour (24h) used to derive the ISO schedule. */
  startHour: number;
  startMinute?: number;
  /** End hour (24h) used to derive the ISO schedule. */
  endHour: number;
  endMinute?: number;
  icon: typeof Sun;
}

export const TIME_SLOTS: TimeSlotDefinition[] = [
  {
    id: 'early_morning',
    label: 'Early Morning',
    window: '7 AM – 9 AM',
    helper: 'Beat the commute',
    startHour: 7,
    endHour: 9,
    icon: Sunrise,
  },
  {
    id: 'morning',
    label: 'Morning',
    window: '9 AM – 11 AM',
    helper: 'Start fresh, head out clean',
    startHour: 9,
    endHour: 11,
    icon: Sun,
  },
  {
    id: 'late_morning',
    label: 'Late Morning',
    window: '11 AM – 1 PM',
    helper: 'Wrap up before the lunch rush',
    startHour: 11,
    endHour: 13,
    icon: CloudSun,
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    window: '1 PM – 3 PM',
    helper: 'Popular mid-afternoon window',
    startHour: 13,
    endHour: 15,
    icon: Sunset,
  },
  {
    id: 'late_afternoon',
    label: 'Late Afternoon',
    window: '3 PM – 5 PM',
    helper: 'Home by the time you are',
    startHour: 15,
    endHour: 17,
    icon: Sunset,
  },
  {
    id: 'evening',
    label: 'Evening',
    window: '5 PM – 7 PM',
    helper: 'Great for after-work resets',
    startHour: 17,
    endHour: 19,
    icon: Moon,
  },
];

export const DEFAULT_MIN_LEAD_DAYS = 3;
export const DEFAULT_WINDOW_DAYS = 21;

/**
 * Convert a YYYY-MM-DD date + a TimeSlotId into ISO-8601 start/end
 * timestamps (used by /api/create-job → HCP). Exposed as a helper so
 * the rest of the codebase doesn't hard-code hour offsets per slot.
 */
export function timeSlotToIsoWindow(
  dateYmd: string,
  slot: TimeSlotId,
): { start: string; end: string } {
  const def = TIME_SLOTS.find((s) => s.id === slot) ?? TIME_SLOTS[1];
  const [y, m, d] = dateYmd.split('-').map(Number);
  const start = new Date(y, (m || 1) - 1, d || 1, def.startHour, def.startMinute ?? 0, 0);
  const end = new Date(y, (m || 1) - 1, d || 1, def.endHour, def.endMinute ?? 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

interface OfferDateTimePickerProps {
  date: string; // YYYY-MM-DD
  timeSlot: TimeSlotId | '';
  onDateChange: (date: string) => void;
  onTimeSlotChange: (slot: TimeSlotId) => void;
  /** Days to show in the window. Defaults to DEFAULT_WINDOW_DAYS. */
  days?: number;
  /**
   * Earliest bookable day, counted as "today + N days". AlphaLux
   * requires at least 3 days of lead time so the ops team can
   * schedule a crew.
   */
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
 * with a horizontally scrollable row of days and a 6-card time-block
 * selector underneath.
 *
 * Defaults:
 *   - Minimum lead time of 3 days (AlphaLux ops requirement) so days
 *     0..2 can't be clicked, and the visible window starts at the
 *     earliest bookable day.
 *   - 21-day rolling window, paged ±7 days via chevrons.
 *   - Weekends are allowed by the picker; business hours live in
 *     the `TIME_SLOTS` table above.
 */
export function OfferDateTimePicker({
  date,
  timeSlot,
  onDateChange,
  onTimeSlotChange,
  days = DEFAULT_WINDOW_DAYS,
  minLeadDays = DEFAULT_MIN_LEAD_DAYS,
}: OfferDateTimePickerProps) {
  // The very earliest a customer can book. Everything before this in
  // the visible strip is shown as disabled so it's obvious why Mon /
  // Tue / Wed (etc.) aren't clickable.
  const earliestBookable = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + minLeadDays);
    return d;
  }, [minLeadDays]);
  const earliestBookableIso = useMemo(() => toYMD(earliestBookable), [earliestBookable]);

  const [pageStartIso, setPageStartIso] = useState<string>(() => earliestBookableIso);

  const windowDays = useMemo(() => {
    const start = new Date(pageStartIso + 'T00:00:00');
    return Array.from({ length: days }, (_, idx) => {
      const d = new Date(start);
      d.setDate(start.getDate() + idx);
      const iso = toYMD(d);
      return {
        iso,
        weekday: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(d),
        day: d.getDate(),
        monthShort: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(d),
        full: new Intl.DateTimeFormat('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }).format(d),
        dateObj: d,
        disabled: iso < earliestBookableIso,
      };
    });
  }, [pageStartIso, days, earliestBookableIso]);

  const handleShiftWindow = (delta: number) => {
    const base = new Date(pageStartIso + 'T00:00:00');
    base.setDate(base.getDate() + delta);
    if (base < earliestBookable) {
      setPageStartIso(earliestBookableIso);
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

  const earliestBookableLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(earliestBookable),
    [earliestBookable],
  );

  const leadDaysLabel =
    minLeadDays === 0
      ? 'Same-day booking available'
      : minLeadDays === 1
        ? 'Next-day booking · need 24 hr lead time'
        : `Need ${minLeadDays}-day lead time (earliest: ${earliestBookableLabel})`;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
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

        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          <Star className="h-3 w-3" />
          {leadDaysLabel}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth snap-x">
          {windowDays.map((d) => {
            const isSelected = date === d.iso;
            const todayFloor = new Date();
            todayFloor.setHours(0, 0, 0, 0);
            const isToday = toYMD(todayFloor) === d.iso;
            const isEarliest = d.iso === earliestBookableIso;
            return (
              <button
                key={d.iso}
                type="button"
                onClick={() => !d.disabled && onDateChange(d.iso)}
                disabled={d.disabled}
                className={cn(
                  'flex flex-col items-center justify-center min-w-[76px] rounded-2xl border-2 px-3 py-3 transition-all snap-start',
                  d.disabled
                    ? 'border-border/60 bg-muted/30 text-muted-foreground/60 cursor-not-allowed line-through decoration-muted-foreground/40'
                    : isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-clean'
                      : 'border-border hover:border-primary/60',
                )}
                aria-pressed={isSelected}
                aria-disabled={d.disabled}
                aria-label={
                  d.disabled
                    ? `${d.full} (unavailable — need ${minLeadDays}-day lead time)`
                    : d.full
                }
                title={
                  d.disabled
                    ? `Earliest booking is ${earliestBookableLabel}`
                    : undefined
                }
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
                    isSelected
                      ? 'text-primary-foreground/90'
                      : isEarliest
                        ? 'text-primary font-semibold'
                        : 'text-muted-foreground',
                  )}
                >
                  {isToday ? 'Today' : isEarliest ? 'Earliest' : d.monthShort}
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
        <p className="text-xs text-muted-foreground mb-3">
          Each window is a 2-hour arrival range — our crew lands anywhere in
          the window and works around your day.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
