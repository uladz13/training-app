import type { DayTemplate } from '../types';

export const PROGRAM_START = '2026-09-14';

const NO_KNEE = 'Без прыжков, резких поворотов и боковых движений.';

// Недельный шаблон. Диапазоны повторений и отдых — из программы,
// состав упражнений и стартовые веса — по текущим рабочим весам.
export const PROGRAM: DayTemplate[] = [
  {
    day: 1,
    title: 'Спина + бицепс + корпус',
    warmup: '7–8 минут.',
    cooldown: '3–5 минут. Растяжка груди, плеч и широчайших мышц спины.',
    items: [
      { exerciseId: 'row-one-arm', sets: 3, min: 8, max: 12, restSec: 75, weight: 14.5 },
      { exerciseId: 'row-two-db', sets: 3, min: 10, max: 12, restSec: 90, weight: 12 },
      { exerciseId: 'reverse-fly', sets: 3, min: 12, max: 15, restSec: 60, weight: 6 },
      { exerciseId: 'biceps-curl', sets: 3, min: 8, max: 12, restSec: 75, weight: 12 },
      { exerciseId: 'hammer-curl', sets: 3, min: 8, max: 12, restSec: 60, weight: 12 },
      { exerciseId: 'plank', sets: 2, min: 30, max: 60, restSec: 45 }
    ]
  },
  {
    day: 2,
    title: 'Ноги + ягодицы + корпус',
    warmup: '7–8 минут. ' + NO_KNEE,
    cooldown:
      '3–5 минут. Лёгкая растяжка ягодиц, задней поверхности бедра и мышц таза. Без положений, вызывающих нестабильность колена.',
    items: [
      { exerciseId: 'rdl', sets: 3, min: 8, max: 12, restSec: 90, weight: 19.5 },
      { exerciseId: 'glute-bridge-bar', sets: 3, min: 10, max: 15, restSec: 75, weight: 36.5 },
      { exerciseId: 'glute-bridge-pause', sets: 2, min: 10, max: 10, restSec: 60, weight: 31.5 },
      { exerciseId: 'calf-raise', sets: 3, min: 12, max: 20, restSec: 60, weight: 19.5 },
      { exerciseId: 'dead-bug', sets: 3, min: 8, max: 12, restSec: 45 },
      { exerciseId: 'side-plank', sets: 2, min: 20, max: 40, restSec: 40 }
    ]
  },
  {
    day: 3,
    title: 'Грудь + плечи + трицепс',
    warmup: '7–8 минут. Особое внимание плечам, локтям и запястьям.',
    cooldown: '3–5 минут. Растяжка груди, передней части плеч и трицепса.',
    items: [
      { exerciseId: 'floor-press', sets: 3, min: 8, max: 12, restSec: 90, weight: 17 },
      { exerciseId: 'push-up', sets: 3, min: 10, max: 25, restSec: 75 },
      { exerciseId: 'ohp', sets: 3, min: 8, max: 12, restSec: 90, weight: 14.5 },
      { exerciseId: 'lateral-raise', sets: 3, min: 12, max: 15, restSec: 60, weight: 7.5 },
      { exerciseId: 'french-press-2db', sets: 3, min: 8, max: 12, restSec: 60, weight: 8.5 },
      { exerciseId: 'shoulder-taps', sets: 2, min: 10, max: 20, restSec: 50 }
    ]
  },
  {
    day: 4,
    title: 'Восстановление + мобильность',
    warmup: 'Лёгкая разминка 3–5 минут.',
    cooldown: 'Растяжки в этот день — отдельные упражнения в списке.',
    items: [
      { exerciseId: 'cat-cow', sets: 2, min: 8, max: 12, restSec: 30 },
      { exerciseId: 'bird-dog', sets: 2, min: 8, max: 10, restSec: 45 },
      { exerciseId: 'glute-bridge', sets: 2, min: 15, max: 15, restSec: 45 },
      { exerciseId: 'dead-bug', sets: 2, min: 10, max: 10, restSec: 45 },
      { exerciseId: 'side-plank', sets: 2, min: 20, max: 30, restSec: 30 },
      { exerciseId: 'stretch-chest', sets: 2, min: 30, max: 30, restSec: 15 },
      { exerciseId: 'stretch-shoulders', sets: 2, min: 30, max: 30, restSec: 15 },
      { exerciseId: 'stretch-hip-flexor', sets: 2, min: 20, max: 30, restSec: 15 },
      { exerciseId: 'stretch-general', sets: 1, min: 300, max: 600, restSec: 0 }
    ]
  },
  {
    day: 5,
    title: 'Комплексный силовой верх тела',
    warmup: '7–8 минут.',
    cooldown: '3–5 минут. Растяжка спины, груди и плеч.',
    items: [
      { exerciseId: 'row-two-db', sets: 4, min: 8, max: 10, restSec: 90, weight: 12 },
      { exerciseId: 'floor-press', sets: 4, min: 8, max: 10, restSec: 90, weight: 17 },
      { exerciseId: 'row-one-arm', sets: 3, min: 10, max: 10, restSec: 75, weight: 14.5 },
      { exerciseId: 'ohp', sets: 3, min: 8, max: 10, restSec: 90, weight: 14.5 },
      { exerciseId: 'reverse-fly', sets: 3, min: 12, max: 15, restSec: 60, weight: 6 },
      { exerciseId: 'biceps-curl', sets: 2, min: 10, max: 12, restSec: 60, weight: 12 },
      { exerciseId: 'plank', sets: 2, min: 45, max: 60, restSec: 45 }
    ]
  },
  {
    day: 6,
    title: 'Всё тело + корпус',
    warmup: '7 минут.',
    cooldown: '3–5 минут. Растяжка ягодиц, задней поверхности бедра, груди и плеч.',
    items: [
      { exerciseId: 'rdl', sets: 3, min: 10, max: 10, restSec: 90, weight: 19.5 },
      { exerciseId: 'glute-bridge-bar', sets: 3, min: 12, max: 12, restSec: 60, weight: 36.5 },
      { exerciseId: 'push-up', sets: 2, min: 12, max: 25, restSec: 60 },
      { exerciseId: 'row-two-db', sets: 3, min: 10, max: 10, restSec: 90, weight: 12 },
      { exerciseId: 'biceps-curl', sets: 2, min: 10, max: 12, restSec: 60, weight: 12 },
      { exerciseId: 'lateral-raise', sets: 2, min: 12, max: 15, restSec: 60, weight: 7.5 },
      { exerciseId: 'dead-bug', sets: 2, min: 10, max: 10, restSec: 45 },
      { exerciseId: 'side-plank', sets: 2, min: 30, max: 30, restSec: 40 }
    ]
  },
  {
    day: 7,
    title: 'Восстановление',
    warmup: 'Лёгкая разминка 3–5 минут.',
    cooldown: 'Растяжки в этот день — отдельные упражнения в списке.',
    items: [
      { exerciseId: 'cat-cow', sets: 2, min: 10, max: 10, restSec: 30 },
      { exerciseId: 'bird-dog', sets: 2, min: 10, max: 10, restSec: 45 },
      { exerciseId: 'glute-bridge', sets: 2, min: 15, max: 15, restSec: 45 },
      { exerciseId: 'dead-bug', sets: 2, min: 10, max: 10, restSec: 45 },
      { exerciseId: 'plank', sets: 2, min: 30, max: 45, restSec: 45 },
      { exerciseId: 'stretch-chest', sets: 2, min: 30, max: 30, restSec: 15 },
      { exerciseId: 'stretch-shoulders', sets: 2, min: 30, max: 30, restSec: 15 },
      { exerciseId: 'stretch-hamstring', sets: 2, min: 20, max: 30, restSec: 15 }
    ]
  }
];
