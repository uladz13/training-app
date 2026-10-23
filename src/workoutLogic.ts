import { db } from './db';
import type { Exercise, Workout, WorkoutItem, SetEntry, Target } from './types';
import { isoDay } from './data/seed';
import { todayIso, uid } from './util';

export function emptySet(ex: Exercise, w?: number, value?: number): SetEntry {
  return {
    ...(ex.equipment !== 'none' ? { w: w ?? 0 } : {}),
    ...(ex.perSide ? { l: value ?? 0, r: value ?? 0 } : { v: value ?? 0 }),
    done: false
  };
}

export function itemFromTarget(ex: Exercise, target: Target, restSec: number, weight?: number): WorkoutItem {
  return {
    uid: uid(),
    exerciseId: ex.id,
    done: false,
    restSec,
    target,
    sets: Array.from({ length: target.sets }, () => emptySet(ex, weight, target.max))
  };
}

/**
 * Подходы новой записи упражнения:
 * число подходов и повторения/секунды — с этого упражнения в прошлый раз в тот же день программы (sameDay),
 * иначе из цели программы (подходы — цель, повторения и секунды — верх диапазона);
 * вес каждого подхода — с прошлого раза в любой день (last), по номеру подхода (лишние — как последний), иначе стартовый.
 */
export function prefillSets(ex: Exercise, target: Target, sameDay?: WorkoutItem, last?: WorkoutItem, startWeight?: number): SetEntry[] {
  const base = sameDay?.sets.length
    ? sameDay.sets.map((s) => ({ ...s, done: false }))
    : Array.from({ length: target.sets }, () => emptySet(ex, undefined, target.max));
  if (ex.equipment === 'none') return base;
  const lastSets = last?.sets ?? [];
  return base.map((s, i) => ({ ...s, w: (lastSets.length ? lastSets[Math.min(i, lastSets.length - 1)].w : undefined) ?? startWeight ?? 0 }));
}

/** Записи упражнения в более ранних тренировках (новые первыми): в тот же день программы и в любой день. */
function previousItems(earlier: Workout[], exerciseId: string, day: number) {
  const find = (w: Workout) => w.items.find((i) => i.exerciseId === exerciseId && i.sets.length > 0);
  return {
    sameDay: earlier.filter((w) => w.day === day).map(find).find(Boolean),
    last: earlier.map(find).find(Boolean)
  };
}

async function workoutsBefore(date: string): Promise<Workout[]> {
  return (await db.workouts.toArray()).filter((w) => w.date < date).sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * План тренировки на дату: список упражнений, цели и отдых — из шаблона дня; цифры — по `prefillSets`
 * (подходы и повторения — с того же дня программы, вес — с прошлого раза в любой день).
 */
export async function planItems(date: string, day: number): Promise<{ items: WorkoutItem[]; prevDate?: string }> {
  const tpl = await db.templates.get(day);
  if (!tpl) throw new Error('Нет шаблона для дня ' + day);
  const exercises = new Map((await db.exercises.toArray()).map((e) => [e.id, e]));
  const earlier = await workoutsBefore(date);
  const prevSameDay = earlier.find((w) => w.day === day);

  const items = tpl.items
    .filter((t) => exercises.has(t.exerciseId))
    .map((t): WorkoutItem => {
      const ex = exercises.get(t.exerciseId)!;
      const { sameDay, last } = previousItems(earlier, ex.id, day);
      const target = { sets: t.sets, min: t.min, max: t.max };
      return { uid: uid(), exerciseId: ex.id, done: false, restSec: t.restSec, target, sets: prefillSets(ex, target, sameDay, last, t.weight) };
    });
  return { items, prevDate: prevSameDay?.date };
}

/** Старт таймера длительности: для прошедшей даты таймер не запускается — длительность вводится вручную. */
export function clockStart(date: string): number | null {
  return date < todayIso() ? null : Date.now();
}

/** Длительность по умолчанию для тренировки, добавленной на прошедшую дату. */
export const PAST_DURATION_MIN = 50;

/** Создать тренировку по плану на дату; для прошедшей даты — с длительностью (по умолчанию 50 мин) и без таймера. */
export async function createWorkout(date: string, day = isoDay(date), pastDurationMin = PAST_DURATION_MIN): Promise<number> {
  const tpl = await db.templates.get(day);
  if (!tpl) throw new Error('Нет шаблона для дня ' + day);
  const { items } = await planItems(date, day);
  const w: Workout = {
    date,
    day,
    title: tpl.title,
    warmup: tpl.warmup,
    cooldown: tpl.cooldown,
    warmupDone: false,
    cooldownDone: false,
    items,
    note: '',
    finished: false,
    durationSec: date < todayIso() ? Math.max(0, Math.round(pastDurationMin)) * 60 : 0,
    runningSince: clockStart(date)
  };
  return db.workouts.add(w);
}

/** Упражнение, добавленное в тренировку вручную: цифры — по тем же правилам, что и в плане (`prefillSets`). */
export async function itemForExercise(ex: Exercise, date: string, day: number): Promise<WorkoutItem> {
  const { sameDay, last } = previousItems(await workoutsBefore(date), ex.id, day);
  const src = sameDay ?? last;
  if (!src) {
    const base = ex.kind === 'time' ? { min: 30, max: 30 } : { min: 10, max: 12 };
    return itemFromTarget(ex, { sets: 3, ...base }, 60);
  }
  // Цель и отдых — с той же записи, что и подходы (тот же день), иначе с прошлого раза.
  return { uid: uid(), exerciseId: ex.id, done: false, restSec: src.restSec, target: src.target, sets: prefillSets(ex, src.target, sameDay, last) };
}
