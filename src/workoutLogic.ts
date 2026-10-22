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
 * План тренировки на дату: список упражнений, цели и отдых — из шаблона дня,
 * цифры (вес, повторы, число подходов) — с прошлого раза этого упражнения:
 * сначала из прошлой тренировки того же дня недели, иначе из любой более ранней.
 */
export async function planItems(date: string, day: number): Promise<{ items: WorkoutItem[]; prevDate?: string }> {
  const tpl = await db.templates.get(day);
  if (!tpl) throw new Error('Нет шаблона для дня ' + day);
  const exercises = new Map((await db.exercises.toArray()).map((e) => [e.id, e]));
  const earlier = (await db.workouts.toArray()).filter((w) => w.date < date).sort((a, b) => (a.date < b.date ? 1 : -1));
  const prevSameDay = earlier.find((w) => w.day === day);

  const items = tpl.items
    .filter((t) => exercises.has(t.exerciseId))
    .map((t) => {
      const ex = exercises.get(t.exerciseId)!;
      const prevItem =
        prevSameDay?.items.find((i) => i.exerciseId === t.exerciseId) ??
        earlier.map((w) => w.items.find((i) => i.exerciseId === t.exerciseId)).find(Boolean);
      const target = { sets: t.sets, min: t.min, max: t.max };
      if (!prevItem || prevItem.sets.length === 0) return itemFromTarget(ex, target, t.restSec, t.weight);
      return {
        uid: uid(),
        exerciseId: ex.id,
        done: false,
        restSec: t.restSec,
        target,
        sets: prevItem.sets.map((s) => ({ ...s, done: false }))
      } as WorkoutItem;
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

/** Для нового упражнения: последние цифры этого упражнения из любой тренировки. */
export async function itemForExercise(ex: Exercise): Promise<WorkoutItem> {
  const all = await db.workouts.orderBy('date').reverse().toArray();
  for (const w of all) {
    const it = w.items.find((i) => i.exerciseId === ex.id);
    if (it) return { ...it, uid: uid(), done: false, sets: it.sets.map((s) => ({ ...s, done: false })) };
  }
  const base = ex.kind === 'time' ? { min: 30, max: 30 } : { min: 10, max: 12 };
  return itemFromTarget(ex, { sets: 3, ...base }, 60);
}
