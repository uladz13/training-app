import { db, SCHEMA_VERSION } from './db';
import { todayIso } from './util';

export interface BackupFile {
  app: 'training-app';
  schema: number;
  exportedAt: string;
  exercises: unknown[];
  templates: unknown[];
  workouts: unknown[];
}

export async function exportBackup(): Promise<void> {
  const data: BackupFile = {
    app: 'training-app',
    schema: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    exercises: await db.exercises.toArray(),
    templates: await db.templates.toArray(),
    workouts: await db.workouts.toArray()
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
  await db.transaction('rw', db.exercises, db.templates, db.workouts, db.meta, async () => {
    await db.exercises.clear();
    await db.templates.clear();
    await db.workouts.clear();
    await db.exercises.bulkPut(data.exercises as never[]);
    await db.templates.bulkPut(data.templates as never[]);
    await db.workouts.bulkPut(data.workouts as never[]);
    await db.meta.put({ key: 'seeded', value: 'import' });
  });
  return data.workouts.length;
}

export async function daysSinceBackup(): Promise<number | null> {
  const m = await db.meta.get('lastBackup');
  if (!m) return null;
  return Math.floor((Date.now() - new Date(m.value as string).getTime()) / 86400000);
}
