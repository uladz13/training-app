import { useEffect, useRef, useState } from 'preact/hooks';
import { formatDate } from '../util';

export interface Pt {
  date: string;
  value: number;
}

interface Props {
  /** точки замеров (маркеры) */
  points: Pt[];
  /** линия среднего; если нет — линия идёт по точкам */
  line?: Pt[];
  unit: string;
  decimals: number;
  pointLabel: string;
  lineLabel?: string;
  /** границы оси X (выбранный период); по умолчанию — по данным */
  from?: string;
  to?: string;
}

const H = 180;
const PAD = { l: 34, r: 10, t: 10, b: 22 };
const dayNum = (d: string) => Math.round(new Date(d + 'T12:00:00').getTime() / 86400000);
const fmt = (v: number, d: number) => v.toFixed(d).replace('.', ',');

function ticks(min: number, max: number, step: number): number[] {
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(Math.round(v * 10) / 10);
  return out;
}

/** Линейный график по датам: маркеры замеров + линия (среднее или сами значения), касание показывает значения. */
export function LineChart({ points, line, unit, decimals, pointLabel, lineLabel, from, to }: Props) {
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

  if (points.length === 0) return <div class="empty small">За выбранный период записей нет.</div>;

  const all = [...points, ...(line ?? [])];
  const x0 = from ? dayNum(from) : Math.min(...all.map((p) => dayNum(p.date)));
  const x1 = to ? dayNum(to) : Math.max(...all.map((p) => dayNum(p.date)));
  let y0 = Math.min(...all.map((p) => p.value));
  let y1 = Math.max(...all.map((p) => p.value));
  const span = Math.max(y1 - y0, decimals ? 1 : 2);
  y0 -= span * 0.15;
  y1 += span * 0.15;
  const rawStep = span <= 2 ? 0.5 : span <= 5 ? 1 : span <= 12 ? 2 : 5;
  // Целые единицы (талия, см) — сетка только по целым значениям.
  const step = decimals === 0 ? Math.max(1, rawStep) : rawStep;

  const X = (d: string) => PAD.l + (x1 === x0 ? 0.5 : (dayNum(d) - x0) / (x1 - x0)) * (w - PAD.l - PAD.r);
  const Y = (v: number) => PAD.t + (1 - (v - y0) / (y1 - y0)) * (H - PAD.t - PAD.b);
  const path = (ps: Pt[]) => ps.map((p, i) => `${i ? 'L' : 'M'}${X(p.date).toFixed(1)},${Y(p.value).toFixed(1)}`).join('');
  const lineData = line ?? points;

  const idx = sel ?? points.length - 1;
  const cur = points[idx];
  const curLine = line?.find((p) => p.date === cur.date);

  const onPointer = (e: PointerEvent) => {
    const rect = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0;
    points.forEach((p, i) => {
      if (Math.abs(X(p.date) - px) < Math.abs(X(points[best].date) - px)) best = i;
    });
    setSel(best);
  };

  const firstDate = from ?? points[0].date;
  const lastDate = to ?? points[points.length - 1].date;

  return (
    <div class="chart" ref={box}>
      <div class="chart-readout">
        <span class="muted small">{formatDate(cur.date)}</span>
        <span>
          <strong>
            {fmt(cur.value, decimals)} {unit}
          </strong>
          {curLine && lineLabel && (
            <span class="muted small">
              {' '}
              · {lineLabel.toLowerCase()} {fmt(curLine.value, decimals)}
            </span>
          )}
        </span>
      </div>
      <svg width={w} height={H} onPointerDown={onPointer} onPointerMove={(e) => e.buttons && onPointer(e)} style={{ touchAction: 'pan-y' }}>
        {ticks(y0, y1, step).map((t) => (
          <g>
            <line x1={PAD.l} x2={w - PAD.r} y1={Y(t)} y2={Y(t)} class="grid" />
            <text x={PAD.l - 6} y={Y(t) + 4} class="axis" text-anchor="end">
              {fmt(t, step < 1 ? 1 : 0)}
            </text>
          </g>
        ))}
        <text x={PAD.l} y={H - 6} class="axis">
          {formatDate(firstDate)}
        </text>
        {lastDate !== firstDate && (
          <text x={w - PAD.r} y={H - 6} class="axis" text-anchor="end">
            {formatDate(lastDate)}
          </text>
        )}
        <line x1={X(cur.date)} x2={X(cur.date)} y1={PAD.t} y2={H - PAD.b} class="crosshair" />
        {line && points.map((p) => <circle cx={X(p.date)} cy={Y(p.value)} r={4} class="dot-muted" />)}
        <path d={path(lineData)} class="series-line" />
        {!line && points.map((p) => <circle cx={X(p.date)} cy={Y(p.value)} r={4} class="dot-accent" />)}
        <circle cx={X(cur.date)} cy={Y(cur.value)} r={5.5} class="dot-sel" />
      </svg>
      {line && lineLabel && (
        <div class="legend small">
          <span>
            <i class="lg-dot" /> {pointLabel}
          </span>
          <span>
            <i class="lg-line" /> {lineLabel}
          </span>
        </div>
      )}
    </div>
  );
}
