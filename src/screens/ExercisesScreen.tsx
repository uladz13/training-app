import { useState } from 'preact/hooks';
import { db } from '../db';
import { useLive } from '../hooks';
import { BarChart } from '../components/BarChart';
import { ProgressTabs, RangePicker } from '../components/RangePicker';
import { formatVolume, workoutVolume } from '../stats';
import { sessionsFor, weekStart, shiftDate } from '../exerciseStats';
import { formatDate, todayIso } from '../util';
import { go } from '../router';

const WEEKS = 8;

export function ExercisesScreen() {
  const workouts = useLive(() => db.workouts.toArray(), []);
  const exercises = useLive(() => db.exercises.toArray(), []);
  const today = todayIso();
  const defFrom = shiftDate(weekStart(today), -7 * (WEEKS - 1));
  const [range, setRange] = useState({ from: defFrom, to: today });
  if (!workouts || !exercises) return <div class="loading">Загрузка…</div>;
  const byId = new Map(exercises.map((e) => [e.id, e]));

  // Объём по неделям (пн–вс) в выбранном периоде, включая пустые недели.
  const weeks: { key: string; value: number; count: number }[] = [];
  for (let wk = weekStart(range.from); wk <= range.to; wk = shiftDate(wk, 7)) weeks.push({ key: wk, value: 0, count: 0 });
  for (const w of workouts) {
    if (w.date < range.from || w.date > range.to) continue;
    const wk = weeks.find((x) => x.key === weekStart(w.date));
    if (!wk) continue;
    wk.value += workoutVolume(w, byId);
    wk.count += 1;
  }

  // Упражнения с записями: последняя дата.
  const list = exercises
    .map((ex) => ({ ex, sessions: sessionsFor(ex.id, workouts) }))
    .filter((x) => x.sessions.length)
    .sort((a, b) => a.ex.name.localeCompare(b.ex.name, 'ru'));

  return (
    <div class="screen">
      <div class="screen-head">
        <h1>Прогресс</h1>
      </div>
      <ProgressTabs active="exercises" />
      <RangePicker
        from={range.from}
        to={range.to}
        onChange={(from, to) => setRange({ from, to })}
        defaultFrom={defFrom}
        defaultTo={today}
        defaultLabel={`Последние ${WEEKS} недель`}
      />
      <section class="card">
        <h2>Объём по неделям</h2>
        <BarChart
          title="Объём по неделям"
          bars={weeks.map((w) => ({
            key: w.key,
            label: `Неделя с ${formatDate(w.key)}`,
            value: Math.round(w.value),
            note: `тренировок: ${w.count}`
          }))}
          format={formatVolume}
        />
      </section>
      <section class="card">
        <h2>Упражнения</h2>
        {list.length === 0 && <div class="empty small">Записей пока нет.</div>}
        {list.map(({ ex, sessions }) => (
          <button class="list-row" onClick={() => go('exercise/' + ex.id)}>
            <span>{ex.name}</span>
            <span class="muted small">
              {formatDate(sessions[sessions.length - 1].date)} · {sessions.length} трен. ›
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
