import { useState } from 'preact/hooks';
import { db } from '../db';
import { useLive, useWakeLock } from '../hooks';
import type { Exercise, Workout, WorkoutItem } from '../types';
import { ExerciseCard } from '../components/ExerciseCard';
import { AddExerciseSheet } from '../components/AddExerciseSheet';
import { Check } from '../components/ui';
import { DAY_NAMES, formatDate } from '../util';
import { itemForExercise } from '../workoutLogic';
import { go } from '../router';

export function WorkoutScreen({ id }: { id: number }) {
  const workout = useLive(() => db.workouts.get(id), [id]);
  const exercises = useLive(() => db.exercises.toArray(), []);
  const [adding, setAdding] = useState(false);
  useWakeLock(!!workout && !workout.finished);

  if (workout === undefined || !exercises) return <div class="loading">Загрузка…</div>;
  if (!workout) return <div class="empty">Тренировка не найдена.</div>;

  const byId = new Map(exercises.map((e) => [e.id, e]));
  const save = (w: Workout) => db.workouts.put(w);
  const patch = (p: Partial<Workout>) => save({ ...workout, ...p });
  const setItem = (i: number, it: WorkoutItem) => patch({ items: workout.items.map((x, j) => (j === i ? it : x)) });
  const done = workout.items.filter((i) => i.done).length;

  const move = (i: number, dir: -1 | 1) => {
    const items = [...workout.items];
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    patch({ items });
  };

  const add = async (ex: Exercise) => {
    const it = await itemForExercise(ex);
    await patch({ items: [...workout.items, it] });
    setAdding(false);
  };

  const remove = async () => {
    if (confirm('Удалить эту тренировку целиком?')) {
      await db.workouts.delete(id);
      go('history');
    }
  };

  return (
    <div class="screen">
      <div class="screen-head">
        <div>
          <div class="eyebrow">
            {DAY_NAMES[workout.day]}, {formatDate(workout.date)}
          </div>
          <h1>{workout.title}</h1>
        </div>
        <div class="progress-pill">
          {done}/{workout.items.length}
        </div>
      </div>

      <section class={'card phase' + (workout.warmupDone ? ' done' : '')}>
        <div class="phase-text">
          <strong>Разминка</strong>
          <span>{workout.warmup}</span>
        </div>
        <Check checked={workout.warmupDone} onClick={() => patch({ warmupDone: !workout.warmupDone })} label="разминка" />
      </section>

      {workout.items.map((it, i) => {
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
            onDelete={() => patch({ items: workout.items.filter((_, j) => j !== i) })}
            onMove={(d) => move(i, d)}
          />
        );
      })}

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
        <button class="btn wide" onClick={() => patch({ finished: false })}>
          Вернуть в работу
        </button>
      ) : (
        <button
          class="btn wide primary"
          onClick={async () => {
            await patch({ finished: true });
            go('today');
          }}
        >
          Завершить тренировку
        </button>
      )}
      <button class="btn wide danger-text" onClick={remove}>
        Удалить тренировку
      </button>

      {adding && <AddExerciseSheet exercises={exercises} onPick={add} onClose={() => setAdding(false)} />}
    </div>
  );
}
