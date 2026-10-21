import type { Equipment } from './types';

/** Набор блинов (гриф гантели и штанги пластиковый — 0 кг). */
export const PLATES: { kg: number; count: number }[] = [
  { kg: 3, count: 8 },
  { kg: 2.5, count: 4 },
  { kg: 1.25, count: 4 }
];

/** Все симметричные варианты сборки для заданного числа снарядов. */
function combos(implements_: number): number[] {
  // На каждую сторону каждого снаряда доступно count / (2 * implements_) блинов.
  const perSide = PLATES.map((p) => ({ kg: p.kg, max: Math.floor(p.count / (2 * implements_)) }));
  const out = new Set<number>([0]);
  const rec = (i: number, side: number) => {
    if (i === perSide.length) {
      out.add(Math.round(side * 2 * 100) / 100);
      return;
    }
    for (let n = 0; n <= perSide[i].max; n++) rec(i + 1, side + n * perSide[i].kg);
  };
  rec(0, 0);
  return [...out].sort((a, b) => a - b);
}

const TWO = combos(2);
const ONE = combos(1);

/** Доступные веса одного снаряда для типа инвентаря. */
export function availableWeights(eq: Equipment): number[] {
  if (eq === 'db2') return TWO;
  if (eq === 'db1' || eq === 'barbell') return ONE;
  return [0];
}

export function stepWeight(eq: Equipment, current: number | undefined, dir: 1 | -1): number {
  const list = availableWeights(eq);
  const cur = current ?? 0;
  if (dir > 0) return list.find((w) => w > cur + 1e-9) ?? list[list.length - 1];
  for (let i = list.length - 1; i >= 0; i--) if (list[i] < cur - 1e-9) return list[i];
  return list[0];
}

/** Раскладка блинов на одну сторону снаряда (от тяжёлых к лёгким) или null, если вес не собирается. */
export function layoutFor(eq: Equipment, total: number): number[] | null {
  if (eq === 'none') return null;
  const implements_ = eq === 'db2' ? 2 : 1;
  const target = Math.round((total / 2) * 100);
  const perSide = PLATES.map((p) => ({ kg: p.kg, c: Math.round(p.kg * 100), max: Math.floor(p.count / (2 * implements_)) }));
  let best: number[] | null = null;
  const rec = (i: number, sum: number, acc: number[]) => {
    if (sum > target) return;
    if (i === perSide.length) {
      if (sum === target && (!best || acc.length < best.length)) best = [...acc];
      return;
    }
    for (let n = perSide[i].max; n >= 0; n--) {
      rec(i + 1, sum + n * perSide[i].c, [...acc, ...Array(n).fill(perSide[i].kg)]);
    }
  };
  rec(0, 0, []);
  return best;
}

export function layoutLabel(eq: Equipment, total: number): string {
  const l = layoutFor(eq, total);
  if (!l) return 'не собирается симметрично';
  if (l.length === 0) return 'без блинов';
  return l.map((x) => String(x).replace('.', ',')).join(' + ') + ' с каждой стороны';
}
