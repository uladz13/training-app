import Dexie, { type Table } from 'dexie';
import type { DayTemplate, Exercise, Meta, Workout } from './types';
import { EXERCISES } from './data/exercises';
import { PROGRAM } from './data/program';
import { buildSeedWorkouts } from './data/seed';

class AppDB extends Dexie {
  exercises!: Table<Exercise, string>;
  templates!: Table<DayTemplate, number>;
  workouts!: Table<Workout, number>;
  meta!: Table<Meta, string>;

  constructor() {
    super('training-app');
    this.version(1).stores({
      exercises: 'id, name',
      templates: 'day',
      workouts: '++id, date, day',
      meta: 'key'
    });
  }
}

export const db = new AppDB();

export const SCHEMA_VERSION = 1;

/** Первичное наполнение: каталог, программа, стартовая история. */
export async function initDb(): Promise<void> {
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
