import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  Clock3,
  Check,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
    window: '7 – 9 AM',
    helper: 'Beat the commute',
    startHour: 7,
    endHour: 9,
    icon: Sunrise,
  },
  {
    id: 'morning',
    label: 'Morning',
    window: '9 – 11 AM',
    helper: 'Start fresh, head out clean',
    startHour: 9,
    endHour: 11,
    icon: Sun,
  },
  {
    id: 'late_morning',
    label: 'Late Morning',
    window: '11 AM – 1 PM',
    helper: 'Wrap up before lunch',
    startHour: 11,
    endHour: 13,
    icon: CloudSun,
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    window: '1 – 3 PM',
    helper: 'Popular mid-afternoon window',
    startHour: 13,
    endHour: 15,
    icon: Sun,
  },
  {
    id: 'late_afternoon',
    label: 'Late Afternoon',
    window: '3 – 5 PM',
    helper: 'Home by the time you are',
    startHour: 15,
    endHour: 17,
    icon: Sunset,
  },
  {
    id: 'evening',
    label: 'Evening',
    window: '5 – 7 PM',
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
  /**
   * Earliest bookable day, counted as "today + N days". AlphaLux
   * requires at least 3 days of lead time so the ops team can
   * schedule a crew.
   */
  minLeadDays?: number;
  /**
   * How many days of swipe-able day cards to show in the inline
   * strip. The customer can page beyond this window via ‹/› nav or
   * tap "More dates" to open the full month calendar.
   */
  windowDays?: number;
}

function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseYMD(ymd: string): Date | undefined {
  if (!ymd) return undefined;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const WEEKDAY_FMT = new Intl.DateTimeFormat('en-US', { weekday: 'short' });
const DAY_FMT = new Intl.DateTimeFormat('en-US', { day: 'numeric' });
const MONTH_FMT = new Intl.DateTimeFormat('en-US', { month: 'short' });
const LONG_FMT = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

/**
 * Groups the six arrival windows into three marketing-friendly parts
 * of the day so the time picker reads as a 2×3 grid of pill-buttons
 * instead of a cramped 2×3 of verbose cards. Morning / Midday /
 * Afternoon / Evening map to one, two, or three concrete windows
 * apiece; the detailed hours surface beneath the selected column.
 */
const PART_OF_DAY: Array<{
  id: 'morning' | 'midday' | 'afternoon' | 'evening';
  label: string;
  short: string;
  icon: typeof Sun;
  slots: TimeSlotId[];
}> = [
  { id: 'morning', label: 'Morning', short: '7 AM – 11 AM', icon: Sunrise, slots: ['early_morning', 'morning'] },
  { id: 'midday', label: 'Midday', short: '11 AM – 1 PM', icon: Sun, slots: ['late_morning'] },
  { id: 'afternoon', label: 'Afternoon', short: '1 – 5 PM', icon: CloudSun, slots: ['afternoon', 'late_afternoon'] },
  { id: 'evening', label: 'Evening', short: '5 – 7 PM', icon: Moon, slots: ['evening'] },
];

/**
 * Inline date-strip + part-of-day picker.
 *
 * Design differs from the previous popover-calendar picker:
 *   1. The next ~14 bookable days render as a horizontally-scrollable
 *      row of day-cards (weekday on top, date in the middle, relative
 *      hint like "Today" or "Earliest" underneath). Customers can
 *      page through weeks with ‹ / › chevrons or tap "More dates" to
 *      pop a full month calendar for anything further out.
 *   2. Arrival windows collapse into 4 part-of-day pills (Morning,
 *      Midday, Afternoon, Evening). Picking a part-of-day reveals a
 *      secondary row of concrete windows (7–9 AM, 9–11 AM, …) so the
 *      customer never sees six cramped cards but still gets a precise
 *      2-hour window.
 *   3. A blue confirmation stripe summarizes the final selection at
 *      the bottom in the SaaS-blue theme.
 */
export function OfferDateTimePicker({
  date,
  timeSlot,
  onDateChange,
  onTimeSlotChange,
  minLeadDays = DEFAULT_MIN_LEAD_DAYS,
  windowDays = 14,
}: OfferDateTimePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);
  const stripRef = useRef<HTMLDivElement | null>(null);
  const [activePart, setActivePart] = useState<
    'morning' | 'midday' | 'afternoon' | 'evening' | null
  >(null);
  const [offset, setOffset] = useState(0);

  const earliestBookable = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + minLeadDays);
    return d;
  }, [minLeadDays]);

  const latestBookable = useMemo(() => {
    const d = new Date(earliestBookable);
    d.setDate(d.getDate() + 60);
    return d;
  }, [earliestBookable]);

  // Day-strip: render `windowDays` cards starting at earliestBookable + offset.
  const days = useMemo(() => {
    const result: Date[] = [];
    for (let i = 0; i < windowDays; i++) {
      const d = new Date(earliestBookable);
      d.setDate(d.getDate() + offset + i);
      result.push(d);
    }
    return result;
  }, [earliestBookable, windowDays, offset]);

  const canPagePrev = offset > 0;
  const canPageNext = true; // always allow — latestBookable caps it server-side

  const selectedDate = parseYMD(date);
  const selectedDateLabel = selectedDate ? LONG_FMT.format(selectedDate) : null;
  const earliestBookableLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(earliestBookable);

  // Keep activePart in sync when the parent flips timeSlot externally
  // (e.g. restoring a draft booking). The slot → part mapping is
  // static so we just look it up.
  useEffect(() => {
    if (!timeSlot) {
      setActivePart(null);
      return;
    }
    const match = PART_OF_DAY.find((p) => p.slots.includes(timeSlot as TimeSlotId));
    setActivePart(match?.id ?? null);
  }, [timeSlot]);

  const leadDaysLabel =
    minLeadDays === 0
      ? 'Same-day booking available'
      : minLeadDays === 1
        ? 'Next-day · 24 h lead time'
        : `${minLeadDays}-day lead time · from ${earliestBookableLabel}`;

  const pageDays = 7;
  const handlePrev = () => {
    if (!canPagePrev) return;
    setOffset((o) => Math.max(0, o - pageDays));
    stripRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };
  const handleNext = () => {
    setOffset((o) => o + pageDays);
    stripRef.current?.scrollTo({ left: 0, behavior: 'smooth' });
  };

  const selectedPart = PART_OF_DAY.find((p) => p.id === activePart);

  return (
    <div className="space-y-6">
      {/* ===== Date strip ===== */}
      <section className="space-y-3">
        <header className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              Pick a day
            </h3>
          </div>
          <Badge
            variant="outline"
            className="border-primary/40 text-primary text-[10px] font-semibold uppercase tracking-wider bg-primary/5"
          >
            {leadDaysLabel}
          </Badge>
        </header>

        <div className="relative">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Previous week"
            onClick={handlePrev}
            disabled={!canPagePrev}
            className={cn(
              'absolute left-0 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-border bg-card shadow-soft',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div
            ref={stripRef}
            className={cn(
              'flex snap-x snap-mandatory scroll-pl-10 gap-2 overflow-x-auto overflow-y-hidden',
              'px-10 py-1',
              'scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent',
            )}
          >
            {days.map((d) => {
              const disabled = d < earliestBookable || d > latestBookable;
              const ymd = toYMD(d);
              const isSelected = Boolean(selectedDate && isSameDay(d, selectedDate));
              const isEarliest = isSameDay(d, earliestBookable);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const isToday = isSameDay(d, today);
              return (
                <button
                  key={ymd}
                  type="button"
                  disabled={disabled}
                  onClick={() => onDateChange(ymd)}
                  aria-pressed={isSelected}
                  className={cn(
                    'group flex min-w-[64px] shrink-0 snap-start flex-col items-center gap-1 rounded-2xl border-2 px-2 py-3 transition-all',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                      : 'border-border bg-card hover:border-primary/60 hover:bg-primary/5',
                    disabled && 'opacity-40 pointer-events-none',
                  )}
                >
                  <span
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider',
                      isSelected ? 'text-primary-foreground/85' : 'text-muted-foreground',
                    )}
                  >
                    {WEEKDAY_FMT.format(d)}
                  </span>
                  <span
                    className={cn(
                      'text-xl font-bold tabular-nums',
                      isSelected ? 'text-primary-foreground' : 'text-foreground',
                    )}
                  >
                    {DAY_FMT.format(d)}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      isSelected ? 'text-primary-foreground/85' : 'text-muted-foreground',
                    )}
                  >
                    {isToday
                      ? 'Today'
                      : isEarliest
                        ? 'Earliest'
                        : MONTH_FMT.format(d)}
                  </span>
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Next week"
            onClick={handleNext}
            disabled={!canPageNext}
            className="absolute right-0 top-1/2 z-10 h-9 w-9 -translate-y-1/2 rounded-full border border-border bg-card shadow-soft"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* "More dates" → opens full month calendar in a popover */}
        <div className="flex items-center justify-between gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-primary"
              >
                <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                More dates →
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(day) => {
                  if (!day) return;
                  onDateChange(toYMD(day));
                  setCalendarOpen(false);
                }}
                disabled={(day) => day < earliestBookable || day > latestBookable}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {selectedDateLabel && (
            <span className="flex items-center gap-1 text-xs text-primary font-medium">
              <Sparkles className="h-3 w-3" />
              {selectedDateLabel}
            </span>
          )}
        </div>
      </section>

      {/* ===== Arrival window: part-of-day + concrete slot ===== */}
      <section className="space-y-3">
        <header className="flex items-center gap-2">
          <Clock3 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Arrival window
          </h3>
          <span className="text-xs text-muted-foreground">
            (2-hour arrival window)
          </span>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PART_OF_DAY.map((p) => {
            const Icon = p.icon;
            const isActive = activePart === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setActivePart(p.id);
                  // If the part only has one slot, auto-select it.
                  if (p.slots.length === 1) onTimeSlotChange(p.slots[0]);
                }}
                aria-pressed={isActive}
                className={cn(
                  'relative flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-4 text-center transition-all',
                  isActive
                    ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-soft'
                    : 'border-border bg-card hover:border-primary/50 hover:bg-primary/5',
                )}
              >
                <span
                  className={cn(
                    'inline-flex h-9 w-9 items-center justify-center rounded-full',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span
                  className={cn(
                    'text-sm font-semibold',
                    isActive ? 'text-foreground' : 'text-foreground/90',
                  )}
                >
                  {p.label}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {p.short}
                </span>
              </button>
            );
          })}
        </div>

        {/* Concrete arrival window — only shown once a part is picked
            and it has more than one slot in it. */}
        {selectedPart && selectedPart.slots.length > 1 && (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-1">
            {selectedPart.slots.map((slotId) => {
              const def = TIME_SLOTS.find((s) => s.id === slotId);
              if (!def) return null;
              const isSelected = timeSlot === slotId;
              return (
                <button
                  key={slotId}
                  type="button"
                  onClick={() => onTimeSlotChange(slotId)}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-card hover:border-primary/60 hover:bg-primary/5',
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      {def.window}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {def.helper}
                    </span>
                  </div>
                  {isSelected && (
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== Confirmation stripe ===== */}
      {selectedDateLabel && timeSlot && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">
              Reserved — we'll confirm by email
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedDateLabel}{' '}
              <span className="text-foreground font-medium">
                · {TIME_SLOTS.find((s) => s.id === timeSlot)?.window}
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
