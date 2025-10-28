import { uniqueNamesGenerator, adjectives, colors, animals, Config } from 'unique-names-generator';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate unique event ID using unique-names-generator
 * Format: adjective-color-animal (e.g., "brave-blue-elephant")
 */
export function generateEventId(): string {
  const config: Config = {
    dictionaries: [adjectives, colors, animals],
    separator: '-',
    length: 3,
    style: 'lowerCase',
  };

  return uniqueNamesGenerator(config);
}

/**
 * Cookie Management Functions
 */

const COOKIE_NAME = 'event_scheduler_user';
const USER_NAME_COOKIE = 'muuvs_user_name';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 365 days in seconds
const NAME_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

/**
 * Get or create user cookie ID
 * Returns existing cookie ID or generates new UUID
 */
export function getUserCookieId(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering - return empty string or handle appropriately
    return '';
  }

  let cookieId = getCookie(COOKIE_NAME);

  if (!cookieId) {
    cookieId = uuidv4();
    setCookie(COOKIE_NAME, cookieId, { maxAge: COOKIE_MAX_AGE });
  }

  return cookieId;
}

/**
 * Set a cookie with options
 */
export function setCookie(
  name: string,
  value: string,
  options: {
    maxAge?: number;
    path?: string;
    domain?: string;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  } = {}
): void {
  if (typeof window === 'undefined') return;

  const {
    maxAge = COOKIE_MAX_AGE,
    path = '/',
    secure = process.env.NODE_ENV === 'production',
    sameSite = 'Lax',
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
  cookieString += `; Max-Age=${maxAge}`;
  cookieString += `; Path=${path}`;
  cookieString += `; SameSite=${sameSite}`;

  if (secure) {
    cookieString += '; Secure';
  }

  if (options.domain) {
    cookieString += `; Domain=${options.domain}`;
  }

  document.cookie = cookieString;
}

/**
 * Get a cookie by name
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;

  const nameEQ = encodeURIComponent(name) + '=';
  const cookies = document.cookie.split(';');

  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.startsWith(nameEQ)) {
      return decodeURIComponent(cookie.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string): void {
  setCookie(name, '', { maxAge: -1 });
}

/**
 * User Name Cookie Management
 */

/**
 * Get stored user name from cookie
 * Returns null if no name is stored
 */
export function getUserName(): string | null {
  return getCookie(USER_NAME_COOKIE);
}

/**
 * Set user name in cookie (30 day expiration)
 */
export function setUserName(name: string): void {
  const trimmedName = name.trim();
  if (trimmedName.length >= 2 && trimmedName.length <= 30) {
    setCookie(USER_NAME_COOKIE, trimmedName, { maxAge: NAME_COOKIE_MAX_AGE });
  }
}

/**
 * Check if user has a name stored
 */
export function hasUserName(): boolean {
  const name = getUserName();
  return name !== null && name.trim().length >= 2;
}

/**
 * Date Formatting Utilities
 */

/**
 * Format date to human-readable string
 * Example: "Saturday, Oct 12 at 10:00 AM"
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return d.toLocaleString('en-US', options).replace(',', ' at');
}

/**
 * Format date to short string
 * Example: "Oct 12, 10:00 AM"
 */
export function formatDateTimeShort(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return d.toLocaleString('en-US', options);
}

/**
 * Format date only
 * Example: "Saturday, Oct 12"
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  };

  return d.toLocaleString('en-US', options);
}

/**
 * Format time only
 * Example: "10:00 AM"
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  return d.toLocaleString('en-US', options);
}

/**
 * Get relative time string
 * Example: "2 hours ago", "in 3 days"
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffMins = Math.floor(Math.abs(diffMs) / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  const isPast = diffMs < 0;
  const prefix = isPast ? '' : 'in ';
  const suffix = isPast ? ' ago' : '';

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${prefix}${diffMins} minute${diffMins !== 1 ? 's' : ''}${suffix}`;
  if (diffHours < 24) return `${prefix}${diffHours} hour${diffHours !== 1 ? 's' : ''}${suffix}`;
  return `${prefix}${diffDays} day${diffDays !== 1 ? 's' : ''}${suffix}`;
}

/**
 * Preset Time Slot Generators
 */

/**
 * Get next occurrence of a specific day of week
 */
function getNextDayOfWeek(fromDate: Date, dayOfWeek: number): Date {
  const date = new Date(fromDate);
  const currentDay = date.getDay();
  const distance = (dayOfWeek + 7 - currentDay) % 7;
  
  // If distance is 0, we want next week's occurrence
  const daysToAdd = distance === 0 ? 7 : distance;
  
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

/**
 * Set time on a date object
 */
function setTime(date: Date, hours: number, minutes: number = 0): Date {
  const newDate = new Date(date);
  newDate.setHours(hours, minutes, 0, 0);
  return newDate;
}

/**
 * Time slot type for presets
 */
export interface TimeSlotPreset {
  start_time: Date;
  end_time?: Date;
  label: string;
}

/**
 * Generate time slots for "This Weekend"
 * Returns 3 slots: Saturday 10am, Saturday 2pm, Sunday 11am
 */
export function getThisWeekendTimes(): TimeSlotPreset[] {
  const now = new Date();
  const saturday = getNextDayOfWeek(now, 6); // Saturday is 6
  const sunday = getNextDayOfWeek(now, 0); // Sunday is 0

  return [
    {
      start_time: setTime(saturday, 10, 0),
      label: 'Saturday Morning',
    },
    {
      start_time: setTime(saturday, 14, 0),
      label: 'Saturday Afternoon',
    },
    {
      start_time: setTime(sunday, 11, 0),
      label: 'Sunday Morning',
    },
  ];
}

/**
 * Generate time slots for "Next Weekend"
 * Returns 3 slots for the following weekend
 */
export function getNextWeekendTimes(): TimeSlotPreset[] {
  const now = new Date();
  const thisSaturday = getNextDayOfWeek(now, 6);
  
  // Add 7 days to get next weekend
  const nextSaturday = new Date(thisSaturday);
  nextSaturday.setDate(nextSaturday.getDate() + 7);
  
  const nextSunday = new Date(nextSaturday);
  nextSunday.setDate(nextSunday.getDate() + 1);

  return [
    {
      start_time: setTime(nextSaturday, 10, 0),
      label: 'Next Saturday Morning',
    },
    {
      start_time: setTime(nextSaturday, 14, 0),
      label: 'Next Saturday Afternoon',
    },
    {
      start_time: setTime(nextSunday, 11, 0),
      label: 'Next Sunday Morning',
    },
  ];
}

/**
 * Generate time slots for "Weekday Evenings"
 * Returns 3-5 slots: Mon 7pm, Wed 7pm, Thu 7pm (this week or next)
 */
export function getWeekdayEveningTimes(): TimeSlotPreset[] {
  const now = new Date();
  const monday = getNextDayOfWeek(now, 1); // Monday is 1
  const wednesday = getNextDayOfWeek(now, 3); // Wednesday is 3
  const thursday = getNextDayOfWeek(now, 4); // Thursday is 4

  return [
    {
      start_time: setTime(monday, 19, 0), // 7 PM
      label: 'Monday Evening',
    },
    {
      start_time: setTime(wednesday, 19, 0),
      label: 'Wednesday Evening',
    },
    {
      start_time: setTime(thursday, 19, 0),
      label: 'Thursday Evening',
    },
  ];
}

/**
 * Utility for className merging (cn)
 * Useful for conditional Tailwind classes
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Validation Utilities
 */

/**
 * Check if a date is in the future
 */
export function isFutureDate(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.getTime() > new Date().getTime();
}

/**
 * Validate event title
 */
export function validateEventTitle(title: string): { valid: boolean; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Event title is required' };
  }
  if (title.length > 100) {
    return { valid: false, error: 'Event title must be 100 characters or less' };
  }
  return { valid: true };
}

/**
 * Validate location
 */
export function validateLocation(location: string): { valid: boolean; error?: string } {
  if (location && location.length > 200) {
    return { valid: false, error: 'Location must be 200 characters or less' };
  }
  return { valid: true };
}


