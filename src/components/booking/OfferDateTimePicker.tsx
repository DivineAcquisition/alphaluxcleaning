import { useEffect, useMemo, useRef, type ReactNode } from 'react';
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

const CHIP_FMT = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});

/** Numbered step badge used by both panes ("1 Choose a date"). */
function StepBadge({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors',
        done
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground',
      )}
    >
      {done ? <Check className="h-3 w-3" /> : children}
    </span>
  );
}

/**
 * Inline-calendar + duration-aware time-grid picker.
 *
 * Layout:
 *   ┌─────────────────────┬──────────────────────────────┐
 *   │  1 · Month calendar │  2 · Arrival windows         │
 *   │  (next 30 days)     │  (filtered by duration)      │
 *   └─────────────────────┴──────────────────────────────┘
 *
 * On mobile the two panes stack vertically; picking a date
 * auto-scrolls the arrival windows into view so the second step is
 * never missed. The time grid always renders — dimmed and locked
 * until a date is chosen — so customers can see what they're
 * unlocking. Windows the crew can't finish before 7 PM (given the
 * service duration) are filtered out so we never sell an
 * unservable slot.
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
  const timeSectionRef = useRef<HTMLElement | null>(null);

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
  const selectedDateChip = selectedDate ? CHIP_FMT.format(selectedDate) : null;

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

  // Mobile: the calendar and the time grid stack, so after picking a
  // date the arrival windows can sit below the fold. Scroll them into
  // view (once per date pick, only while no slot is chosen yet) so
  // step 2 is impossible to miss on a phone.
  useEffect(() => {
    if (!date || timeSlot) return;
    if (typeof window === 'undefined') return;
    if (!window.matchMedia('(max-width: 767px)').matches) return;
    // Let the slot grid enable/re-render before measuring.
    const t = window.setTimeout(() => {
      timeSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 120);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const durationLabel =
    serviceDurationHours <= 2
      ? '~2 hours'
      : serviceDurationHours <= 4
        ? '~4 hours'
        : `~${serviceDurationHours} hours`;

  const selectedSlotDef = timeSlot
    ? TIME_SLOTS.find((s) => s.id === timeSlot)
    : undefined;

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
        {/* ===== Step 1 · Inline calendar ===== */}
        <section
          className={cn(
            'rounded-2xl border bg-card shadow-soft md:w-[324px] transition-colors',
            selectedDate ? 'border-primary/40' : 'border-border',
          )}
        >
          <div className="flex items-center justify-between gap-2 px-4 pt-4">
            <div className="flex items-center gap-2">
              <StepBadge done={!!selectedDate}>1</StepBadge>
              <h4 className="text-sm font-semibold text-foreground">
                Choose a date
              </h4>
            </div>
            {selectedDateChip && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                <CalendarDays className="h-3 w-3" />
                {selectedDateChip}
              </span>
            )}
          </div>
          <div className="flex justify-center">
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
              classNames={{
                // Larger tap targets + a bolder selected day so the
                // choice reads clearly, especially on mobile.
                caption_label: 'text-sm font-semibold',
                nav_button:
                  'h-8 w-8 bg-transparent p-0 border border-border rounded-md opacity-70 hover:opacity-100 hover:border-primary/50 inline-flex items-center justify-center transition-opacity',
                head_cell:
                  'text-muted-foreground rounded-md w-10 font-normal text-[0.8rem]',
                cell: 'h-10 w-10 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
                day: 'h-10 w-10 p-0 font-normal rounded-md inline-flex items-center justify-center hover:bg-primary/10 aria-selected:opacity-100 transition-colors',
                day_selected:
                  'bg-primary text-primary-foreground font-semibold ring-2 ring-primary/30 ring-offset-1 hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
                day_today:
                  'bg-accent text-accent-foreground font-medium',
                day_disabled: 'text-muted-foreground opacity-40',
              }}
            />
          </div>
          <p className="px-4 pb-3 text-[11px] text-muted-foreground">
            {selectedDate
              ? 'Tap another day to change your date.'
              : `Days before ${earliestBookableLabel} are unavailable so our team can schedule your crew.`}
          </p>
        </section>

        {/* ===== Step 2 · Time grid (duration-aware) ===== */}
        <section ref={timeSectionRef} className="space-y-3 scroll-mt-24">
          <div className="flex items-center gap-2">
            <StepBadge done={!!(selectedDate && timeSlot)}>2</StepBadge>
            <Clock3 className="h-4 w-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">
              Pick an arrival window
            </h4>
            <span className="text-xs text-muted-foreground">
              ({availableSlots.length} options)
            </span>
          </div>

          {!selectedDate && (
            <p className="text-xs font-medium text-muted-foreground">
              Choose a date first — the windows below unlock as soon as
              you do.
            </p>
          )}

          <div
            className={cn(
              'grid grid-cols-2 gap-2 sm:grid-cols-3 transition-opacity',
              !selectedDate && 'opacity-50',
            )}
            aria-disabled={!selectedDate}
          >
            {availableSlots.map((slot) => {
              const Icon = slot.icon;
              const isSelected = !!selectedDate && timeSlot === slot.id;
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!selectedDate}
                  onClick={() => onTimeSlotChange(slot.id)}
                  aria-pressed={isSelected}
                  className={cn(
                    'group relative flex flex-col items-start gap-1.5 rounded-xl border-2 px-3 py-3 text-left transition-all',
                    'disabled:cursor-not-allowed',
                    isSelected
                      ? 'border-primary bg-primary text-primary-foreground shadow-glow'
                      : 'border-border bg-card',
                    !isSelected &&
                      selectedDate &&
                      'hover:border-primary/60 hover:bg-primary/5 active:scale-[0.98]',
                  )}
                >
                  <span className="flex w-full items-center justify-between gap-1">
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
                        'text-[10px] font-semibold uppercase tracking-wide',
                        isSelected
                          ? 'text-primary-foreground/85'
                          : 'text-muted-foreground',
                      )}
                    >
                      {slot.label}
                    </span>
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

          {availableSlots.length < TIME_SLOTS.length && (
            <p className="text-[11px] text-muted-foreground italic">
              Later windows are hidden so the crew can finish your{' '}
              {durationLabel.replace('~', '')} visit before 7 PM.
            </p>
          )}
        </section>
      </div>

      {/* ===== Confirmation stripe ===== */}
      {selectedDateLabel && selectedSlotDef && (
        <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 animate-in fade-in duration-200">
          <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Reserved — we'll confirm by email &amp; text
            </p>
            <p className="text-sm text-muted-foreground">
              {selectedDateLabel}{' '}
              <span className="text-foreground font-medium">
                · {selectedSlotDef.label} ({selectedSlotDef.window})
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
