import type { BodyEntry } from './types';

/** Через сколько дней напоминать измерить талию. */
export const WAIST_REMINDER_DAYS = 7;

export function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 86400000);
}

/** Скользящее среднее веса за 7 календарных дней (включая день), по датам с записью веса. */
export function weightSeries(entries: BodyEntry[]): { date: string; weight: number; avg: number }[] {
  const ws = entries.filter((e) => e.weight != null).sort((a, b) => (a.date < b.date ? -1 : 1));
  return ws.map((e) => {
    const window = ws.filter((x) => x.date <= e.date && daysBetween(x.date, e.date) < 7);
    const avg = window.reduce((s, x) => s + x.weight!, 0) / window.length;
    return { date: e.date, weight: e.weight!, avg: Math.round(avg * 10) / 10 };
  });
}

export function lastWith(entries: BodyEntry[], key: 'weight' | 'waist', before?: string): BodyEntry | undefined {
  return entries
    .filter((e) => e[key] != null && (!before || e.date < before))
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

/** Пора ли напомнить про талию: последней записи нет или ей 7+ дней. */
export function waistDue(entries: BodyEntry[], today: string): boolean {
  const last = lastWith(entries, 'waist', today);
  const todayHas = entries.find((e) => e.date === today)?.waist != null;
  if (todayHas) return false;
  return !last || daysBetween(last.date, today) >= WAIST_REMINDER_DAYS;
}

export function fmt1(n: number | undefined): string {
  return n == null ? '—' : n.toFixed(1).replace('.', ',');
}
