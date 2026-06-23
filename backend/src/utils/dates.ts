/** Helpers for the reservation business rules. */

export const HOUR_MS = 60 * 60 * 1000;

/** True if the date sits exactly on a full hour (minutes/seconds/ms = 0). */
export function isOnTheHour(d: Date): boolean {
  return d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
}

/** Hours from now until the given start time. */
export function hoursUntil(start: Date, now: Date = new Date()): number {
  return (start.getTime() - now.getTime()) / HOUR_MS;
}

/** Spec rule #6: athlete may cancel only when start is >= 12h away. */
export function canCancel(start: Date, now: Date = new Date()): boolean {
  return hoursUntil(start, now) >= 12;
}

/** Spec rule #7: confirm / no-show is allowed only up to 10 minutes after start. */
export function inCheckInWindow(start: Date, now: Date = new Date()): boolean {
  const diffMin = (now.getTime() - start.getTime()) / 60000;
  return diffMin >= 0 && diffMin <= 10;
}

/** Two [start,end) intervals overlap. */
export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}
