import type { CSSProperties } from 'react';
import { useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Clock3,
  Check,
  Sparkles,
  Sunrise,
  Sun,
  CloudSun,
  Sunset,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Arrival window ids. Persisted on `bookings.time_slot` and converted
 * to scheduled_start / scheduled_end by the HCP sync + webhook
 * payload builders. The set is exhaustive — duration-aware filtering
 * happens on the client at render time, so we still write a known
 * id to the DB.
 *
 * 2026-05-02: expanded from 6 two-hour blocks to 9 hourly arrival
 * slots between 9 AM and 5 PM so customers can pick a start time
 * on the hour. The crew still works a 2-hour arrival window, so a
 * slot labeled "1 PM" means "crew arrives 1 – 2 PM". Every slot's
 * earliest end time is the crew's working day ceiling of 7 PM so
 * no job is scheduled past close.
 */
export type TimeSlotId =
  // Legacy two-hour slots, kept so bookings persisted before this
  // change still resolve.
  | 'early_morning'
  | 'morning'
  | 'late_morning'
  | 'afternoon'
  | 'late_afternoon'
  | 'evening'
  // New hourly arrival slots (2026-05-02).
  | 'arr_9am'
  | 'arr_10am'
  | 'arr_11am'
  | 'arr_12pm'
  | 'arr_1pm'
  | 'arr_2pm'
  | 'arr_3pm'
  | 'arr_4pm'
  | 'arr_5pm';

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
  /** Whether this slot is shown by default. Legacy 2-hour slots
   *  aren't rendered in the picker but still resolve for older rows. */
  deprecated?: boolean;
  icon: typeof Sun;
}

/**
 * Canonical arrival-window table.
 *
 * The new hourly slots (2026-05-02) are the ones shown in the
 * picker; they use a 2-hour arrival window so the crew has slack.
 * A "9 AM" slot means "arrive between 9 and 10 AM for a 2-hour
 * job", but the crew's committed end hour is `startHour + 2` so
 * a 5 PM slot ends at 7 PM, the latest we'll schedule anything.
 *
 * Legacy slots below are marked `deprecated: true` so the filter
 * hides them from new bookings while still mapping old time_slot
 * values to something sensible when we render a past booking.
 */
export const TIME_SLOTS: TimeSlotDefinition[] = [
  // ── Active (2026-05-02): hourly arrival windows 9 AM – 5 PM ──
  {
    id: 'arr_9am',
    label: '9 AM',
    window: '9 – 10 AM',
    helper: 'Open of business',
    startHour: 9,
    endHour: 11,
    icon: Sunrise,
  },
  {
    id: 'arr_10am',
    label: '10 AM',
    window: '10 – 11 AM',
    helper: 'Mid-morning start',
    startHour: 10,
    endHour: 12,
    icon: Sun,
  },
  {
    id: 'arr_11am',
    label: '11 AM',
    window: '11 AM – 12 PM',
    helper: 'Late morning',
    startHour: 11,
    endHour: 13,
    icon: Sun,
  },
  {
    id: 'arr_12pm',
    label: '12 PM',
    window: '12 – 1 PM',
    helper: 'Midday start',
    startHour: 12,
    endHour: 14,
    icon: CloudSun,
  },
  {
    id: 'arr_1pm',
    label: '1 PM',
    window: '1 – 2 PM',
    helper: 'After-lunch reset',
    startHour: 13,
    endHour: 15,
    icon: Sun,
  },
  {
    id: 'arr_2pm',
    label: '2 PM',
    window: '2 – 3 PM',
    helper: 'Popular mid-afternoon',
    startHour: 14,
    endHour: 16,
    icon: Sun,
  },
  {
    id: 'arr_3pm',
    label: '3 PM',
    window: '3 – 4 PM',
    helper: 'Early-afternoon arrival',
    startHour: 15,
    endHour: 17,
    icon: Sunset,
  },
  {
    id: 'arr_4pm',
    label: '4 PM',
    window: '4 – 5 PM',
    helper: 'Late-afternoon arrival',
    startHour: 16,
    endHour: 18,
    icon: Sunset,
  },
  {
    id: 'arr_5pm',
    label: '5 PM',
    window: '5 – 6 PM',
    helper: 'Evening arrival — latest start',
    startHour: 17,
    endHour: 19,
    icon: Sunset,
  },

  // ── Legacy 2-hour blocks, kept for backwards compat only ──
  {
    id: 'early_morning',
    label: 'Early Morning',
    window: '7 – 9 AM',
    helper: 'Beat the commute',
    startHour: 7,
    endHour: 9,
    icon: Sunrise,
    deprecated: true,
  },
  {
    id: 'morning',
    label: 'Morning',
    window: '9 – 11 AM',
    helper: 'Start fresh, head out clean',
    startHour: 9,
    endHour: 11,
    icon: Sun,
    deprecated: true,
  },
  {
    id: 'late_morning',
    label: 'Late Morning',
    window: '11 AM – 1 PM',
    helper: 'Wrap up before lunch',
    startHour: 11,
    endHour: 13,
    icon: CloudSun,
    deprecated: true,
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    window: '1 – 3 PM',
    helper: 'Popular mid-afternoon window',
    startHour: 13,
    endHour: 15,
    icon: Sun,
    deprecated: true,
  },
  {
    id: 'late_afternoon',
    label: 'Late Afternoon',
    window: '3 – 5 PM',
    helper: 'Home by the time you are',
    startHour: 15,
    endHour: 17,
    icon: Sunset,
    deprecated: true,
  },
  {
    id: 'evening',
    label: 'Evening',
    window: '5 – 7 PM',
    helper: 'Great for after-work resets',
    startHour: 17,
    endHour: 19,
    icon: Sunset,
    deprecated: true,
  },
];

/**
 * Minimum lead time for the standard booking flow. Customers who
 * want a next-day slot must explicitly opt in to the rush upsell
 * which unlocks tomorrow and adds $50 to the cart.
 */
export const DEFAULT_MIN_LEAD_DAYS = 3;
export const RUSH_MIN_LEAD_DAYS = 1; // next-day
export const RUSH_SURCHARGE_USD = 50;
export const DEFAULT_WINDOW_DAYS = 30;

/**
 * Convert a YYYY-MM-DD date + a TimeSlotId into ISO-8601 start/end
 * timestamps. Used by the HCP sync + webhook payload builders.
 */
export function timeSlotToIsoWindow(
  dateYmd: string,
  slot: TimeSlotId,
): { start: string; end: string } {
  const def = TIME_SLOTS.find((s) => s.id === slot) ?? TIME_SLOTS[0];
  const [y, m, d] = dateYmd.split('-').map(Number);
  const start = new Date(y, (m || 1) - 1, d || 1, def.startHour, def.startMinute ?? 0, 0);
  const end = new Date(y, (m || 1) - 1, d || 1, def.endHour, def.endMinute ?? 0, 0);
  return { start: start.toISOString(), end: end.toISOString() };
}

/**
 * Service-duration → bookable arrival windows.
 *
 * The crew's working day ceiling is 7 PM, so any slot whose
 * `startHour + serviceDurationHours` exceeds 7 PM is filtered out.
 * With the new hourly slots 9 AM – 5 PM that means:
 *
 *   Standard (~2h)       → all 9 slots.
 *   Deep (~4h)           → drops 4 PM + 5 PM (would end 8 – 9 PM).
 *   Move-out (~6h)       → drops 2 PM onward (would end past 7 PM).
 *
 * Legacy slots are never surfaced.
 */
function filterSlotsByDuration(
  durationHours: number,
): TimeSlotDefinition[] {
  const lastFinishHour = 19; // crew off the clock by 7 PM
  return TIME_SLOTS.filter(
    (s) => !s.deprecated && s.startHour + durationHours <= lastFinishHour,
  );
}

interface OfferDateTimePickerProps {
  date: string; // YYYY-MM-DD
  timeSlot: TimeSlotId | '';
  onDateChange: (date: string) => void;
  onTimeSlotChange: (slot: TimeSlotId) => void;
  /**
   * Standard lead time, in days. AlphaLux runs a 3-day default so
   * the ops team has time to schedule a crew.
   */
  minLeadDays?: number;
  /**
   * How many days forward the customer can book. Defaults to 30.
   */
  windowDays?: number;
  /**
   * Approx service duration in hours (used to filter out windows
   * the crew can't finish before 7 PM). Defaults to 2 hours.
   */
  serviceDurationHours?: number;
  /** Display name for the service (e.g. "Deep Clean"). */
  serviceLabel?: string;
  /**
   * Current rush state + toggle callback. When `rushEnabled` is
   * true the picker allows next-day (minLeadDays=1) and surfaces
   * the surcharge; when false it enforces minLeadDays.
   */
  rushEnabled?: boolean;
  onRushChange?: (enabled: boolean) => void;
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
 * Inline-calendar + time-grid picker with a next-day rush toggle.
 *
 * Layout (desktop):
 *   ┌────────────────────────────┬────────────────────────────┐
 *   │  Month calendar (large)    │  Arrival windows           │
 *   │  9 hourly slots            │  (duration-aware filter)   │
 *   └────────────────────────────┴────────────────────────────┘
 *
 * The left calendar is deliberately large (`--cell-size: 48px`
 * override below) so the customer can see a full month at a glance
 * and tap a date without zooming on mobile. The right pane only
 * renders slots the crew can realistically finish before 7 PM
 * given the selected service's estimated duration.
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
  rushEnabled = false,
  onRushChange,
}: OfferDateTimePickerProps) {
  // Effective lead time. Customers who opted into the rush upsell
  // can book tomorrow; everyone else must pick ≥ 3 days out.
  const effectiveMinLeadDays = rushEnabled ? RUSH_MIN_LEAD_DAYS : minLeadDays;

  const earliestBookable = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + effectiveMinLeadDays);
    return d;
  }, [effectiveMinLeadDays]);

  const latestBookable = useMemo(() => {
    const d = new Date(earliestBookable);
    d.setDate(d.getDate() + windowDays);
    return d;
  }, [earliestBookable, windowDays]);

  const selectedDate = parseYMD(date);
  const selectedDateLabel = selectedDate ? LONG_FMT.format(selectedDate) : null;

  // If the customer had a date selected and then turned the rush
  // toggle off, their picked date might now be in the rush-only
  // range — clear it so they have to re-pick from the valid window.
  useEffect(() => {
    if (!selectedDate) return;
    if (selectedDate < earliestBookable) {
      onDateChange('');
      onTimeSlotChange('' as TimeSlotId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earliestBookable.toDateString()]);

  const earliestBookableLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(earliestBookable);

  const leadDaysLabel = rushEnabled
    ? `Rush · next-day available from ${earliestBookableLabel}`
    : `Earliest: ${earliestBookableLabel}`;

  const availableSlots = useMemo(
    () => filterSlotsByDuration(serviceDurationHours),
    [serviceDurationHours],
  );

  // Clear a legacy slot that's not in the new active set.
  useEffect(() => {
    if (!timeSlot) return;
    const stillValid = availableSlots.some((s) => s.id === timeSlot);
    if (!stillValid) onTimeSlotChange('' as TimeSlotId);
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
      <header className="flex items-start justify-between gap-3 flex-wrap">
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
          className={cn(
            'text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap',
            rushEnabled
              ? 'border-alx-gold/60 bg-alx-gold/10 text-alx-gold-deep'
              : 'border-primary/40 bg-primary/5 text-primary',
          )}
        >
          {leadDaysLabel}
        </Badge>
      </header>

      {/* ===== Rush next-day toggle ===== */}
      {onRushChange && (
        <div
          className={cn(
            'flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border-2 px-4 py-3 transition-colors',
            rushEnabled
              ? 'border-alx-gold/60 bg-alx-gold/5'
              : 'border-border bg-muted/30',
          )}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <span
              className={cn(
                'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                rushEnabled
                  ? 'bg-alx-gold/20 text-alx-gold-deep'
                  : 'bg-primary/10 text-primary',
              )}
            >
              <Zap className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Need it faster? Next-day rush booking
              </p>
              <p className="text-xs text-muted-foreground">
                Unlocks tomorrow as a bookable date ·{' '}
                <span className="font-semibold text-foreground">
                  +${RUSH_SURCHARGE_USD} added at checkout
                </span>
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant={rushEnabled ? 'default' : 'outline'}
            size="sm"
            onClick={() => onRushChange(!rushEnabled)}
            className={cn(
              'whitespace-nowrap rounded-full',
              rushEnabled
                ? 'bg-alx-gold text-alx-black-ink hover:bg-alx-gold-light'
                : '',
            )}
            aria-pressed={rushEnabled}
          >
            {rushEnabled ? (
              <>
                <Check className="h-3.5 w-3.5 mr-1" />
                Rush enabled
              </>
            ) : (
              <>+${RUSH_SURCHARGE_USD} add rush</>
            )}
          </Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,auto)_minmax(0,1fr)]">
        {/* ===== Inline calendar — large for better scannability ===== */}
        <section
          className="rounded-2xl border border-border bg-card shadow-soft lg:w-[420px]"
          // The calendar component picks up --cell-size from its
          // host element. Bumping it from the default 32px to
          // 48px nearly doubles the tap target without touching
          // the component itself. Paired with p-5 so the grid has
          // visual air at the larger size. Cast once to satisfy
          // React's CSSProperties type, which doesn't know about
          // arbitrary custom props.
          style={
            { '--cell-size': '48px' } as CSSProperties
          }
        >
          <div className="flex items-center justify-between gap-2 px-5 pt-5">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold text-foreground">
                Choose a date
              </h4>
            </div>
            {rushEnabled && (
              <Badge className="bg-alx-gold text-alx-black-ink text-[10px] font-semibold uppercase tracking-wider">
                <Zap className="h-3 w-3 mr-1" />
                Rush on
              </Badge>
            )}
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
            className={cn('p-5 pointer-events-auto')}
          />
        </section>

        {/* ===== Time grid (duration-aware, hourly) ===== */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">
              Arrival window
            </h4>
            <span className="text-xs text-muted-foreground">
              ({availableSlots.length} slots · 9 AM – 5 PM)
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
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
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

          {availableSlots.length < 9 && selectedDate && (
            <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground italic">
              <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
              Later windows are hidden so the crew can finish your{' '}
              {durationLabel.replace('~', '')} visit before 7 PM.
            </p>
          )}
        </section>
      </div>

      {/* ===== Confirmation stripe ===== */}
      {selectedDateLabel && timeSlot && (
        <div
          className={cn(
            'flex items-start gap-3 rounded-2xl border p-4',
            rushEnabled
              ? 'border-alx-gold/40 bg-alx-gold/5'
              : 'border-primary/25 bg-primary/5',
          )}
        >
          <div
            className={cn(
              'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
              rushEnabled
                ? 'bg-alx-gold text-alx-black-ink'
                : 'bg-primary text-primary-foreground',
            )}
          >
            {rushEnabled ? (
              <Zap className="h-4 w-4" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {rushEnabled ? 'Rush booking reserved' : "Reserved — we'll confirm by email"}
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedDateLabel}{' '}
              <span className="text-foreground font-medium">
                · {TIME_SLOTS.find((s) => s.id === timeSlot)?.window}
              </span>
              {rushEnabled && (
                <>
                  {' '}
                  <span className="text-alx-gold-deep font-semibold">
                    · +${RUSH_SURCHARGE_USD} rush surcharge
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
