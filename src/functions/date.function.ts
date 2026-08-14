export const PERU_TIME_ZONE = 'America/Lima';
export const PERU_UTC_OFFSET = '-05:00';
export const PERU_UTC_OFFSET_MINUTES = -5 * 60;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DateValue = Date | string | number;
export type PeruDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hours: number;
  minutes: number;
  weekday: number;
};

export const getDate = (daysOffset: number): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date;
};

export const getDateTime = (daysOffset: number, hour: number, minute: number = 0): Date => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hour, minute, 0, 0);
  return date;
};

export function daysFromNow(days: number, hour = 10, minute = 0): Date {
  return getDateTime(days, hour, minute);
}

export function parseApiDate(value: DateValue): Date {
  if (value instanceof Date || typeof value === 'number') return new Date(value);

  const normalized = value.trim().replace(' ', 'T');
  const includesTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  return new Date(includesTimeZone ? normalized : `${normalized}Z`);
}

export function formatInPeru(
  value: DateValue,
  options: Intl.DateTimeFormatOptions,
  locale = 'es-PE',
): string {
  const date = parseDateInPeru(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat(locale, { ...options, timeZone: PERU_TIME_ZONE }).format(date);
}

export function formatToPartsInPeru(
  value: DateValue,
  options: Intl.DateTimeFormatOptions,
  locale = 'es-PE',
): Intl.DateTimeFormatPart[] {
  const date = parseDateInPeru(value);
  if (Number.isNaN(date.getTime())) return [];
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: PERU_TIME_ZONE }).formatToParts(date);
}

export function formatInUtc(
  value: DateValue,
  options: Intl.DateTimeFormatOptions,
  locale = 'es-PE',
): string {
  const date = parseApiDate(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
}

export function dateKeyInPeru(value: DateValue = new Date()): string {
  const date = parseDateInPeru(value);
  if (Number.isNaN(date.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: PERU_TIME_ZONE,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function monthKeyInPeru(value: DateValue = new Date()): string {
  return dateKeyInPeru(value).slice(0, 7);
}

export function dateTimePartsInPeru(value: DateValue = new Date()): PeruDateTimeParts {
  const parts = formatToPartsInPeru(value, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  }, 'en-US');
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    year: Number(part('year')),
    month: Number(part('month')),
    day: Number(part('day')),
    hours: Number(part('hour')),
    minutes: Number(part('minute')),
    weekday: weekdays.indexOf(part('weekday')),
  };
}

export function isValidDateOnly(value: string): boolean {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

export function peruDateOnlyToUtc(value: string, endOfDay = false): Date | null {
  if (!isValidDateOnly(value)) return null;
  const time = endOfDay ? '23:59:59.999' : '00:00:00.000';
  return new Date(`${value}T${time}${PERU_UTC_OFFSET}`);
}

export function parseDateInPeru(value: DateValue): Date {
  if (typeof value !== 'string' || !DATE_ONLY_PATTERN.test(value.trim())) return parseApiDate(value);
  return peruDateOnlyToUtc(value.trim()) ?? new Date(Number.NaN);
}

export function peruDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0,
): Date {
  const localAsUtc = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
  return new Date(localAsUtc - PERU_UTC_OFFSET_MINUTES * 60 * 1000);
}

export function peruDateTimeInputToUtc(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match || !isValidDateOnly(`${match[1]}-${match[2]}-${match[3]}`)) return null;

  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  if (hours > 23 || minutes > 59) return null;
  return new Date(`${value.trim()}:00.000${PERU_UTC_OFFSET}`);
}

export function timeInputInPeru(value: DateValue): string {
  const parts = formatToPartsInPeru(value, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }, 'en-US');
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
  return `${part('hour')}:${part('minute')}`;
}

export function addDaysToDateOnly(value: string, days: number): string {
  if (!isValidDateOnly(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function addMonthsToDateOnly(value: string, months: number): string {
  if (!isValidDateOnly(value)) return '';
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + months, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

export function peruMonthRange(value: DateValue = new Date()): { start: Date; end: Date } {
  const monthKey = monthKeyInPeru(value);
  const [year, month] = monthKey.split('-').map(Number);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const start = peruDateOnlyToUtc(`${year}-${String(month).padStart(2, '0')}-01`);
  const end = peruDateOnlyToUtc(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);

  if (!start || !end) throw new RangeError('No se pudo calcular el rango mensual de Perú');
  return { start, end };
}
