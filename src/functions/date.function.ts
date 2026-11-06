import { TraceNode } from '@erixcel/traceflow';

export class DateFunction {
  static readonly PERU_TIME_ZONE = 'America/Lima';

  static readonly PERU_UTC_OFFSET = '-05:00';

  static readonly PERU_UTC_OFFSET_MINUTES = -5 * 60;

  static readonly DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

  @TraceNode({ name: 'date.getDate', type: 'method' })
  static getDate(daysOffset: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date;
  }

  @TraceNode({ name: 'date.getDateTime', type: 'method' })
  static getDateTime(daysOffset: number, hour: number, minute: number = 0): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(hour, minute, 0, 0);
    return date;
  }

  @TraceNode({ name: 'date.daysFromNow', type: 'method' })
  static daysFromNow(days: number, hour = 10, minute = 0): Date {
    return DateFunction.getDateTime(days, hour, minute);
  }

  @TraceNode({ name: 'date.parseApiDate', type: 'method' })
  static parseApiDate(value: Date | string | number): Date {
    if (value instanceof Date || typeof value === 'number') return new Date(value);

    const normalized = value.trim().replace(' ', 'T');
    const includesTimeZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
    return new Date(includesTimeZone ? normalized : `${normalized}Z`);
  }

  @TraceNode({ name: 'date.formatInPeru', type: 'method' })
  static formatInPeru(value: Date | string | number, options: Intl.DateTimeFormatOptions, locale = 'es-PE'): string {
    const date = DateFunction.parseDateInPeru(value);
    if (Number.isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat(locale, { ...options, timeZone: DateFunction.PERU_TIME_ZONE }).format(date);
  }

  @TraceNode({ name: 'date.formatToPartsInPeru', type: 'method' })
  static formatToPartsInPeru(
    value: Date | string | number,
    options: Intl.DateTimeFormatOptions,
    locale = 'es-PE',
  ): Intl.DateTimeFormatPart[] {
    const date = DateFunction.parseDateInPeru(value);
    if (Number.isNaN(date.getTime())) return [];
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: DateFunction.PERU_TIME_ZONE }).formatToParts(date);
  }

  @TraceNode({ name: 'date.formatInUtc', type: 'method' })
  static formatInUtc(value: Date | string | number, options: Intl.DateTimeFormatOptions, locale = 'es-PE'): string {
    const date = DateFunction.parseApiDate(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(date);
  }

  @TraceNode({ name: 'date.dateKeyInPeru', type: 'method' })
  static dateKeyInPeru(value: Date | string | number = new Date()): string {
    const date = DateFunction.parseDateInPeru(value);
    if (Number.isNaN(date.getTime())) return '';

    const parts = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: DateFunction.PERU_TIME_ZONE,
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  @TraceNode({ name: 'date.monthKeyInPeru', type: 'method' })
  static monthKeyInPeru(value: Date | string | number = new Date()): string {
    return DateFunction.dateKeyInPeru(value).slice(0, 7);
  }

  @TraceNode({ name: 'date.dateTimePartsInPeru', type: 'method' })
  static dateTimePartsInPeru(value: Date | string | number = new Date()): {
    year: number;
    month: number;
    day: number;
    hours: number;
    minutes: number;
    weekday: number;
  } {
    const parts = DateFunction.formatToPartsInPeru(
      value,
      {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        weekday: 'short',
        hourCycle: 'h23',
      },
      'en-US',
    );
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

  @TraceNode({ name: 'date.isValidDateOnly', type: 'method' })
  static isValidDateOnly(value: string): boolean {
    const match = DateFunction.DATE_ONLY_PATTERN.exec(value);
    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
  }

  @TraceNode({ name: 'date.peruDateOnlyToUtc', type: 'method' })
  static peruDateOnlyToUtc(value: string, endOfDay = false): Date | null {
    if (!DateFunction.isValidDateOnly(value)) return null;
    const time = endOfDay ? '23:59:59.999' : '00:00:00.000';
    return new Date(`${value}T${time}${DateFunction.PERU_UTC_OFFSET}`);
  }

  @TraceNode({ name: 'date.parseDateInPeru', type: 'method' })
  static parseDateInPeru(value: Date | string | number): Date {
    if (typeof value !== 'string' || !DateFunction.DATE_ONLY_PATTERN.test(value.trim()))
      return DateFunction.parseApiDate(value);
    return DateFunction.peruDateOnlyToUtc(value.trim()) ?? new Date(Number.NaN);
  }

  @TraceNode({ name: 'date.peruDateTimeToUtc', type: 'method' })
  static peruDateTimeToUtc(year: number, month: number, day: number, hours = 0, minutes = 0): Date {
    const localAsUtc = Date.UTC(year, month - 1, day, hours, minutes, 0, 0);
    return new Date(localAsUtc - DateFunction.PERU_UTC_OFFSET_MINUTES * 60 * 1000);
  }

  @TraceNode({ name: 'date.peruDateTimeInputToUtc', type: 'method' })
  static peruDateTimeInputToUtc(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim());
    if (!match || !DateFunction.isValidDateOnly(`${match[1]}-${match[2]}-${match[3]}`)) return null;

    const hours = Number(match[4]);
    const minutes = Number(match[5]);
    if (hours > 23 || minutes > 59) return null;
    return new Date(`${value.trim()}:00.000${DateFunction.PERU_UTC_OFFSET}`);
  }

  @TraceNode({ name: 'date.timeInputInPeru', type: 'method' })
  static timeInputInPeru(value: Date | string | number): string {
    const parts = DateFunction.formatToPartsInPeru(
      value,
      {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      },
      'en-US',
    );
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
    return `${part('hour')}:${part('minute')}`;
  }

  @TraceNode({ name: 'date.addDaysToDateOnly', type: 'method' })
  static addDaysToDateOnly(value: string, days: number): string {
    if (!DateFunction.isValidDateOnly(value)) return '';
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day + days));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  @TraceNode({ name: 'date.addMonthsToDateOnly', type: 'method' })
  static addMonthsToDateOnly(value: string, months: number): string {
    if (!DateFunction.isValidDateOnly(value)) return '';
    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1 + months, 1));
    const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    date.setUTCDate(Math.min(day, lastDay));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
  }

  @TraceNode({ name: 'date.peruMonthRange', type: 'method' })
  static peruMonthRange(value: Date | string | number = new Date()): { start: Date; end: Date } {
    const monthKey = DateFunction.monthKeyInPeru(value);
    const [year, month] = monthKey.split('-').map(Number);
    const nextYear = month === 12 ? year + 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const start = DateFunction.peruDateOnlyToUtc(`${year}-${String(month).padStart(2, '0')}-01`);
    const end = DateFunction.peruDateOnlyToUtc(`${nextYear}-${String(nextMonth).padStart(2, '0')}-01`);

    if (!start || !end) throw new RangeError('No se pudo calcular el rango mensual de Perú');
    return { start, end };
  }
}
