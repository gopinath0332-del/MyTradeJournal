export function formatToISODate(dateValue: string | undefined | null): string | null {
  if (!dateValue) return null;
  const d = new Date(dateValue);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0] || null;
}
