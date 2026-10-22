import { useEffect, useState } from 'preact/hooks';

const FIRST = 7;
const STEP = 20;

/** Сколько элементов списка показывать: сначала 7, «Показать ещё» добавляет по 20; смена resetKey — снова 7. */
export function useShowMore(resetKey: unknown): [number, () => void] {
  const [shown, setShown] = useState(FIRST);
  useEffect(() => setShown(FIRST), [resetKey]);
  return [shown, () => setShown((n) => n + STEP)];
}

/** Кнопка «Показать ещё (N)», где N — сколько добавится; не показывается, если всё уже видно. */
export function ShowMore({ shown, total, onMore }: { shown: number; total: number; onMore: () => void }) {
  if (total <= shown) return null;
  return (
    <button class="btn ghost wide" onClick={onMore}>
      Показать ещё ({Math.min(STEP, total - shown)})
    </button>
  );
}
