import { useState } from 'preact/hooks';
import { db } from '../db';
import { useLive } from '../hooks';
import { DAY_NAMES, DAY_SHORT, formatDate, todayIso } from '../util';
import { isoDay } from '../data/seed';
import { createWorkout } from '../workoutLogic';
import { go } from '../router';
import { summary } from '../components/ExerciseCard';
import { daysSinceBackup, exportBackup } from '../backup';
import type { WorkoutItem } from '../types';
import { BodyCard } from '../components/BodyCard';
import { durationShort, elapsedSec, formatVolume, workoutVolume } from '../stats';

export function TodayScreen() {
  const date = todayIso();
  const [day, setDay] = useState(isoDay(date));
  const todays = useLive(() => db.workouts.where('date').equals(date).toArray(), [date]);
  const tpl = useLive(() => db.templates.get(day), [day]);
  const exercises = useLive(() => db.exercises.toArray(), []);
  const prev = useLive(async () => {
    const list = await db.workouts.where('day').equals(day).toArray();
    return list.filter((w) => w.date < date).sort((a, b) => (a.date < b.date ? 1 : -1))[0] ?? null;
  }, [day, date]);
  const backupDays = useLive(() => daysSinceBackup(), []);

  if (!todays || !exercises || prev === undefined) return <div class="loading">Загрузка…</div>;
  const byId = new Map(exercises.map((e) => [e.id, e]));

  const start = async () => {
    const id = await createWorkout(date, day);
    go('workout/' + id);
  };

  return (
    <div class="screen">
      <div class="screen-head">
        <div>
          <div class="eyebrow">{formatDate(date)}</div>
          <h1>{DAY_NAMES[isoDay(date)]}</h1>
        </div>
      </div>

      {(backupDays === null || (backupDays ?? 0) >= 7) && (
        <div class="banner">
          <span>{backupDays === null ? 'Бэкап ещё не делался.' : `Бэкапа не было ${backupDays} дн.`}</span>
          <button class="chip" onClick={() => exportBackup()}>
            Сохранить
          </button>
        </div>
      )}

      <BodyCard date={date} />

      {todays.map((w) => {
        const done = w.items.filter((i) => i.done).length;
        return (
          <button class="card today-card" onClick={() => go('workout/' + w.id)}>
            <div>
              <div class="eyebrow">{w.finished ? 'Завершена' : 'В процессе'}</div>
              <div class="today-title">{w.title}</div>
              <div class="muted">
                {done} из {w.items.length} упр. · {durationShort(elapsedSec(w))} · {formatVolume(workoutVolume(w, byId))}
              </div>
            </div>
            <span class="arrow">›</span>
          </button>
        );
      })}

      <section class="card">
        <div class="day-picker">
          {[1, 2, 3, 4, 5, 6, 7].map((d) => (
            <button class={(d === day ? 'on' : '') + (d === isoDay(date) ? ' today' : '')} onClick={() => setDay(d)}>
              {DAY_SHORT[d]}
            </button>
          ))}
        </div>
        {tpl && (
          <>
            <h2>{tpl.title}</h2>
            <div class="muted small">
              {prev ? `Цифры — с прошлого раза (${formatDate(prev.date)})` : 'Цифры — из программы'}
            </div>
            <ol class="plan">
              {(prev ? prev.items : tpl.items).map((it) => {
                const ex = byId.get(it.exerciseId);
                if (!ex) return null;
                return (
                  <li>
                    <span>{ex.name}</span>
                    {prev && <span class="muted small">{summary(it as WorkoutItem, ex)}</span>}
                  </li>
                );
              })}
            </ol>
            <button class="btn wide primary" onClick={start}>
              {todays.length ? 'Начать ещё одну тренировку' : 'Начать тренировку'}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
