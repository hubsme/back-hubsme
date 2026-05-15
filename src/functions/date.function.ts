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
