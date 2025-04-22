import { format, parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

// Moscow timezone
const MOSCOW_TIMEZONE = 'Europe/Moscow';

// Format a date to Moscow time with hours and minutes
export const formatMoscowTime = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return formatInTimeZone(parseISO(dateString), MOSCOW_TIMEZONE, 'HH:mm');
  } catch (error) {
    console.error('Error formatting Moscow time:', error);
    return 'N/A';
  }
};

// Format a date to Moscow time with full date
export const formatMoscowFullDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return formatInTimeZone(parseISO(dateString), MOSCOW_TIMEZONE, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    console.error('Error formatting Moscow full date:', error);
    return 'N/A';
  }
};

// Format a date for display in the chat list
export const formatChatListDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    return formatInTimeZone(parseISO(dateString), MOSCOW_TIMEZONE, 'yyyy-MM-dd HH:mm');
  } catch (error) {
    console.error('Error formatting chat list date:', error);
    return 'N/A';
  }
};

// Format a date range for filters
export const formatDateRange = (startDate: Date | null, endDate: Date | null): string => {
  if (!startDate && !endDate) return 'All dates';
  if (startDate && !endDate) return `After ${format(startDate, 'yyyy-MM-dd')}`;
  if (!startDate && endDate) return `Before ${format(endDate, 'yyyy-MM-dd')}`;
  return `${format(startDate, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`;
};
