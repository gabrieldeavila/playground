const NEW_YORK_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  hourCycle: "h23",
});

/** Latest weekday (YYYY-MM-DD) whose US session has closed; ignores holidays. */
export const lastClosedSession = (now = new Date()) => {
  const parts = Object.fromEntries(
    NEW_YORK_PARTS.formatToParts(now).map((part) => [part.type, part.value]),
  );
  const day = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day));
  // Yahoo publishes the daily candle shortly after the 16:00 ET close.
  if (+parts.hour < 17) day.setUTCDate(day.getUTCDate() - 1);
  while (day.getUTCDay() === 0 || day.getUTCDay() === 6)
    day.setUTCDate(day.getUTCDate() - 1);
  return day.toISOString().slice(0, 10);
};
