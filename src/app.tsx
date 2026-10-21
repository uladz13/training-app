import { useEffect, useState } from 'preact/hooks';
import { initDb, requestPersistence } from './db';
import { useHashRoute, go } from './router';
import { TodayScreen } from './screens/TodayScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { MoreScreen } from './screens/MoreScreen';
import { useRestTimer, addRest, stopRest } from './timer';

function RestBar() {
  const t = useRestTimer();
  if (!t.running) return null;
  const m = Math.floor(t.left / 60);
  const s = String(t.left % 60).padStart(2, '0');
  const pct = t.total ? (t.left / t.total) * 100 : 0;
  return (
    <div class="rest-bar">
      <div class="rest-fill" style={{ width: pct + '%' }} />
      <div class="rest-content">
        <div>
          <div class="rest-label">Отдых · {t.label}</div>
          <div class="rest-time">
            {m}:{s}
          </div>
        </div>
        <button class="chip" onClick={() => addRest(15)}>
          +15 с
        </button>
        <button class="chip" onClick={stopRest}>
          Стоп
        </button>
      </div>
    </div>
  );
}

export function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const route = useHashRoute();

  useEffect(() => {
    initDb()
      .then(() => setReady(true))
      .catch((e) => setError(String(e)));
    requestPersistence();
  }, []);

  if (error) return <div class="empty">Ошибка базы данных: {error}</div>;
  if (!ready) return <div class="loading">Загрузка…</div>;

  const [page, arg] = route;
  let screen;
  if (page === 'workout' && arg) screen = <WorkoutScreen id={Number(arg)} />;
  else if (page === 'history') screen = <HistoryScreen />;
  else if (page === 'more') screen = <MoreScreen />;
  else screen = <TodayScreen />;

  const tab = page === 'workout' ? '' : page;
  const nav: [string, string][] = [
    ['today', 'Сегодня'],
    ['history', 'История'],
    ['more', 'Ещё']
  ];

  return (
    <>
      <main>{screen}</main>
      <RestBar />
      <nav class="tabbar">
        {nav.map(([k, l]) => (
          <button class={tab === k || (k === 'today' && !['history', 'more', 'workout'].includes(page)) ? 'on' : ''} onClick={() => go(k)}>
            {l}
          </button>
        ))}
      </nav>
    </>
  );
}
