import { useEffect, useState } from 'react';
import { Zap, PhoneOff, CalendarClock } from 'lucide-react';

const MESSAGES = [
  {
    icon: Zap,
    text: 'Instant pricing — see your quote in seconds.',
  },
  {
    icon: PhoneOff,
    text: 'No call required — book 100% online.',
  },
  {
    icon: CalendarClock,
    text: 'Next-available slots open as soon as tomorrow.',
  },
];

interface RotatingSubheadlineProps {
  intervalMs?: number;
  className?: string;
}

/**
 * Rotates through three conversion-focused value props under the main headline.
 * Uses a fade+slide animation between messages and respects prefers-reduced-motion.
 */
export function RotatingSubheadline({
  intervalMs = 3000,
  className = '',
}: RotatingSubheadlineProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % MESSAGES.length),
      prefersReducedMotion ? intervalMs * 2 : intervalMs,
    );
    return () => window.clearInterval(id);
  }, [intervalMs]);

  const { icon: Icon, text } = MESSAGES[index];

  return (
    <div
      className={`flex items-center justify-center gap-2 text-sm md:text-base font-medium text-primary ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      <span
        key={index}
        className="inline-flex items-center gap-2 animate-fade-in"
      >
        <Icon className="h-4 w-4 md:h-5 md:w-5 shrink-0" />
        <span>{text}</span>
      </span>
    </div>
  );
}
