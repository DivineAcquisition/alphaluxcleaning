import { useMemo, useState } from 'react';
import {
  CalendarIcon,
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  Moon,
  Clock3,
  Check,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
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

function parseYMD(ymd: string): Date | undefined {
  if (!ymd) return undefined;
  const [y, m, d] = ymd.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

/**
 * Popover-calendar + toggle-group time-slot picker. Uses shadcn
 * primitives (`Calendar`, `Popover`, `Separator`, `Badge`) so it
 * matches the rest of the design system and gives customers a
 * familiar month-grid interface instead of the previous horizontal
 * date-strip.
 */
export function OfferDateTimePicker({
  date,
  timeSlot,
  onDateChange,
  onTimeSlotChange,
  minLeadDays = DEFAULT_MIN_LEAD_DAYS,
}: OfferDateTimePickerProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

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

  const earliestBookableLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      }).format(earliestBookable),
    [earliestBookable],
  );

  const selectedDateLabel = useMemo(() => {
    const parsed = parseYMD(date);
    if (!parsed) return null;
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(parsed);
  }, [date]);

  const leadDaysLabel =
    minLeadDays === 0
      ? 'Same-day booking available'
      : minLeadDays === 1
        ? 'Next-day booking · 24 hr lead time'
        : `${minLeadDays}-day lead time · earliest ${earliestBookableLabel}`;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-[1.15fr_1fr] md:gap-5">
        {/* Date column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-alx-gold" />
              <span className="text-sm font-semibold text-foreground">
                Service date
              </span>
            </div>
            <Badge
              variant="outline"
              className="border-alx-gold/40 text-alx-gold text-[10px] font-semibold uppercase tracking-wider"
            >
              {leadDaysLabel}
            </Badge>
          </div>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  'w-full justify-start rounded-xl border-2 border-border/80 bg-card px-4 py-6 text-left hover:border-alx-gold/60',
                  !selectedDateLabel && 'text-muted-foreground',
                )}
                aria-haspopup="dialog"
                aria-expanded={calendarOpen}
              >
                <CalendarIcon className="mr-3 h-5 w-5 text-alx-gold" />
                <span className="flex-1 text-base font-medium">
                  {selectedDateLabel || 'Pick a service date'}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseYMD(date)}
                onSelect={(day) => {
                  if (!day) return;
                  onDateChange(toYMD(day));
                  setCalendarOpen(false);
                }}
                disabled={(day) =>
                  day < earliestBookable || day > latestBookable
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {!selectedDateLabel && (
            <p className="text-xs text-muted-foreground">
              Crews ship within a 2-hour arrival window. Pick any day at
              least {minLeadDays} days out.
            </p>
          )}
        </div>

        {/* Time column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-alx-gold" />
            <span className="text-sm font-semibold text-foreground">
              Arrival window
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {TIME_SLOTS.map((slot) => {
              const Icon = slot.icon;
              const isSelected = timeSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => onTimeSlotChange(slot.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    'group relative flex flex-col items-start gap-1 rounded-xl border-2 bg-card px-3 py-3 text-left transition-all',
                    isSelected
                      ? 'border-alx-gold bg-alx-gold/10 shadow-soft'
                      : 'border-border/70 hover:border-alx-gold/50 hover:bg-alx-gold/5',
                  )}
                >
                  {isSelected && (
                    <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-alx-gold text-alx-black-ink">
                      <Check className="h-3 w-3" />
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isSelected ? 'text-alx-gold' : 'text-muted-foreground',
                      )}
                    />
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isSelected ? 'text-foreground' : 'text-foreground/90',
                      )}
                    >
                      {slot.label}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {slot.window}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedDateLabel && timeSlot && (
        <>
          <Separator />
          <div className="flex items-start gap-3 rounded-xl bg-alx-gold/10 border border-alx-gold/25 p-3 text-sm">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-alx-gold" />
            <div>
              <p className="font-semibold text-foreground">
                Slot reserved
              </p>
              <p className="text-muted-foreground">
                {selectedDateLabel} · {
                  TIME_SLOTS.find((s) => s.id === timeSlot)?.window
                }
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
