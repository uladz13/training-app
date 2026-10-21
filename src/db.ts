import Dexie, { type Table } from 'dexie';
import type { BodyEntry, DayTemplate, Exercise, Meta, Workout } from './types';
import { EXERCISES } from './data/exercises';
import { PROGRAM } from './data/program';
import { SEED_DURATION_SEC } from './data/seed';

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

/** Первичное наполнение новой установки: каталог упражнений и программа (без личных данных). */
export async function initDb(): Promise<void> {
  const seeded = await db.meta.get('seeded');
  if (seeded) return;
  await db.transaction('rw', db.exercises, db.templates, db.workouts, db.meta, async () => {
    await db.exercises.bulkPut(EXERCISES);
    await db.templates.bulkPut(PROGRAM);
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
