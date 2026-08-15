export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dayKey(a) === dayKey(b);
}

export function isOverdue(due: number): boolean {
  return startOfDay(new Date(due)).getTime() < startOfDay(new Date()).getTime();
}

export function daysBetween(start: Date, end: Date): number {
  return Math.round(
    (startOfDay(end).getTime() - startOfDay(start).getTime()) / 86_400_000,
  );
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function dueLabel(due: number): string {
  const today = startOfDay(new Date());
  const target = startOfDay(new Date(due));
  const diff = daysBetween(today, target);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff < -1 && diff > -7) return `${Math.abs(diff)} days ago`;
  if (diff < 7 && diff > 1) return `In ${diff} days`;
  return target.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function rangeLabel(start: number, due: number): string {
  const from = new Date(start);
  const to = new Date(due);
  return `${from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${to.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
