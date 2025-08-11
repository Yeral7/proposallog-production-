/**
 * Timezone utility functions for Charlotte, NC (Eastern Time)
 */

const CHARLOTTE_TIMEZONE = 'America/New_York';

/**
 * Formats a date string or Date object to Charlotte, NC time
 * @param date - Date string or Date object
 * @param options - Intl.DateTimeFormatOptions
 * @returns Formatted date string in Charlotte timezone
 */
export function formatToCharlotteTime(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {}
): string {
  if (!date) return 'N/A';

  let dateObj;
  if (typeof date === 'string') {
    // Ensure the date string is treated as UTC. If it doesn't have timezone info,
    // it might be parsed as local time. Appending 'Z' forces UTC parsing.
    // SQLite UTC format is 'YYYY-MM-DD HH:MM:SS'. Replace space with 'T' for ISO 8601.
    let dateStringToParse = date;
    if (!dateStringToParse.endsWith('Z') && dateStringToParse.includes(' ')) {
        dateStringToParse = dateStringToParse.replace(' ', 'T') + 'Z';
    }
    dateObj = new Date(dateStringToParse);
  } else {
    dateObj = date;
  }

  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: CHARLOTTE_TIMEZONE,
    ...options,
  };

  return dateObj.toLocaleString('en-US', defaultOptions);
}

/**
 * Formats a date to Charlotte time with default date format (MM/DD/YYYY)
 */
export function formatDateToCharlotte(date: string | Date): string {
  return formatToCharlotteTime(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Formats a date to Charlotte time with full date and time format
 */
export function formatDateTimeToCharlotte(date: string | Date): string {
  return formatToCharlotteTime(date, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Gets the current time in Charlotte timezone
 */
export function getCurrentCharlotteTime(): string {
  return formatDateTimeToCharlotte(new Date());
}

/**
 * Converts a date to Charlotte timezone and returns ISO string
 */
export function toCharlotteISOString(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Create a new date in Charlotte timezone
  const charlotteDate = new Date(dateObj.toLocaleString('en-US', { 
    timeZone: CHARLOTTE_TIMEZONE 
  }));
  
  return charlotteDate.toISOString();
}
