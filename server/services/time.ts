export const DEFAULT_TIMEZONE = "America/Los_Angeles";

export function resolveTimeZone(timeZone?: string | null): string {
  if (!timeZone) return DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return timeZone;
  } catch (error) {
    console.warn(
      `[Time] Invalid timezone "${timeZone}" provided, falling back to ${DEFAULT_TIMEZONE}`,
      error,
    );
    return DEFAULT_TIMEZONE;
  }
}

export function formatInTimeZone(
  date: Date,
  timeZone?: string | null,
): string {
  const resolvedTimeZone = resolveTimeZone(timeZone);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: resolvedTimeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const parts = formatter.formatToParts(date);
    const lookup = parts.reduce<Record<string, string>>((acc, part) => {
      if (part.type !== "literal") {
        acc[part.type] = part.value;
      }
      return acc;
    }, {});

    const dayPeriod = lookup.dayPeriod ? ` ${lookup.dayPeriod}` : "";

    return `${lookup.year}-${lookup.month}-${lookup.day} ${lookup.hour}:${lookup.minute}:${lookup.second}${dayPeriod}`.trim();
  } catch (error) {
    console.warn(
      `[Time] Failed to format date with timezone ${resolvedTimeZone}, falling back to ISO`,
      error,
    );
    return date.toISOString();
  }
}