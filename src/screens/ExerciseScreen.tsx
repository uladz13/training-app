import { useState } from 'preact/hooks';
import { db } from '../db';
import { useLive } from '../hooks';
import { LineChart } from '../components/LineChart';
import { RangePicker } from '../components/RangePicker';
import { METRICS, metricUnit, metricValue, sessionsFor, shiftDate, type Metric } from '../exerciseStats';
import { summary } from '../components/ExerciseCard';
import { formatDate, kg, todayIso } from '../util';
import { formatVolume } from '../stats';
import type { WorkoutItem } from '../types';

const DEFAULT_DAYS = 90;

export function ExerciseScreen({ id }: { id: string }) {
  const ex = useLive(() => db.exercises.get(id), [id]);
  const workouts = useLive(() => db.workouts.toArray(), []);
  const today = todayIso();
  const defFrom = shiftDate(today, -DEFAULT_DAYS);
  const [range, setRange] = useState({ from: defFrom, to: today });
  const [metric, setMetric] = useState<Metric | null>(null);
  if (ex === undefined || !workouts) return <div class="loading">Загрузка…</div>;
  if (!ex) return <div class="empty">Упражнение не найдено.</div>;

  const metrics = METRICS[ex.kind];
  const m = metric ?? metrics[0].key;
  const all = sessionsFor(ex.id, workouts);
  const inRange = all.filter((s) => s.date >= range.from && s.date <= range.to);
  const { unit, decimals } = metricUnit(ex, m);
  const points = inRange.map((s) => {
    const r = metricValue(s, ex, m);
    return { date: s.date, value: r.value, note: r.note };
  });

  // Рекорды за всё время.
  const best = (mm: Metric) => {
    let top: { date: string; value: number; note: string } | null = null;
    for (const s of all) {
      const r = metricValue(s, ex, mm);
      if (!top || r.value > top.value) top = { date: s.date, ...r };
    }
    return top;
  };
  const records = metrics.map((x) => ({ label: x.label, rec: best(x.key), key: x.key }));
  const fmtVal = (mm: Metric, v: number) =>
    mm === 'weight' ? `${ex.equipment === 'db2' ? '2 × ' : ''}${kg(v)} кг` : mm === 'volume' ? formatVolume(v) : `${v} ${ex.kind === 'time' ? 'с' : 'повт.'}`;
  const asItem = (sets: WorkoutItem['sets']): WorkoutItem => ({ uid: '', exerciseId: ex.id, done: true, restSec: 0, target: { sets: 0, min: 0, max: 0 }, sets });

  return (
    <div class="screen">
      <div class="screen-head">
        <div>
          <button class="link small" onClick={() => history.back()}>
            ‹ Назад
          </button>
          <h1>{ex.name}</h1>
        </div>
      </div>
      {metrics.length > 1 && (
        <div class="seg">
          {metrics.map((x) => (
            <button class={m === x.key ? 'on' : ''} onClick={() => setMetric(x.key)}>
              {x.label}
            </button>
          ))}
        </div>
      )}
      <RangePicker
        from={range.from}
        to={range.to}
        onChange={(from, to) => setRange({ from, to })}
        defaultFrom={defFrom}
        defaultTo={today}
        defaultLabel="Последние 3 месяца"
      />
      <section class="card">
        <h2>{metrics.find((x) => x.key === m)!.label}</h2>
        <LineChart points={points} unit={unit} decimals={m === 'weight' ? 1 : decimals} pointLabel={ex.name} from={range.from} to={range.to} />
      </section>
      <section class="card">
        <h2>Рекорды</h2>
        {records.map(({ label, rec, key }) => (
          <div class="form-row record">
            <span class="muted">{label}</span>
            <span>
              {rec ? (
                <>
                  <strong>{fmtVal(key, rec.value)}</strong> <span class="muted small">{formatDate(rec.date)}</span>
                </>
              ) : (
                '—'
              )}
            </span>
          </div>
        ))}
      </section>
      <section class="card">
        <h2>Тренировки</h2>
        {[...all].reverse().map((s) => (
          <button class="list-row" onClick={() => s.workoutId && (location.hash = '#/workout/' + s.workoutId)}>
            <span>{formatDate(s.date)}</span>
            <span class="muted small">{summary(asItem(s.sets), ex)}</span>
          </button>
        ))}
      </section>
    </div>
  );
}
