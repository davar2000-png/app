/**
 * Date Utilities - Jalali/Shamsi Calendar Support
 * Uses date-fns-jalali for Persian calendar operations
 */

import { format, parse } from 'date-fns-jalali';

// Simple locale object for Persian formatting (avoiding type conflicts)
const persianLocale = {
  code: 'fa',
  options: { weekStartsOn: 6 as const },
};

/**
 * Convert a JavaScript Date to Jalali string format
 * @param date - JavaScript Date object
 * @param formatStr - Format string (default: 'yyyy/MM/dd')
 * @returns Jalali date string
 */
export function toJalali(date: Date, formatStr: string = 'yyyy/MM/dd'): string {
  try {
    return format(date, formatStr);
  } catch (error) {
    console.error('Error converting to Jalali:', error);
    return '';
  }
}

/**
 * Parse a Jalali date string to JavaScript Date
 * @param jalaliString - Jalali date string (e.g., '1403/01/15')
 * @param formatStr - Format string (default: 'yyyy/MM/dd')
 * @returns JavaScript Date object
 */
export function fromJalali(jalaliString: string, formatStr: string = 'yyyy/MM/dd'): Date {
  try {
    return parse(jalaliString, formatStr, new Date());
  } catch (error) {
    console.error('Error parsing Jalali date:', error);
    return new Date();
  }
}

/**
 * Get current date in Jalali format
 * @param formatStr - Format string (default: 'yyyy/MM/dd')
 * @returns Current Jalali date string
 */
export function getCurrentJalali(formatStr: string = 'yyyy/MM/dd'): string {
  return toJalali(new Date(), formatStr);
}

/**
 * Get current date as ISO string (for database storage)
 */
export function getISODate(): string {
  return new Date().toISOString();
}

/**
 * Format a date for display in Persian
 * @param date - Date to format
 * @returns Formatted Persian date string
 */
export function formatPersianDate(date: Date): string {
  return toJalali(date, 'dddd، dd MMMM yyyy');
}

/**
 * Format a date with time for display in Persian
 * @param date - Date to format
 * @returns Formatted Persian date and time string
 */
export function formatPersianDateTime(date: Date): string {
  return toJalali(date, 'dd MMMM yyyy ساعت HH:mm');
}

/**
 * Validate if a string is a valid Jalali date
 * @param jalaliString - String to validate
 * @returns true if valid
 */
export function isValidJalali(jalaliString: string): boolean {
  try {
    const parsed = parse(jalaliString, 'yyyy/MM/dd', new Date());
    return !isNaN(parsed.getTime());
  } catch {
    return false;
  }
}

/**
 * Add days to a date
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New Date object
 */
export function addDaysToDate(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to a date
 * @param date - Base date
 * @param months - Number of months to add
 * @returns New Date object
 */
export function addMonthsToDate(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Get start of day
 * @param date - Date object
 * @returns Date at start of day
 */
export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day
 * @param date - Date object
 * @returns Date at end of day
 */
export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Check if a date is overdue
 * @param dueDate - Due date
 * @returns true if overdue
 */
export function isOverdue(dueDate: Date): boolean {
  const now = new Date();
  return dueDate < now;
}

/**
 * Get days until a date (negative if overdue)
 * @param targetDate - Target date
 * @returns Number of days
 */
export function daysUntil(targetDate: Date): number {
  const now = new Date();
  const diffTime = targetDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format relative time in Persian (e.g., "دیروز", "امروز", "فردا")
 * @param date - Date to format
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date): string {
  const today = startOfDay(new Date());
  const targetDate = startOfDay(date);
  const diffDays = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'امروز';
  if (diffDays === 1) return 'فردا';
  if (diffDays === -1) return 'دیروز';
  if (diffDays > 1) return `${diffDays} روز آینده`;
  return `${Math.abs(diffDays)} روز پیش`;
}
