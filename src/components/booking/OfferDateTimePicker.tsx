import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Clock3,
  Check,
  Sparkles,
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  Moon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

/**
 * Arrival window ids. Persisted on `bookings.time_slot` and converted
 * to scheduled_start / scheduled_end by /api/create-job for HCP.
 *
 * The set is exhaustive — duration-aware filtering happens on the
 * client at render time, so we still write a known id to the DB.
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
export const DEFAULT_WINDOW_DAYS = 30;

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

/**
 * Service-duration → list of bookable arrival windows.
 *
 * The cleaner needs to fit the full job (including buffer) into the
 * working day (7 AM – 7 PM ⇢ 12 hour window). Arrival windows whose
 * `startHour + serviceDurationHours` exceeds 7 PM are filtered out
 * so we never offer a slot the crew can't actually finish on time.
 *
 * Standard / recurring (~2h) → all six windows.
 * Deep (~4h)                  → drops "evening" (5–7 PM start ⇒ 9 PM end).
 * Move-out / heavy (~6h)      → drops "late_afternoon" + "evening".
 */
function filterSlotsByDuration(
  durationHours: number,
): TimeSlotDefinition[] {
  const lastFinishHour = 19; // crew off the clock by 7 PM
  return TIME_SLOTS.filter(
    (s) => s.startHour + durationHours <= lastFinishHour,
  );
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
   * How many days forward the customer can book. Defaults to 30 so
   * we cover a full month in the inline calendar.
   */
  windowDays?: number;
  /**
   * Approx service duration in hours (used to filter out windows the
   * crew can't finish before 7 PM). Defaults to 2 hours.
   */
  serviceDurationHours?: number;
  /**
   * Display name for the service (e.g. "Deep Clean"). Used in the
   * subtitle "Choose a 2-hour arrival window for your Deep Clean".
   */
  serviceLabel?: string;
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

const LONG_FMT = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

/**
 * Inline-calendar + duration-aware time-grid picker.
 *
 * Layout:
 *   ┌─────────────────────┬──────────────────────────────┐
 *   │  Month calendar     │  Arrival windows (filtered   │
 *   │  (next 30 days)     │  by service duration)        │
 *   └─────────────────────┴──────────────────────────────┘
 *
 * On mobile the two panes stack vertically. The time grid only
 * displays windows the crew can realistically finish before 7 PM
 * given the service duration so we never sell an unservable slot.
 */
export function OfferDateTimePicker({
  date,
  timeSlot,
  onDateChange,
  onTimeSlotChange,
  minLeadDays = DEFAULT_MIN_LEAD_DAYS,
  windowDays = DEFAULT_WINDOW_DAYS,
  serviceDurationHours = 2,
  serviceLabel,
}: OfferDateTimePickerProps) {
  const earliestBookable = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + minLeadDays);
    return d;
  }, [minLeadDays]);

  const latestBookable = useMemo(() => {
    const d = new Date(earliestBookable);
    d.setDate(d.getDate() + windowDays);
    return d;
  }, [earliestBookable, windowDays]);

  const selectedDate = parseYMD(date);
  const selectedDateLabel = selectedDate ? LONG_FMT.format(selectedDate) : null;

  const earliestBookableLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(earliestBookable);

  const leadDaysLabel =
    minLeadDays === 0
      ? 'Same-day available'
      : minLeadDays === 1
        ? 'Next-day · 24 h lead'
        : `Earliest: ${earliestBookableLabel}`;

  // Duration-aware window list. Memoized so we don't recompute when
  // the user picks a date — only when the service changes.
  const availableSlots = useMemo(
    () => filterSlotsByDuration(serviceDurationHours),
    [serviceDurationHours],
  );

  // If the parent restored a draft slot that isn't valid for this
  // service duration, clear it so the customer must reselect.
  useEffect(() => {
    if (!timeSlot) return;
    const stillValid = availableSlots.some((s) => s.id === timeSlot);
    if (!stillValid) onTimeSlotChange(availableSlots[0]?.id ?? 'morning');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceDurationHours]);

  const durationLabel =
    serviceDurationHours <= 2
      ? '~2 hours'
      : serviceDurationHours <= 4
        ? '~4 hours'
        : `~${serviceDurationHours} hours`;

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-primary font-semibold mb-1">
            Schedule your visit
          </p>
          <h3 className="text-base font-semibold text-foreground">
            {serviceLabel
              ? `Pick a date and arrival window for your ${serviceLabel}`
              : 'Pick a date and arrival window'}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Estimated visit duration: {durationLabel} · 2-hour arrival window
          </p>
        </div>
        <Badge
          variant="outline"
          className="border-primary/40 text-primary text-[10px] font-semibold uppercase tracking-wider bg-primary/5"
        >
          {leadDaysLabel}
        </Badge>
      </header>

      <div className="grid gap-6 md:grid-cols-[auto_1fr]">
        {/* ===== Inline calendar ===== */}
        <section className="rounded-2xl border border-border bg-card shadow-soft md:w-[320px]">
          <div className="flex items-center gap-2 px-4 pt-4">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">
              Choose a date
            </h4>
          </div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(day) => {
              if (!day) return;
              onDateChange(toYMD(day));
            }}
            disabled={(day) => day < earliestBookable || day > latestBookable}
            defaultMonth={selectedDate ?? earliestBookable}
            initialFocus
            className={cn('p-3 pointer-events-auto')}
          />
        </section>

        {/* ===== Time grid (duration-aware) ===== */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">
              Arrival window
            </h4>
            <span className="text-xs text-muted-foreground">
              ({availableSlots.length} options)
            </span>
          </div>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-muted/40 px-4 py-12 text-center">
              <CalendarDays className="h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">
                Choose a date first
              </p>
              <p className="text-xs text-muted-foreground">
                Available arrival windows will appear here
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {availableSlots.map((slot) => {
                const Icon = slot.icon;
                const isSelected = timeSlot === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => onTimeSlotChange(slot.id)}
                    aria-pressed={isSelected}
                    className={cn(
                      'group relative flex flex-col items-start gap-1.5 rounded-xl border-2 px-3 py-3 text-left transition-all',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                        : 'border-border bg-card hover:border-primary/60 hover:bg-primary/5',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-7 w-7 items-center justify-center rounded-full',
                        isSelected
                          ? 'bg-primary-foreground/15 text-primary-foreground'
                          : 'bg-muted text-muted-foreground group-hover:bg-primary/10',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isSelected ? 'text-primary-foreground' : 'text-foreground',
                      )}
                    >
                      {slot.window}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] leading-tight',
                        isSelected
                          ? 'text-primary-foreground/85'
                          : 'text-muted-foreground',
                      )}
                    >
                      {slot.helper}
                    </span>
                    {isSelected && (
                      <span className="absolute right-2 top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary-foreground text-primary">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {availableSlots.length < TIME_SLOTS.length && (
            <p className="text-[11px] text-muted-foreground italic">
              Later windows are hidden so the crew can finish your{' '}
              {durationLabel.replace('~', '')} visit before 7 PM.
            </p>
          )}
        </section>
      </div>

      {/* ===== Confirmation stripe ===== */}
      {selectedDateLabel && timeSlot && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
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
