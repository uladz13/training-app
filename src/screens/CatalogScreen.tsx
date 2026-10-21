import { useState } from 'preact/hooks';
import { db } from '../db';
import { useLive } from '../hooks';
import { Sheet } from '../components/ui';
import { go } from '../router';
import type { Exercise } from '../types';

const KIND = { weight: 'с весом', reps: 'повторы', time: 'на время' } as const;

/** Каталог упражнений: переименование, техника, удаление своих упражнений без записей. */
export function CatalogScreen() {
  const exercises = useLive(() => db.exercises.toArray(), []);
  const workouts = useLive(() => db.workouts.toArray(), []);
  const templates = useLive(() => db.templates.toArray(), []);
  const [edit, setEdit] = useState<Exercise | null>(null);
  if (!exercises || !workouts || !templates) return <div class="loading">Загрузка…</div>;
  const used = new Set(workouts.flatMap((w) => w.items.map((i) => i.exerciseId)));

  return (
    <div class="screen">
      <div class="screen-head">
        <div>
          <button class="link small" onClick={() => go('more')}>
            ‹ Ещё
          </button>
          <h1>Упражнения</h1>
        </div>
      </div>
      <section class="card">
        {[...exercises]
          .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
          .map((e) => (
            <button class="list-row" onClick={() => setEdit(e)}>
              <span>{e.name}</span>
              <span class="muted small">
                {KIND[e.kind]}
                {e.custom ? ' · своё' : ''} ›
              </span>
            </button>
          ))}
      </section>
      {edit && (
        <EditExercise
          ex={edit}
          canDelete={!!edit.custom && !used.has(edit.id)}
          inProgram={templates.some((t) => t.items.some((i) => i.exerciseId === edit.id))}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}

function EditExercise({ ex, canDelete, inProgram, onClose }: { ex: Exercise; canDelete: boolean; inProgram: boolean; onClose: () => void }) {
  const [name, setName] = useState(ex.name);
  const [technique, setTechnique] = useState(ex.technique);
  const save = async () => {
    if (!name.trim()) return;
    await db.exercises.put({ ...ex, name: name.trim(), technique: technique.trim() || 'Описание не добавлено.' });
    onClose();
  };
  const remove = async () => {
    if (!confirm(`Удалить упражнение «${ex.name}»?${inProgram ? ' Оно будет убрано и из программы.' : ''}`)) return;
    await db.transaction('rw', db.exercises, db.templates, async () => {
      await db.exercises.delete(ex.id);
      for (const t of await db.templates.toArray()) {
        if (t.items.some((i) => i.exerciseId === ex.id)) await db.templates.put({ ...t, items: t.items.filter((i) => i.exerciseId !== ex.id) });
      }
    });
    onClose();
  };
  return (
    <Sheet title="Упражнение" onClose={onClose}>
      <label class="field">
        <span>Название</span>
        <input class="text-input" value={name} onInput={(e) => setName((e.target as HTMLInputElement).value)} />
      </label>
      <label class="field">
        <span>Техника</span>
        <textarea class="text-input" rows={8} value={technique} onInput={(e) => setTechnique((e.target as HTMLTextAreaElement).value)} />
      </label>
      <p class="muted small">
        {canDelete
          ? 'Своё упражнение без записей можно удалить.'
          : ex.custom
            ? 'По упражнению есть записи — удалить его нельзя, только переименовать.'
            : 'Встроенное упражнение: можно переименовать и изменить описание.'}
      </p>
      <div class="sheet-actions">
        {canDelete && (
          <button class="btn danger" onClick={remove}>
            Удалить
          </button>
        )}
        <button class="btn primary" disabled={!name.trim()} onClick={save}>
          Сохранить
        </button>
      </div>
    </Sheet>
  );
}
