import { useEffect, useRef, useState } from 'preact/hooks';

export interface Bar {
  key: string;
  label: string;
  value: number;
  note?: string;
}

const H = 170;
const PAD = { l: 44, r: 6, t: 10, b: 24 };

function niceStep(max: number): number {
  const raw = max / 4;
  const p = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  return [1, 2, 2.5, 5, 10].map((m) => m * p).find((s) => s >= raw) ?? raw;
}

/** Столбики (например, объём по неделям); касание показывает значение. */
export function BarChart({ bars, format, title }: { bars: Bar[]; format: (v: number) => string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(340);
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    setW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  if (!bars.length) return <div class="empty small">За выбранный период тренировок нет.</div>;
  const max = Math.max(...bars.map((b) => b.value), 1);
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const iw = w - PAD.l - PAD.r;
  const slot = iw / bars.length;
  const bw = Math.max(4, Math.min(36, slot - 4));
  const Y = (v: number) => PAD.t + (1 - v / top) * (H - PAD.t - PAD.b);
  // По умолчанию выбрана последняя неделя с тренировками.
  let lastFilled = bars.length - 1;
  while (lastFilled > 0 && bars[lastFilled].value === 0) lastFilled--;
  const idx = sel ?? lastFilled;
  const cur = bars[idx];
  const labelEvery = Math.ceil(bars.length / 6);

  return (
    <div class="chart" ref={box} aria-label={title}>
      <div class="chart-readout">
        <span class="muted small">{cur.label}</span>
        <span>
          <strong>{format(cur.value)}</strong>
          {cur.note && <span class="muted small"> · {cur.note}</span>}
        </span>
      </div>
      <svg width={w} height={H}>
        {Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step).map((t) => (
          <g>
            <line x1={PAD.l} x2={w - PAD.r} y1={Y(t)} y2={Y(t)} class="grid" />
            <text x={PAD.l - 6} y={Y(t) + 4} class="axis" text-anchor="end">
              {t >= 1000 ? `${(t / 1000).toLocaleString('ru-RU')}т` : t}
            </text>
          </g>
        ))}
        {bars.map((b, i) => {
          const x = PAD.l + i * slot + (slot - bw) / 2;
          const y = Y(b.value);
          const h = Math.max(0, H - PAD.b - y);
          const r = Math.min(4, bw / 2, h);
          return (
            <g onClick={() => setSel(i)} class="bar-hit">
              <rect x={PAD.l + i * slot} y={PAD.t} width={slot} height={H - PAD.t - PAD.b} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${H - PAD.b} V${y + r} Q${x},${y} ${x + r},${y} H${x + bw - r} Q${x + bw},${y} ${x + bw},${y + r} V${H - PAD.b} Z`}
                  class={'bar' + (i === idx ? ' bar-sel' : '')}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={x + bw / 2} y={H - 6} class="axis" text-anchor="middle">
                  {b.key.slice(8, 10)}.{b.key.slice(5, 7)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
