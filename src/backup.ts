import { addMissingExercises, db, SCHEMA_VERSION } from './db';
import { todayIso } from './util';
import type { DayTemplate, Workout } from './types';
import { BODYWEIGHT_PROGRAM } from './data/programBodyweight';
import { dayId } from './data/programs';

export interface BackupFile {
  app: 'training-app';
  schema: number;
  exportedAt: string;
  exercises: unknown[];
  /** до схемы 5: дни одной программы (ключ — день) */
  templates?: unknown[];
  /** с схемы 5: дни всех программ (ключ — «программа:день») */
  days?: unknown[];
  workouts: unknown[];
  body?: unknown[];
}

export async function exportBackup(): Promise<void> {
  const data: BackupFile = {
    app: 'training-app',
    schema: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    exercises: await db.exercises.toArray(),
    days: await db.days.toArray(),
    workouts: await db.workouts.toArray(),
    body: await db.body.toArray()
  };
  const blob = new Blob([JSON.stringify(data, null, 1)], { type: 'application/json' });
  const name = `training-backup-${todayIso()}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  const nav = navigator as Navigator & { canShare?: (d: unknown) => boolean };
  if (nav.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: name });
      await db.meta.put({ key: 'lastBackup', value: new Date().toISOString() });
      return;
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  await db.meta.put({ key: 'lastBackup', value: new Date().toISOString() });
}

export async function importBackup(file: File): Promise<number> {
  const data = JSON.parse(await file.text()) as BackupFile;
  if (data.app !== 'training-app' || !Array.isArray(data.workouts)) throw new Error('Это не файл бэкапа приложения');
  if (data.schema > SCHEMA_VERSION) throw new Error('Бэкап создан более новой версией приложения');
  // Схема ≤ 4: одна программа (templates) → «С гантелями», «Свой вес» — по умолчанию; тренировкам — признак программы.
  const days: DayTemplate[] = data.days
    ? (data.days as DayTemplate[])
    : [
        ...((data.templates ?? []) as Omit<DayTemplate, 'id' | 'program'>[]).map((t) => ({ ...t, id: dayId('dumbbell', t.day), program: 'dumbbell' as const })),
        ...BODYWEIGHT_PROGRAM
      ];
  const workouts = (data.workouts as Workout[]).map((w) => (w.program ? w : { ...w, program: 'dumbbell' as const }));
  await db.transaction('rw', [db.exercises, db.days, db.workouts, db.meta, db.body], async () => {
    await db.exercises.clear();
    await db.days.clear();
    await db.workouts.clear();
    await db.body.clear();
    await db.exercises.bulkPut(data.exercises as never[]);
    await addMissingExercises();
    await db.days.bulkPut(days);
    await db.workouts.bulkPut(workouts);
    await db.body.bulkPut((data.body ?? []) as never[]);
    await db.meta.put({ key: 'bodySeeded', value: 'import' });
    await db.meta.put({ key: 'seeded', value: 'import' });
  });
  return data.workouts.length;
}

export async function daysSinceBackup(): Promise<number | null> {
  const m = await db.meta.get('lastBackup');
  if (!m) return null;
  return Math.floor((Date.now() - new Date(m.value as string).getTime()) / 86400000);
}
