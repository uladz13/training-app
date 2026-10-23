import { useEffect, useRef, useState } from 'preact/hooks';
import { db } from '../db';
import { useLive, useWakeLock } from '../hooks';
import type { Exercise, Workout, WorkoutItem } from '../types';
import { ExerciseCard } from '../components/ExerciseCard';
import { AddExerciseSheet } from '../components/AddExerciseSheet';
import { Check, Sheet, Stepper } from '../components/ui';
import { elapsedSec, formatDuration, formatVolume, workoutVolume } from '../stats';
import { DAY_NAMES, formatDate } from '../util';
import { clockStart, itemForExercise } from '../workoutLogic';
import { go } from '../router';
import { isoDay } from '../data/seed';
import { hintFor } from '../progression';

export function WorkoutScreen({ id }: { id: number }) {
  // Локальное состояние: интерфейс обновляется сразу, запись в базу идёт фоном.
  const [workout, setWorkout] = useState<Workout | null | undefined>(undefined);
  const current = useRef<Workout | null>(null);
  useEffect(() => {
    db.workouts.get(id).then((w) => {
      current.current = w ?? null;
      setWorkout(w ?? null);
    });
  }, [id]);
  const exercises = useLive(() => db.exercises.toArray(), []);
  const [adding, setAdding] = useState(false);
  // Прошлая тренировка того же дня недели — источник подсказок прогрессии.
  const prev = useLive(async () => {
    if (!workout) return null;
    const list = await db.workouts.where('day').equals(workout.day).toArray();
    return list.filter((x) => x.date < workout.date).sort((a, b) => (a.date < b.date ? 1 : -1))[0] ?? null;
  }, [workout?.day, workout?.date]);
  useWakeLock(!!workout && !workout.finished);
  const [editingTime, setEditingTime] = useState(false);
  // Перерисовка раз в секунду, пока идёт таймер тренировки.
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!workout?.runningSince) return;
    const t = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [workout?.runningSince]);
  // Шапка закреплена; при прокрутке — компактная. Разные пороги, чтобы не мигала на границе.
  const [compact, setCompact] = useState(false);
  // Открытое на весь экран упражнение; при закрытии — возврат к прежнему месту списка.
  const [openUid, setOpenUid] = useState<string | null>(null);
  const listScroll = useRef(0);
  const openItem = (uid: string) => {
    listScroll.current = window.scrollY;
    setOpenUid(uid);
    window.scrollTo(0, 0);
  };
  const closeItem = () => {
    setOpenUid(null);
    requestAnimationFrame(() => window.scrollTo(0, listScroll.current));
  };
  useEffect(() => {
    const onScroll = () => setCompact((c) => (c ? window.scrollY > 8 : window.scrollY > 56));
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (workout === undefined || !exercises) return <div class="loading">Загрузка…</div>;
  if (!workout) return <div class="empty">Тренировка не найдена.</div>;

  const byId = new Map(exercises.map((e) => [e.id, e]));
  const patch = (p: Partial<Workout>) => {
    const next = { ...current.current!, ...p };
    current.current = next;
    setWorkout(next);
    return db.workouts.put(next);
  };
  const setItem = (i: number, it: WorkoutItem) =>
    patch({ items: current.current!.items.map((x, j) => (j === i ? it : x)) });
  const done = workout.items.filter((i) => i.done).length;
  const volume = workoutVolume(workout, byId);
  const running = !!workout.runningSince;
  const elapsed = elapsedSec(workout);

  /** Остановить текущий отрезок и прибавить его к накопленному времени. */
  const stopClock = (): Partial<Workout> => ({ durationSec: elapsedSec(current.current!), runningSince: null });
  const toggleClock = () => patch(running ? stopClock() : { runningSince: Date.now() });

  const move = (i: number, dir: -1 | 1) => {
    const items = [...current.current!.items];
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    patch({ items });
  };

  const add = async (ex: Exercise) => {
    const it = await itemForExercise(ex);
    await patch({ items: [...current.current!.items, it] });
    setAdding(false);
  };

  const openIdx = workout.items.findIndex((it) => it.uid === openUid);
  const card = (i: number) => {
    const it = workout.items[i];
    const ex = byId.get(it.exerciseId);
    if (!ex) return null;
    return (
      <ExerciseCard
        key={it.uid}
        item={it}
        ex={ex}
        index={i}
        count={workout.items.length}
        onChange={(n) => setItem(i, n)}
        onDelete={() => {
          if (openUid === it.uid) closeItem();
          patch({ items: current.current!.items.filter((_, j) => j !== i) });
        }}
        onMove={(d) => move(i, d)}
        hint={hintFor(prev?.items.find((p) => p.exerciseId === it.exerciseId), ex)}
        open={openUid === it.uid}
        onOpen={() => openItem(it.uid)}
        onClose={closeItem}
      />
    );
  };

  const remove = async () => {
    if (confirm('Удалить эту тренировку целиком?')) {
      await db.workouts.delete(id);
      go('history');
    }
  };

  return (
    <div class="screen">
      <div class={'workout-top' + (compact ? ' compact' : '')}>
        <div class="screen-head">
          <div>
            <div class="eyebrow">
              {DAY_NAMES[isoDay(workout.date)]}, {formatDate(workout.date)}
            </div>
            <h1>{workout.title}</h1>
          </div>
        </div>

        <section class="card stats-bar">
          <button class="clock" onClick={() => setEditingTime(true)} aria-label="изменить длительность">
            <span class="stat-label">{workout.finished ? 'Длительность' : running ? 'Идёт' : 'Пауза'}</span>
            <span class={'clock-time' + (running ? '' : ' paused')}>{formatDuration(elapsed)}</span>
          </button>
          {!workout.finished && (
            <button class="clock-btn" onClick={toggleClock} aria-label={running ? 'пауза' : 'продолжить'}>
              {running ? 'Ⅱ' : '▶'}
            </button>
          )}
          <div class="stat">
            <span class="stat-label">Объём</span>
            <span class="stat-value">{formatVolume(volume)}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Упражнения</span>
            <span class="stat-value">
              {done}/{workout.items.length}
            </span>
          </div>
        </section>
      </div>

      {openIdx >= 0 ? (
        card(openIdx)
      ) : (
        <>
          <section class={'card phase' + (workout.warmupDone ? ' done' : '')}>
            <div class="phase-text">
              <strong>Разминка</strong>
              <span>{workout.warmup}</span>
            </div>
            <Check checked={workout.warmupDone} onClick={() => patch({ warmupDone: !workout.warmupDone })} label="разминка" />
          </section>

          {workout.items.map((_, i) => card(i))}

          <button class="btn wide ghost" onClick={() => setAdding(true)}>
            + Добавить упражнение
          </button>

          <section class={'card phase' + (workout.cooldownDone ? ' done' : '')}>
            <div class="phase-text">
              <strong>Заминка</strong>
              <span>{workout.cooldown}</span>
            </div>
            <Check checked={workout.cooldownDone} onClick={() => patch({ cooldownDone: !workout.cooldownDone })} label="заминка" />
          </section>

          <label class="field">
            <span>Заметка</span>
            <textarea
              class="text-input"
              rows={2}
              value={workout.note}
              onChange={(e) => patch({ note: (e.target as HTMLTextAreaElement).value })}
            />
          </label>

          {workout.finished ? (
            <button class="btn wide" onClick={() => patch({ finished: false, runningSince: clockStart(workout.date) })}>
              Вернуть в работу
            </button>
          ) : (
            <button
              class="btn wide primary"
              onClick={async () => {
                await patch({ finished: true, ...stopClock() });
                go('today');
              }}
            >
              Завершить тренировку
            </button>
          )}
          <button class="btn wide danger-text" onClick={remove}>
            Удалить тренировку
          </button>
        </>
      )}

      {editingTime && (
        <DurationSheet
          sec={elapsed}
          onClose={() => setEditingTime(false)}
          onSave={(sec) => {
            patch({ durationSec: sec, runningSince: running ? Date.now() : null });
            setEditingTime(false);
          }}
        />
      )}
      {adding && <AddExerciseSheet exercises={exercises} onPick={add} onClose={() => setAdding(false)} />}
    </div>
  );
}

function DurationSheet({ sec, onClose, onSave }: { sec: number; onClose: () => void; onSave: (sec: number) => void }) {
  const [h, setH] = useState(Math.floor(sec / 3600));
  const [m, setM] = useState(Math.floor((sec % 3600) / 60));
  return (
    <Sheet title="Длительность тренировки" onClose={onClose}>
      <div class="form-row">
        <span>Часы</span>
        <Stepper value={h} onChange={(v) => setH(Math.min(9, Math.floor(v)))} />
      </div>
      <div class="form-row">
        <span>Минуты</span>
        <Stepper
          value={m}
          onChange={(v) => setM(Math.floor(v))}
          onStep={(dir) => {
            const total = Math.max(0, h * 60 + m + dir);
            setH(Math.floor(total / 60));
            return total % 60;
          }}
        />
      </div>
      <p class="muted small">Если таймер идёт, он продолжит считать от нового значения.</p>
      <div class="sheet-actions">
        <button class="btn" onClick={onClose}>
          Отмена
        </button>
        <button class="btn primary" onClick={() => onSave(Math.max(0, h * 3600 + Math.min(59, m) * 60))}>
          Сохранить
        </button>
      </div>
    </Sheet>
  );
}
