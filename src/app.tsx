import { useEffect, useState } from 'preact/hooks';
import { initDb, requestPersistence } from './db';
import { useHashRoute, go } from './router';
import { TodayScreen } from './screens/TodayScreen';
import { WorkoutScreen } from './screens/WorkoutScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { MoreScreen } from './screens/MoreScreen';
import { BodyScreen } from './screens/BodyScreen';
import { ExercisesScreen } from './screens/ExercisesScreen';
import { ExerciseScreen } from './screens/ExerciseScreen';
import { ProgramScreen, DayEditor } from './screens/ProgramScreen';
import { CatalogScreen } from './screens/CatalogScreen';
import { useRestTimer, addRest, stopRest, useSetTimer, stopSet } from './timer';

/** Панель подхода на время; пока она видна, отдых не показывается. */
function SetBar() {
  const t = useSetTimer();
  if (!t.running) return null;
  const m = Math.floor(t.left / 60);
  const s = String(t.left % 60).padStart(2, '0');
  const pct = t.prep ? 100 : t.total ? (t.left / t.total) * 100 : 0;
  return (
    <div class={'rest-bar set-bar' + (t.prep ? ' prep' : '')}>
      <div class="rest-fill" style={{ width: pct + '%' }} />
      <div class="rest-content">
        <div>
          <div class="rest-label">{t.prep ? 'Приготовьтесь' : 'Подход'} · {t.label}</div>
          <div class="rest-time">{t.prep ? t.left : `${m}:${s}`}</div>
        </div>
        <button class="chip" onClick={stopSet}>
          Стоп
        </button>
      </div>
    </div>
  );
}

function RestBar() {
  const t = useRestTimer();
  const set = useSetTimer();
  if (!t.running || set.running) return null;
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
  else if (page === 'body') screen = <BodyScreen />;
  else if (page === 'exercises') screen = <ExercisesScreen />;
  else if (page === 'exercise' && arg) screen = <ExerciseScreen id={decodeURIComponent(arg)} />;
  else if (page === 'program' && arg) screen = <DayEditor day={Number(arg)} />;
  else if (page === 'program') screen = <ProgramScreen />;
  else if (page === 'catalog') screen = <CatalogScreen />;
  else screen = <TodayScreen />;

  const GROUP: Record<string, string> = {
    today: 'today', history: 'history', workout: 'history',
    body: 'body', exercises: 'body', exercise: 'body',
    more: 'more', program: 'more', catalog: 'more'
  };
  const tab = GROUP[page] ?? 'today';
  const nav: [string, string][] = [
    ['today', 'Сегодня'],
    ['history', 'История'],
    ['body', 'Прогресс'],
    ['more', 'Ещё']
  ];

  return (
    <>
      <main>{screen}</main>
      <RestBar />
      <SetBar />
      <nav class="tabbar">
        {nav.map(([k, l]) => (
          <button class={tab === k ? 'on' : ''} onClick={() => go(k)}>
            {l}
          </button>
        ))}
      </nav>
    </>
  );
}
