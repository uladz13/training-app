import Dexie, { type Table } from 'dexie';
import type { BodyEntry, DayTemplate, Exercise, Meta, Workout } from './types';
import { EXERCISES } from './data/exercises';
import { PROGRAM } from './data/program';
import { buildSeedWorkouts, SEED_DURATION_SEC, BODY_SEED } from './data/seed';

class AppDB extends Dexie {
  exercises!: Table<Exercise, string>;
  templates!: Table<DayTemplate, number>;
  workouts!: Table<Workout, number>;
  meta!: Table<Meta, string>;
  body!: Table<BodyEntry, string>;

  constructor() {
    super('training-app');
    this.version(1).stores({
      exercises: 'id, name',
      templates: 'day',
      workouts: '++id, date, day',
      meta: 'key'
    });
    // v2: длительность тренировки. Стартовой истории — 50 минут, остальным — 0, таймер на паузе.
    this.version(2)
      .stores({})
      .upgrade((tx) =>
        tx
          .table('workouts')
          .toCollection()
          .modify((w: Workout) => {
            if (w.durationSec == null) w.durationSec = w.note === 'Стартовые данные' ? SEED_DURATION_SEC : 0;
            if (w.runningSince === undefined) w.runningSince = null;
          })
      );
    // v3: замеры тела (вес, талия).
    this.version(3).stores({ body: 'date' });
  }
}

export const db = new AppDB();

export const SCHEMA_VERSION = 3;

/** Первичное наполнение: каталог, программа, стартовая история. */
export async function initDb(): Promise<void> {
  // Стартовые замеры 12–21.10.2026 — один раз, и для новых установок, и после обновления.
  if (!(await db.meta.get('bodySeeded'))) {
    await db.transaction('rw', db.body, db.meta, async () => {
      for (const e of BODY_SEED) if (!(await db.body.get(e.date))) await db.body.put(e);
      await db.meta.put({ key: 'bodySeeded', value: new Date().toISOString() });
    });
  }
  const seeded = await db.meta.get('seeded');
  if (seeded) return;
  await db.transaction('rw', db.exercises, db.templates, db.workouts, db.meta, async () => {
    await db.exercises.bulkPut(EXERCISES);
    await db.templates.bulkPut(PROGRAM);
    if ((await db.workouts.count()) === 0) {
      await db.workouts.bulkAdd(buildSeedWorkouts(EXERCISES));
    }
    await db.meta.put({ key: 'seeded', value: new Date().toISOString() });
  });
}

export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true;
    if (navigator.storage?.persist) return await navigator.storage.persist();
  } catch {
    /* ignore */
  }
  return false;
}
