import type { DayTemplate } from '../types';
import { programDays } from './programs';
import { PROGRAM } from './program';

const NO_KNEE = 'Без прыжков, резких поворотов и боковых движений.';

// Программа «Свой вес»: только пол, без выпадов и прыжков. Та же недельная схема, что с гантелями;
// дни восстановления (чт, вс) — как в программе с гантелями. Обоснование — TA-017.
const sameAs = (day: number) => {
  const d = PROGRAM.find((x) => x.day === day)!;
  return { day, title: d.title, warmup: d.warmup, cooldown: d.cooldown, items: d.items.map((i) => ({ ...i })) };
};

export const BODYWEIGHT_PROGRAM: DayTemplate[] = programDays('bodyweight', [
  {
    day: 1,
    title: 'Спина + бицепс + корпус (свой вес)',
    warmup: '7–8 минут. Плечи и грудной отдел позвоночника.',
    cooldown: '3–5 минут. Растяжка груди, плеч и широчайших мышц спины.',
    items: [
      { exerciseId: 'superman', sets: 3, min: 12, max: 15, restSec: 60 },
      { exerciseId: 'prone-ytw', sets: 3, min: 8, max: 10, restSec: 60 },
      { exerciseId: 'self-curl', sets: 3, min: 20, max: 30, restSec: 45 },
      { exerciseId: 'leg-raise', sets: 3, min: 10, max: 15, restSec: 60 },
      { exerciseId: 'plank', sets: 2, min: 60, max: 90, restSec: 45 }
    ]
  },
  {
    day: 2,
    title: 'Ноги + ягодицы + корпус (свой вес)',
    warmup: '7–8 минут. ' + NO_KNEE,
    cooldown:
      '3–5 минут. Лёгкая растяжка ягодиц, задней поверхности бедра и мышц таза. Без положений, вызывающих нестабильность колена.',
    items: [
      { exerciseId: 'squat', sets: 4, min: 15, max: 25, restSec: 75 },
      { exerciseId: 'glute-bridge-single', sets: 3, min: 10, max: 15, restSec: 60 },
      { exerciseId: 'donkey-kick', sets: 3, min: 12, max: 15, restSec: 45 },
      { exerciseId: 'calf-raise-single', sets: 3, min: 12, max: 20, restSec: 45 },
      { exerciseId: 'dead-bug', sets: 3, min: 10, max: 12, restSec: 45 },
      { exerciseId: 'side-plank', sets: 2, min: 30, max: 45, restSec: 40 }
    ]
  },
  {
    day: 3,
    title: 'Грудь + плечи + трицепс (свой вес)',
    warmup: '7–8 минут. Особое внимание плечам, локтям и запястьям.',
    cooldown: '3–5 минут. Растяжка груди, передней части плеч и трицепса.',
    items: [
      { exerciseId: 'push-up', sets: 4, min: 15, max: 30, restSec: 75 },
      { exerciseId: 'pike-push-up', sets: 3, min: 8, max: 12, restSec: 75 },
      { exerciseId: 'push-up-wide', sets: 3, min: 12, max: 20, restSec: 60 },
      { exerciseId: 'push-up-close', sets: 3, min: 10, max: 15, restSec: 60 },
      { exerciseId: 'floor-dip', sets: 3, min: 12, max: 20, restSec: 60 },
      { exerciseId: 'shoulder-taps', sets: 2, min: 20, max: 30, restSec: 50 }
    ]
  },
  sameAs(4),
  {
    day: 5,
    title: 'Комплексный верх тела (свой вес)',
    warmup: '7–8 минут.',
    cooldown: '3–5 минут. Растяжка спины, груди и плеч.',
    items: [
      { exerciseId: 'push-up', sets: 3, min: 15, max: 30, restSec: 75 },
      { exerciseId: 'superman', sets: 3, min: 12, max: 15, restSec: 60 },
      { exerciseId: 'pike-push-up', sets: 3, min: 8, max: 12, restSec: 75 },
      { exerciseId: 'prone-ytw', sets: 3, min: 8, max: 10, restSec: 60 },
      { exerciseId: 'push-up-close', sets: 2, min: 10, max: 15, restSec: 60 },
      { exerciseId: 'self-curl', sets: 2, min: 20, max: 30, restSec: 45 },
      { exerciseId: 'plank', sets: 2, min: 60, max: 90, restSec: 45 }
    ]
  },
  {
    day: 6,
    title: 'Всё тело + корпус (свой вес)',
    warmup: '7 минут. ' + NO_KNEE,
    cooldown: '3–5 минут. Растяжка ягодиц, задней поверхности бедра, груди и плеч.',
    items: [
      { exerciseId: 'squat', sets: 3, min: 15, max: 25, restSec: 75 },
      { exerciseId: 'glute-bridge-single', sets: 3, min: 10, max: 15, restSec: 60 },
      { exerciseId: 'push-up', sets: 2, min: 15, max: 30, restSec: 60 },
      { exerciseId: 'superman', sets: 3, min: 12, max: 15, restSec: 60 },
      { exerciseId: 'leg-raise', sets: 2, min: 10, max: 15, restSec: 60 },
      { exerciseId: 'dead-bug', sets: 2, min: 10, max: 12, restSec: 45 },
      { exerciseId: 'side-plank', sets: 2, min: 30, max: 45, restSec: 40 }
    ]
  },
  sameAs(7)
]);
