/** weight — вес × повторы; reps — собственный вес, повторы; time — секунды */
export type ExerciseKind = 'weight' | 'reps' | 'time';
/** db1 — одна гантель, db2 — две гантели, barbell — штанга, none — без веса */
export type Equipment = 'db1' | 'db2' | 'barbell' | 'none';

export interface Exercise {
  id: string;
  name: string;
  kind: ExerciseKind;
  equipment: Equipment;
  /** выполняется на каждую сторону (Л/П) */
  perSide: boolean;
  technique: string;
  custom?: boolean;
}

export interface Target {
  sets: number;
  min: number;
  max: number;
}

export interface TemplateItem extends Target {
  exerciseId: string;
  restSec: number;
  /** стартовый вес одной гантели / штанги, кг */
  weight?: number;
}

export interface DayTemplate {
  /** 1 = понедельник … 7 = воскресенье */
  day: number;
  title: string;
  warmup: string;
  cooldown: string;
  items: TemplateItem[];
}

export interface SetEntry {
  /** вес одной гантели (для db2) или общий вес (db1, штанга), кг */
  w?: number;
  /** повторы или секунды, если упражнение не по сторонам */
  v?: number;
  /** левая сторона */
  l?: number;
  /** правая сторона */
  r?: number;
  done: boolean;
}

export interface WorkoutItem {
  uid: string;
  exerciseId: string;
  done: boolean;
  restSec: number;
  target: Target;
  sets: SetEntry[];
}

export interface Workout {
  id?: number;
  /** YYYY-MM-DD */
  date: string;
  day: number;
  title: string;
  warmup: string;
  cooldown: string;
  warmupDone: boolean;
  cooldownDone: boolean;
  items: WorkoutItem[];
  note: string;
  finished: boolean;
}

export interface Meta {
  key: string;
  value: unknown;
}
