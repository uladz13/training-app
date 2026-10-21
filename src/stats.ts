import type { Exercise, Workout, WorkoutItem } from './types';

/**
 * Объём (тоннаж) — сумма «вес × повторения» по выполненным подходам, как в Strong/Hevy/Jefit.
 * Пара гантелей считается двумя снарядами (вес × 2), упражнение на сторону — повторы обеих сторон.
 * Упражнения без веса и на время в объём не входят.
 */
export function itemVolume(item: WorkoutItem, ex: Exercise | undefined): number {
  if (!ex || ex.equipment === 'none' || ex.kind === 'time') return 0;
  const factor = ex.equipment === 'db2' ? 2 : 1;
  return item.sets
    .filter((s) => s.done)
    .reduce((sum, s) => sum + (s.w ?? 0) * factor * (ex.perSide ? (s.l ?? 0) + (s.r ?? 0) : s.v ?? 0), 0);
}

export function workoutVolume(w: Workout, byId: Map<string, Exercise>): number {
  return w.items.reduce((sum, it) => sum + itemVolume(it, byId.get(it.exerciseId)), 0);
}

export function elapsedSec(w: Workout, now = Date.now()): number {
  const base = w.durationSec ?? 0;
  return w.runningSince ? base + Math.max(0, Math.floor((now - w.runningSince) / 1000)) : base;
}

export function formatDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}

export function durationShort(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} мин`;
  return `${Math.floor(m / 60)} ч ${m % 60} мин`;
}

export function formatVolume(kgTotal: number): string {
  return Math.round(kgTotal).toLocaleString('ru-RU') + ' кг';
}
