import { useState } from 'preact/hooks';
import { db } from '../db';
import { useLive } from '../hooks';
import { DAY_SHORT, formatDate, todayIso } from '../util';
import { go } from '../router';
import type { Workout } from '../types';
import { durationShort, elapsedSec, formatVolume, workoutVolume } from '../stats';
import { AddWorkoutSheet } from '../components/AddWorkoutSheet';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const pad = (n: number) => String(n).padStart(2, '0');

function Calendar({
  year,
  month,
  byDate,
  selected,
  onSelect,
  onMonth
}: {
  year: number;
  month: number;
  byDate: Map<string, Workout[]>;
  selected: string | null;
  onSelect: (d: string) => void;
  onMonth: (dir: -1 | 1) => void;
}) {
  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // понедельник — первый
  const days = new Date(year, month + 1, 0).getDate();
  const today = todayIso();
  const cells: (string | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: days }, (_, i) => `${year}-${pad(month + 1)}-${pad(i + 1)}`)
  ];
  const count = [...byDate.keys()].filter((d) => d.startsWith(`${year}-${pad(month + 1)}`)).length;

  return (
    <section class="card cal">
      <div class="cal-head">
        <button class="icon-btn" onClick={() => onMonth(-1)} aria-label="предыдущий месяц">
          ‹
        </button>
        <div class="cal-title">
          <strong>
            {MONTHS[month]} {year}
          </strong>
          <span class="muted small">Тренировок: {count}</span>
        </div>
        <button class="icon-btn" onClick={() => onMonth(1)} aria-label="следующий месяц">
          ›
        </button>
      </div>
      <div class="cal-grid">
        {[1, 2, 3, 4, 5, 6, 7].map((d) => (
          <span class="cal-dow">{DAY_SHORT[d]}</span>
        ))}
        {cells.map((d) => {
          if (!d) return <span />;
          const ws = byDate.get(d);
          const cls = ['cal-day'];
          if (ws) cls.push(ws.every((w) => w.finished) ? 'has' : 'partial');
          if (d === today) cls.push('today');
          if (d === selected) cls.push('sel');
          return (
            <button class={cls.join(' ')} onClick={() => onSelect(d)}>
              {Number(d.slice(8))}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function HistoryScreen() {
  const workouts = useLive(() => db.workouts.orderBy('date').reverse().toArray(), []);
  const exercises = useLive(() => db.exercises.toArray(), []);
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  if (!workouts || !exercises) return <div class="loading">Загрузка…</div>;

  const exById = new Map(exercises.map((e) => [e.id, e]));
  const byDate = new Map<string, Workout[]>();
  for (const w of workouts) byDate.set(w.date, [...(byDate.get(w.date) ?? []), w]);

  const monthKey = `${ym.y}-${pad(ym.m + 1)}`;
  const list = selected ? byDate.get(selected) ?? [] : workouts.filter((w) => w.date.startsWith(monthKey));

  const changeMonth = (dir: -1 | 1) => {
    const d = new Date(ym.y, ym.m + dir, 1);
    setYm({ y: d.getFullYear(), m: d.getMonth() });
    setSelected(null);
  };
  const select = (d: string) => {
    const ws = byDate.get(d);
    if (ws?.length === 1) go('workout/' + ws[0].id);
    else setSelected(d === selected ? null : d);
  };

  return (
    <div class="screen">
      <div class="screen-head">
        <h1>История</h1>
        <div class="progress-pill">{workouts.length}</div>
      </div>
      <Calendar year={ym.y} month={ym.m} byDate={byDate} selected={selected} onSelect={select} onMonth={changeMonth} />
      <button class="btn ghost wide" onClick={() => setAdding(selected ?? todayIso())}>
        + Тренировка за другую дату
      </button>
      <div class="muted small list-caption">
        {selected ? formatDate(selected) : `${MONTHS[ym.m]} — все тренировки`}
        {selected && (
          <>
            {' · '}
            <button class="link" onClick={() => setSelected(null)}>
              показать месяц
            </button>
          </>
        )}
      </div>
      {list.length === 0 && <div class="empty">{selected ? 'В этот день тренировки не было.' : 'В этом месяце тренировок нет.'}</div>}
      {selected && list.length === 0 && selected <= todayIso() && (
        <button class="btn wide primary" onClick={() => setAdding(selected)}>
          Добавить тренировку на эту дату
        </button>
      )}
      {adding && <AddWorkoutSheet initialDate={adding} onClose={() => setAdding(null)} />}
      {list.map((w) => {
        const done = w.items.filter((i) => i.done).length;
        return (
          <button class="card hist-row" onClick={() => go('workout/' + w.id)}>
            <div class="hist-date">
              <span class="hist-day">{DAY_SHORT[w.day]}</span>
              <span>{formatDate(w.date)}</span>
            </div>
            <div class="hist-main">
              <div>{w.title}</div>
              <div class="muted small">
                {durationShort(elapsedSec(w))} · {formatVolume(workoutVolume(w, exById))} · {done}/{w.items.length} упр.
                {w.finished ? '' : ' · не завершена'}
              </div>
            </div>
            <span class="arrow">›</span>
          </button>
        );
      })}
    </div>
  );
}
