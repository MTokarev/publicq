/**
 * Utility functions for date formatting and manipulation
 */

/**
 * Formats a UTC date string to local timezone with date and time
 * @param dateString - UTC date string from the backend
 * @returns Formatted date string in local timezone
 */
export const formatDateToLocal = (dateString: string): string => {
  // Handle dates with timezone offsets (e.g., "2025-11-18T19:56:00-08:00") or UTC (ending with Z)
  const date = parseUtcDate(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Formats a UTC date string to local timezone with date only
 * @param dateString - UTC date string from the backend
 * @returns Formatted date string in local timezone (date only)
 */
export const formatDateOnlyToLocal = (dateString: string): string => {
  // Handle dates with timezone offsets (e.g., "2025-11-18T19:56:00-08:00") or UTC (ending with Z)
  const date = parseUtcDate(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Converts a UTC date string to a proper Date object
 * @param dateString - UTC date string from the backend
 * @returns Date object in local timezone
 */
export const parseUtcDate = (dateString: string): Date => {
  // If the date string doesn't have a timezone indicator (Z or offset), 
  // append 'Z' to ensure it's treated as UTC
  let normalizedDate = dateString.trim();
  
  // Check if date string lacks timezone info
  // Look for Z at the end, or +/- timezone offset like +00:00 or -08:00
  const hasTimezone = /Z$/i.test(normalizedDate) || /[+-]\d{2}:?\d{2}$/.test(normalizedDate);
  
  if (!hasTimezone) {
    // If it's an ISO-like date string (contains 'T'), append 'Z' for UTC
    if (normalizedDate.includes('T')) {
      normalizedDate = normalizedDate + 'Z';
    }
  }
  
  return new Date(normalizedDate);
};

/**
 * Compares current time with a UTC date string
 * @param utcDateString - UTC date string to compare against
 * @param currentTime - Optional current time to use for comparison (defaults to new Date())
 * @returns true if current time is before the given date
 */
export const isBeforeNow = (utcDateString: string, currentTime?: Date): boolean => {
  const now = currentTime || new Date();
  const targetDate = parseUtcDate(utcDateString);
  return now < targetDate;
};

/**
 * Compares current time with a UTC date string
 * @param utcDateString - UTC date string to compare against
 * @param currentTime - Optional current time to use for comparison (defaults to new Date())
 * @returns true if current time is after the given date
 */
export const isAfterNow = (utcDateString: string, currentTime?: Date): boolean => {
  const now = currentTime || new Date();
  const targetDate = parseUtcDate(utcDateString);
  return now > targetDate;
};

/**
 * Checks if current time is between two UTC date strings
 * @param startDateString - UTC start date string
 * @param endDateString - UTC end date string
 * @param currentTime - Optional current time to use for comparison (defaults to new Date())
 * @returns true if current time is between start and end dates (inclusive)
 */
export const isBetweenDates = (startDateString: string, endDateString: string, currentTime?: Date): boolean => {
  const now = currentTime || new Date();
  const startDate = parseUtcDate(startDateString);
  const endDate = parseUtcDate(endDateString);
  return now >= startDate && now <= endDate;
};

/**
 * Calculates remaining time for a module based on start time and duration
 * @param startedAtUtc - UTC string when module was started
 * @param durationInMinutes - Duration of the module in minutes
 * @param currentTime - Optional current time to use for calculation (defaults to new Date())
 * @returns Object with remaining time information
 */
export const calculateModuleTimeRemaining = (
  startedAtUtc: string,
  durationInMinutes: number,
  currentTime?: Date
) => {
  const now = currentTime || new Date();
  const startTime = parseUtcDate(startedAtUtc);
  
  // Validate that startTime is a valid date
  if (isNaN(startTime.getTime())) {
    console.error('Invalid startedAtUtc date:', startedAtUtc);
    return {
      hasTimeRemaining: false,
      isExpired: true,
      totalMinutes: 0,
      hours: 0,
      minutes: 0,
      formattedTime: '00:00',
      formattedDisplay: 'Time Expired'
    };
  }
  
  const endTime = new Date(startTime.getTime() + (durationInMinutes * 60 * 1000));
  
  const remainingMs = endTime.getTime() - now.getTime();
  
  // If time has elapsed
  if (remainingMs <= 0) {
    return {
      hasTimeRemaining: false,
      isExpired: true,
      totalMinutes: 0,
      hours: 0,
      minutes: 0,
      formattedTime: '00:00',
      formattedDisplay: 'Time Expired'
    };
  }
  
  const totalMinutesRemaining = Math.ceil(remainingMs / (1000 * 60));
  const hours = Math.floor(totalMinutesRemaining / 60);
  const minutes = totalMinutesRemaining % 60;
  
  // Format time as HH:MM
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Create display text
  let formattedDisplay: string;
  if (hours > 0) {
    formattedDisplay = `${hours}h ${minutes}m remaining`;
  } else {
    formattedDisplay = `${minutes}m remaining`;
  }
  
  return {
    hasTimeRemaining: true,
    isExpired: false,
    totalMinutes: totalMinutesRemaining,
    hours,
    minutes,
    formattedTime,
    formattedDisplay
  };
};

/**
 * Calculates elapsed time since module start
 * @param startedAtUtc - UTC string when module was started
 * @param currentTime - Optional current time to use for calculation (defaults to new Date())
 * @returns Object with elapsed time information
 */
export const calculateModuleElapsedTime = (
  startedAtUtc: string,
  currentTime?: Date
) => {
  const now = currentTime || new Date();
  const startTime = parseUtcDate(startedAtUtc);
  
  const elapsedMs = now.getTime() - startTime.getTime();
  const totalMinutesElapsed = Math.floor(elapsedMs / (1000 * 60));
  const hours = Math.floor(totalMinutesElapsed / 60);
  const minutes = totalMinutesElapsed % 60;
  
  // Format time as HH:MM
  const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Create display text
  let formattedDisplay: string;
  if (hours > 0) {
    formattedDisplay = `${hours}h ${minutes}m elapsed`;
  } else {
    formattedDisplay = `${minutes}m elapsed`;
  }
  
  return {
    totalMinutes: totalMinutesElapsed,
    hours,
    minutes,
    formattedTime,
    formattedDisplay
  };
};

/**
 * Formats duration in minutes to human readable format
 * @param durationInMinutes - Duration in minutes
 * @returns Formatted duration string
 */
export const formatDuration = (durationInMinutes: number): string => {
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  
  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else {
    return `${minutes}m`;
  }
};

/**
 * Converts a UTC date string to datetime-local format (YYYY-MM-DDTHH:mm)
 * @param utcDateString - UTC date string from the backend
 * @returns Local datetime string in format suitable for datetime-local input
 */
export const utcToLocalDateTimeString = (utcDateString: string): string => {
  const utcDate = parseUtcDate(utcDateString);
  // Adjust for timezone offset to get local time
  const localDate = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
};

/**
 * Converts a datetime-local string to UTC ISO string
 * @param localDateTimeString - Local datetime string from datetime-local input (YYYY-MM-DDTHH:mm)
 * @returns UTC date string in ISO format
 */
export const localDateTimeStringToUtc = (localDateTimeString: string): string => {
  return new Date(localDateTimeString).toISOString();
};
