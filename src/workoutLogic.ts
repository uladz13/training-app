import { db } from './db';
import type { Exercise, Workout, WorkoutItem, SetEntry, Target } from './types';
import { isoDay } from './data/seed';
import { uid } from './util';

/** Последняя тренировка того же дня недели строго до даты. */
async function lastSameDay(date: string, day: number): Promise<Workout | undefined> {
  const list = await db.workouts.where('day').equals(day).toArray();
  return list.filter((w) => w.date < date).sort((a, b) => (a.date < b.date ? 1 : -1))[0];
}

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

/** Создать тренировку: состав и цифры — с прошлого такого же дня недели, иначе из шаблона. */
export async function createWorkout(date: string, day = isoDay(date)): Promise<number> {
  const tpl = await db.templates.get(day);
  if (!tpl) throw new Error('Нет шаблона для дня ' + day);
  const prev = await lastSameDay(date, day);
  const exercises = new Map((await db.exercises.toArray()).map((e) => [e.id, e]));

  let items: WorkoutItem[];
  if (prev) {
    items = prev.items.map((it) => ({
      ...it,
      uid: uid(),
      done: false,
      sets: it.sets.map((s) => ({ ...s, done: false }))
    }));
  } else {
    items = tpl.items
      .filter((t) => exercises.has(t.exerciseId))
      .map((t) => itemFromTarget(exercises.get(t.exerciseId)!, t, t.restSec, t.weight));
  }

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
    durationSec: 0,
    runningSince: Date.now()
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
