/**
 * API timestamps without a timezone suffix are UTC. Convert them to Date
 * objects before formatting so the browser displays the computer's local time.
 */
export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const trimmed = value.trim();
  if (!trimmed) return "—";
  // A date-only value is a calendar date, so don't append a UTC timezone.
  const hasTime = /[T ]\d{2}:\d{2}/.test(trimmed);
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  const normalized = hasTime && !hasZone ? `${trimmed.replace(" ", "T")}Z` : trimmed;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}
