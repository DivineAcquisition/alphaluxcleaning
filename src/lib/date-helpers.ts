import { format } from 'date-fns';

/**
 * Convert a Date object to a local date string (YYYY-MM-DD) without UTC conversion
 * This prevents timezone issues when storing dates as strings
 */
export function toLocalDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse a date string (YYYY-MM-DD) as a local date without timezone shifts
 * This prevents timezone issues when converting date strings back to Date objects
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
}

/**
 * Get today's date in local timezone as a string (YYYY-MM-DD)
 */
export function getTodayLocal(): string {
  return toLocalDate(new Date());
}

/**
 * Get tomorrow's date in local timezone as a string (YYYY-MM-DD)
 */
export function getTomorrowLocal(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toLocalDate(tomorrow);
}

/**
 * Add days to a date and return as local date string
 */
export function addDaysLocal(date: Date, days: number): string {
  const newDate = new Date(date);
  newDate.setDate(date.getDate() + days);
  return toLocalDate(newDate);
}

/**
 * Check if two date strings represent the same day
 */
export function isSameLocalDate(date1: string, date2: string): boolean {
  return date1 === date2;
}