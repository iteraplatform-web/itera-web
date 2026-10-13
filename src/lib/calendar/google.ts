/** Opens Google Calendar with the reminder already filled in. No Google key is stored here. */

function stamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function googleCalendarUrl(input: {
  title: string;
  start: Date;
  details?: string;
  minutes?: number;
}): string {
  const end = new Date(input.start.getTime() + (input.minutes ?? 30) * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${stamp(input.start)}/${stamp(end)}`,
  });
  if (input.details?.trim()) params.set("details", input.details.trim());
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function openGoogleCalendar(input: {
  title: string;
  start: Date;
  details?: string;
}): void {
  window.open(googleCalendarUrl(input), "_blank", "noopener,noreferrer");
}
