export function formatToISODate(dateValue: string | undefined | null): string | null {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return null;
  // Use local date parts instead of toISOString() to avoid UTC timezone shift.
  // For IST (+5:30), toISOString() on a local midnight date returns the
  // previous day in UTC, causing a 1-day offset on the calendar.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
