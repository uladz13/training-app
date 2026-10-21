import type { Exercise, Workout, WorkoutItem } from '../types';
import { PROGRAM } from './program';

type Row = [exerciseId: string, weight: number | null, values: number[]];

// Текущие рабочие веса (переданы пользователем 21.10.2026).
// Пишутся как прошедшие тренировки 12–21 октября 2026.
const BY_DAY: Record<number, Row[]> = {
  1: [
    ['row-one-arm', 14.5, [12, 12, 12]],
    ['row-two-db', 12, [12, 12, 12]],
    ['reverse-fly', 6, [15, 15, 12]],
    ['biceps-curl', 12, [12, 10, 8]],
    ['hammer-curl', 12, [12, 10, 8]],
    ['plank', null, [60, 60]]
  ],
  2: [
    ['rdl', 19.5, [12, 12, 12]],
    ['glute-bridge-bar', 36.5, [15, 15, 15]],
    ['glute-bridge-pause', 31.5, [10, 10]],
    ['calf-raise', 19.5, [20, 20, 20]],
    ['dead-bug', null, [12, 12, 12]],
    ['side-plank', null, [40, 30]]
  ],
  3: [
    ['floor-press', 17, [12, 12, 12]],
    ['push-up', null, [25, 20, 15]],
    ['ohp', 14.5, [10, 10, 10]],
    ['lateral-raise', 7.5, [15, 15, 12]],
    ['french-press-2db', 8.5, [12, 10, 8]],
    ['shoulder-taps', null, [20, 20]]
  ],
  4: [
    ['cat-cow', null, [12, 12]],
    ['bird-dog', null, [10, 10]],
    ['glute-bridge', null, [15, 15]],
    ['dead-bug', null, [10, 10]],
    ['side-plank', null, [30, 30]],
    ['stretch-chest', null, [30, 30]],
    ['stretch-shoulders', null, [30, 30]],
    ['stretch-hip-flexor', null, [30, 30]],
    ['stretch-general', null, [300]]
  ],
  5: [
    ['row-two-db', 12, [10, 10, 10, 10]],
    ['floor-press', 17, [10, 10, 10, 10]],
    ['row-one-arm', 14.5, [10, 10, 10]],
    ['ohp', 14.5, [10, 10, 10]],
    ['reverse-fly', 6, [15, 12, 10]],
    ['biceps-curl', 12, [12, 10]],
    ['plank', null, [60, 60]]
  ],
  6: [
    ['rdl', 19.5, [10, 10, 10]],
    ['glute-bridge-bar', 36.5, [12, 12, 12]],
    ['push-up', null, [25, 25]],
    ['row-two-db', 12, [10, 10, 10]],
    ['biceps-curl', 12, [12, 12]],
    ['lateral-raise', 7.5, [15, 15]],
    ['dead-bug', null, [10, 10]],
    ['side-plank', null, [30, 30]]
  ],
  7: [
    ['cat-cow', null, [10, 10]],
    ['bird-dog', null, [10, 10]],
    ['glute-bridge', null, [15, 15]],
    ['dead-bug', null, [10, 10]],
    ['plank', null, [45, 45]],
    ['stretch-chest', null, [30, 30]],
    ['stretch-shoulders', null, [30, 30]],
    ['stretch-hamstring', null, [30, 30]]
  ]
};

/** Стартовые замеры тела (переданы пользователем 21.10.2026). */
export const BODY_SEED: { date: string; weight: number; waist: number }[] = [
  { date: '2026-10-12', weight: 80.9, waist: 84 },
  { date: '2026-10-13', weight: 81.3, waist: 84 },
  { date: '2026-10-14', weight: 80.6, waist: 84 },
  { date: '2026-10-15', weight: 81.5, waist: 84 },
  { date: '2026-10-16', weight: 81.5, waist: 85 },
  { date: '2026-10-17', weight: 81.9, waist: 85 },
  { date: '2026-10-18', weight: 81.9, waist: 85 },
  { date: '2026-10-19', weight: 82.0, waist: 86 },
  { date: '2026-10-20', weight: 82.3, waist: 86 },
  { date: '2026-10-21', weight: 82.3, waist: 86 }
];

/** Длительность каждой тренировки стартовой истории — 50 минут. */
export const SEED_DURATION_SEC = 50 * 60;

const SEED_DATES = [
  '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15', '2026-10-16',
  '2026-10-17', '2026-10-18', '2026-10-19', '2026-10-20', '2026-10-21'
];

export function buildSeedWorkouts(exercises: Exercise[]): Workout[] {
  const byId = new Map(exercises.map((e) => [e.id, e]));
  return SEED_DATES.map((date) => {
    const day = isoDay(date);
    const tpl = PROGRAM.find((t) => t.day === day)!;
    const items: WorkoutItem[] = BY_DAY[day].map(([exerciseId, w, values], i) => {
      const ex = byId.get(exerciseId)!;
      const ti = tpl.items.find((t) => t.exerciseId === exerciseId);
      return {
        uid: `${date}-${i}`,
        exerciseId,
        done: true,
        restSec: ti?.restSec ?? 60,
        target: { sets: ti?.sets ?? values.length, min: ti?.min ?? values[0], max: ti?.max ?? values[0] },
        sets: values.map((v) => ({
          ...(w != null ? { w } : {}),
          ...(ex.perSide ? { l: v, r: v } : { v }),
          done: true
        }))
      };
    });
    return {
      date,
      day,
      title: tpl.title,
      warmup: tpl.warmup,
      cooldown: tpl.cooldown,
      warmupDone: true,
      cooldownDone: true,
      items,
      note: 'Стартовые данные',
      finished: true,
      durationSec: SEED_DURATION_SEC,
      runningSince: null
    };
  });
}

/** 1 = понедельник … 7 = воскресенье */
export function isoDay(date: string): number {
  const d = new Date(date + 'T12:00:00');
  return ((d.getDay() + 6) % 7) + 1;
}
