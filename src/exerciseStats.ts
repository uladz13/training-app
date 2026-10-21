import type { Exercise, Workout, SetEntry } from './types';
import { itemVolume } from './stats';

/**
 * Метрики прогресса по упражнению — как в Hevy/Strong, без расчётного 1ПМ:
 * у нас диапазоны 8–20 повторов (формулы 1ПМ неточны выше 12), а вес упирается в набор блинов,
 * поэтому рост виден по весу, объёму и повторам.
 */
export type Metric = 'weight' | 'volume' | 'reps' | 'best';

export const METRICS: Record<Exercise['kind'], { key: Metric; label: string }[]> = {
  weight: [
    { key: 'weight', label: 'Макс. вес' },
    { key: 'volume', label: 'Объём' },
    { key: 'reps', label: 'Повторы' }
  ],
  reps: [
    { key: 'best', label: 'Лучший подход' },
    { key: 'reps', label: 'Повторы за тренировку' }
  ],
  time: [{ key: 'best', label: 'Лучшее время' }]
};

export interface Session {
  date: string;
  workoutId?: number;
  sets: SetEntry[];
}

/** Выполненные подходы упражнения по датам (несколько записей за день объединяются). */
export function sessionsFor(exerciseId: string, workouts: Workout[]): Session[] {
  const byDate = new Map<string, Session>();
  for (const w of workouts) {
    for (const it of w.items) {
      if (it.exerciseId !== exerciseId) continue;
      const done = it.sets.filter((s) => s.done);
      if (!done.length) continue;
      const cur = byDate.get(w.date) ?? { date: w.date, workoutId: w.id, sets: [] };
      cur.sets.push(...done);
      byDate.set(w.date, cur);
    }
  }
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

const repsOf = (s: SetEntry, ex: Exercise) => (ex.perSide ? Math.min(s.l ?? 0, s.r ?? 0) : s.v ?? 0);
const totalReps = (s: SetEntry, ex: Exercise) => (ex.perSide ? (s.l ?? 0) + (s.r ?? 0) : s.v ?? 0);

export function metricValue(sess: Session, ex: Exercise, m: Metric): { value: number; note: string } {
  switch (m) {
    case 'weight': {
      const w = Math.max(...sess.sets.map((s) => s.w ?? 0));
      const reps = Math.max(...sess.sets.filter((s) => (s.w ?? 0) === w).map((s) => repsOf(s, ex)));
      return { value: w, note: `${reps} повт.` + (ex.perSide ? ' на сторону' : '') };
    }
    case 'volume':
      return { value: itemVolume({ uid: '', exerciseId: ex.id, done: true, restSec: 0, target: { sets: 0, min: 0, max: 0 }, sets: sess.sets }, ex), note: `${sess.sets.length} подх.` };
    case 'reps':
      return { value: sess.sets.reduce((a, s) => a + totalReps(s, ex), 0), note: `${sess.sets.length} подх.` };
    case 'best':
      return { value: Math.max(...sess.sets.map((s) => repsOf(s, ex))), note: ex.perSide ? 'на сторону' : '' };
  }
}

export function metricUnit(ex: Exercise, m: Metric): { unit: string; decimals: number } {
  if (m === 'weight') return { unit: ex.equipment === 'db2' ? 'кг (одна гантель)' : 'кг', decimals: 1 };
  if (m === 'volume') return { unit: 'кг', decimals: 0 };
  if (ex.kind === 'time') return { unit: 'с', decimals: 0 };
  return { unit: 'повт.', decimals: 0 };
}

/** Понедельник недели даты (YYYY-MM-DD). */
export function weekStart(date: string): string {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function shiftDate(date: string, days: number): string {
  const d = new Date(date + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
