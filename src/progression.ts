import type { Exercise, WorkoutItem } from './types';
import { stepWeight } from './weights';
import { kg } from './util';

export interface Hint {
  tone: 'up' | 'hold' | 'alt' | 'info';
  text: string;
  /** предложенный вес одного снаряда и стартовые повторы */
  apply?: { w: number; reps: number };
}

/** Порог «большого шага» по весу — предложить альтернативу усложнения. */
const BIG_STEP = 0.2;

function value(s: WorkoutItem['sets'][number], ex: Exercise): number {
  return ex.perSide ? Math.min(s.l ?? 0, s.r ?? 0) : s.v ?? 0;
}

/**
 * Подсказка прогрессии по правилу «сначала повторения — потом вес».
 * prev — это же упражнение в прошлой тренировке того же дня недели.
 */
export function hintFor(prev: WorkoutItem | undefined, ex: Exercise): Hint | null {
  if (!prev || prev.sets.length === 0) return null;
  const { max, min } = prev.target;

  if (prev.sets.some((s) => !s.done)) {
    return { tone: 'hold', text: 'В прошлый раз не все подходы выполнены — повтори ту же нагрузку.' };
  }

  const allTop = prev.sets.every((s) => value(s, ex) >= max);

  if (ex.equipment === 'none') {
    if (!allTop) return null;
    return {
      tone: 'info',
      text:
        ex.kind === 'time'
          ? 'Все подходы на верхней границе времени. Можно добавить подход или усложнить вариант упражнения.'
          : 'Все подходы на верхней границе. Можно замедлить опускание до 2–3 с, сделать паузу или добавить подход.'
    };
  }

  const w = Math.max(...prev.sets.map((s) => s.w ?? 0));
  if (!allTop) {
    return { tone: 'hold', text: `Вес ${kg(w)} кг. Цель: +1 повторение хотя бы в одном подходе.` };
  }

  const next = stepWeight(ex.equipment, w, 1);
  const unit = ex.equipment === 'db2' ? `по ${kg(next)} кг` : `${kg(next)} кг`;
  if (next <= w) {
    return {
      tone: 'alt',
      text: `Все подходы на верхней границе, а ${kg(w)} кг — максимум из набора. Усложни иначе: опускание 2–3 с, пауза в трудной точке или +1 подход.`
    };
  }
  const pct = Math.round(((next - w) / w) * 100);
  if ((next - w) / w > BIG_STEP) {
    return {
      tone: 'alt',
      text: `Следующий вес — ${unit} (+${pct}%), это большой шаг. Можно сначала усложнить на текущем весе: опускание 2–3 с, пауза или +1 подход.`,
      apply: { w: next, reps: min }
    };
  }
  return {
    tone: 'up',
    text: `Все подходы на верхней границе — пора поднять вес: ${unit} (+${pct}%), повторения с ${min}.`,
    apply: { w: next, reps: min }
  };
}
