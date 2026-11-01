import type { DayTemplate, ProgramId, Workout } from '../types';

export const PROGRAM_IDS: ProgramId[] = ['dumbbell', 'bodyweight'];

export const PROGRAM_INFO: Record<ProgramId, { name: string; color: string }> = {
  dumbbell: { name: 'С гантелями', color: '#4fd1a5' },
  bodyweight: { name: 'Свой вес', color: '#7aa2ff' }
};

export const DEFAULT_PROGRAM: ProgramId = 'dumbbell';

/** Ключ дня программы в базе. */
export const dayId = (program: ProgramId, day: number) => `${program}:${day}`;

/** Программа тренировки; у тренировок до v5 поля нет — это «С гантелями». */
export const programOf = (w: Pick<Workout, 'program'>): ProgramId => w.program ?? DEFAULT_PROGRAM;

/** Шаблон дня из данных программы (без id и program) — в полный DayTemplate. */
export function programDays(program: ProgramId, days: Omit<DayTemplate, 'id' | 'program'>[]): DayTemplate[] {
  return days.map((d) => ({ ...d, id: dayId(program, d.day), program }));
}
