import Dexie, { type Table } from 'dexie';
import type { BodyEntry, DayTemplate, Exercise, Meta, Workout } from './types';
import { EXERCISES } from './data/exercises';
import { PROGRAM } from './data/program';
import { BODYWEIGHT_PROGRAM } from './data/programBodyweight';
import { dayId } from './data/programs';
import { SEED_DURATION_SEC } from './data/seed';

class AppDB extends Dexie {
  exercises!: Table<Exercise, string>;
  /** до v5: шаблоны дней одной программы (ключ — день). С v5 не используется, данные не удаляются. */
  templates!: Table<Omit<DayTemplate, 'id' | 'program'>, number>;
  /** дни программ, ключ — `${program}:${day}` */
  days!: Table<DayTemplate, string>;
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
    // v4: необязательное поле exercises.icon (без индекса). Данные не меняются: нет поля — иконка по id.
    // Версия поднята, чтобы номер схемы базы совпадал с SCHEMA_VERSION бэкапа.
    this.version(4).stores({});
    // v5: несколько программ (TA-017). Дни — в новой таблице days («программа:день»): текущие шаблоны
    // переносятся в «С гантелями», добавляется «Свой вес»; тренировкам — признак программы;
    // недостающие встроенные упражнения добавляются. Таблица templates остаётся как есть.
    this.version(5)
      .stores({ days: 'id, program' })
      .upgrade(async (tx) => {
        const old = (await tx.table('templates').toArray()) as Omit<DayTemplate, 'id' | 'program'>[];
        await tx.table('days').bulkPut(old.map((t) => ({ ...t, id: dayId('dumbbell', t.day), program: 'dumbbell' })));
        await tx.table('days').bulkPut(BODYWEIGHT_PROGRAM);
        await tx.table('workouts').toCollection().modify((w: Workout) => {
          if (!w.program) w.program = 'dumbbell';
        });
        await addMissingExercises(tx.table('exercises'));
      });
  }
}

export const db = new AppDB();

export const SCHEMA_VERSION = 5;

/** Добавить встроенные упражнения, которых нет в базе (существующие не трогаются). */
export async function addMissingExercises(table: Table<Exercise, string> = db.exercises): Promise<void> {
  const have = new Set((await table.toArray()).map((e) => e.id));
  const missing = EXERCISES.filter((e) => !have.has(e.id));
  if (missing.length) await table.bulkAdd(missing);
}

/** Первичное наполнение новой установки: каталог упражнений и программы (без личных данных). */
export async function initDb(): Promise<void> {
  const seeded = await db.meta.get('seeded');
  if (seeded) return;
  await db.transaction('rw', db.exercises, db.days, db.workouts, db.meta, async () => {
    await db.exercises.bulkPut(EXERCISES);
    await db.days.bulkPut([...PROGRAM, ...BODYWEIGHT_PROGRAM]);
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
