import { db } from '../db';
import { useLive } from '../hooks';
import { DAY_SHORT, formatDate } from '../util';
import { go } from '../router';

export function HistoryScreen() {
  const workouts = useLive(() => db.workouts.orderBy('date').reverse().toArray(), []);
  if (!workouts) return <div class="loading">Загрузка…</div>;

  return (
    <div class="screen">
      <div class="screen-head">
        <h1>История</h1>
        <div class="progress-pill">{workouts.length}</div>
      </div>
      {workouts.length === 0 && <div class="empty">Тренировок пока нет.</div>}
      {workouts.map((w) => {
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
                {done}/{w.items.length} упражнений{w.finished ? '' : ' · не завершена'}
              </div>
            </div>
            <span class="arrow">›</span>
          </button>
        );
      })}
    </div>
  );
}
