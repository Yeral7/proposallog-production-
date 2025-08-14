// Timezone utility functions for Charlotte, NC (Eastern Time)
// Handles both EST and EDT automatically

/**
 * Format a date/timestamp to Charlotte, NC time (Eastern Time)
 * @param dateInput - Date string, Date object, or timestamp
 * @returns Formatted date string in Charlotte ET
 */
export function formatDateToCharlotte(dateInput: string | Date | number): string {
  const date = new Date(dateInput);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Format a date/timestamp to Charlotte, NC time with time included
 * @param dateInput - Date string, Date object, or timestamp
 * @returns Formatted datetime string in Charlotte ET
 */
export function formatDateTimeToCharlotte(dateInput: string | Date | number): string {
  const date = new Date(dateInput);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Format a date/timestamp to Charlotte, NC time (compact format for audit logs)
 * @param dateInput - Date string, Date object, or timestamp
 * @returns Formatted datetime string in Charlotte ET (compact)
 */
export function formatAuditTimeToCharlotte(dateInput: string | Date | number): string {
  const date = new Date(dateInput);
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  return date.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Get current Charlotte, NC time
 * @returns Current date/time in Charlotte ET
 */
export function getCurrentCharlotteTime(): Date {
  // Create a date in Charlotte timezone
  const now = new Date();
  const charlotteTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  return charlotteTime;
}
