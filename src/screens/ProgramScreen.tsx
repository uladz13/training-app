import { ExerciseIcon } from '../components/ExerciseIcon';
import { useEffect, useState } from 'preact/hooks';
import { db } from '../db';
import { useLive } from '../hooks';
import { Stepper } from '../components/ui';
import { AddExerciseSheet } from '../components/AddExerciseSheet';
import { DAY_NAMES, kg } from '../util';
import { stepWeight } from '../weights';
import { go } from '../router';
import type { DayTemplate, Exercise, TemplateItem } from '../types';

/** Список дней программы. */
export function ProgramScreen() {
  const templates = useLive(() => db.templates.toArray(), []);
  const exercises = useLive(() => db.exercises.toArray(), []);
  if (!templates || !exercises) return <div class="loading">Загрузка…</div>;
  const byId = new Map(exercises.map((e) => [e.id, e]));
  return (
    <div class="screen">
      <div class="screen-head">
        <div>
          <button class="link small" onClick={() => go('more')}>
            ‹ Ещё
          </button>
          <h1>Программа</h1>
        </div>
      </div>
      <p class="muted small">
        Новая тренировка берёт список упражнений, цели и отдых из программы, а вес и повторы — с прошлого раза.
      </p>
      {templates
        .sort((a, b) => a.day - b.day)
        .map((t) => (
          <button class="card list-card" onClick={() => go('program/' + t.day)}>
            <div class="eyebrow">{DAY_NAMES[t.day]}</div>
            <div class="today-title">{t.title}</div>
            <div class="muted small">{t.items.map((i) => byId.get(i.exerciseId)?.name ?? '?').join(' · ')}</div>
          </button>
        ))}
    </div>
  );
}

/** Редактор одного дня программы. Изменения сохраняются сразу. */
export function DayEditor({ day }: { day: number }) {
  const saved = useLive(() => db.templates.get(day), [day]);
  const exercises = useLive(() => db.exercises.toArray(), []);
  const [tpl, setTpl] = useState<DayTemplate | null>(null);
  const [adding, setAdding] = useState(false);
  useEffect(() => {
    if (saved && !tpl) setTpl(saved);
  }, [saved]);
  if (!tpl || !exercises) return <div class="loading">Загрузка…</div>;
  const byId = new Map(exercises.map((e) => [e.id, e]));

  const update = (p: Partial<DayTemplate>) => {
    const next = { ...tpl, ...p };
    setTpl(next);
    db.templates.put(next);
  };
  const setItem = (i: number, p: Partial<TemplateItem>) => update({ items: tpl.items.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const move = (i: number, d: -1 | 1) => {
    const items = [...tpl.items];
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    [items[i], items[j]] = [items[j], items[i]];
    update({ items });
  };
  const add = (ex: Exercise) => {
    const time = ex.kind === 'time';
    update({
      items: [...tpl.items, { exerciseId: ex.id, sets: time ? 2 : 3, min: time ? 30 : 10, max: time ? 30 : 12, restSec: 60 }]
    });
    setAdding(false);
  };

  return (
    <div class="screen">
      <div class="screen-head">
        <div>
          <button class="link small" onClick={() => go('program')}>
            ‹ Программа
          </button>
          <h1>{DAY_NAMES[day]}</h1>
        </div>
      </div>
      <label class="field">
        <span>Название дня</span>
        <input class="text-input" value={tpl.title} onChange={(e) => update({ title: (e.target as HTMLInputElement).value })} />
      </label>
      <label class="field">
        <span>Разминка</span>
        <textarea class="text-input" rows={2} value={tpl.warmup} onChange={(e) => update({ warmup: (e.target as HTMLTextAreaElement).value })} />
      </label>

      {tpl.items.map((it, i) => {
        const ex = byId.get(it.exerciseId);
        if (!ex) return null;
        const unitStep = ex.kind === 'time' ? 5 : 1;
        return (
          <section class="card tpl-item">
            <div class="row-between">
              <strong class="with-icon">
                <ExerciseIcon ex={ex} size={24} />
                <span>
                  {i + 1}. {ex.name}
                </span>
              </strong>
              <div class="mini-actions">
                <button class="icon-btn" disabled={i === 0} onClick={() => move(i, -1)} aria-label="выше">
                  ↑
                </button>
                <button class="icon-btn" disabled={i === tpl.items.length - 1} onClick={() => move(i, 1)} aria-label="ниже">
                  ↓
                </button>
                <button
                  class="icon-btn danger-text"
                  onClick={() => confirm(`Убрать «${ex.name}» из программы на ${DAY_NAMES[day].toLowerCase()}?`) && update({ items: tpl.items.filter((_, j) => j !== i) })}
                  aria-label="удалить"
                >
                  ✕
                </button>
              </div>
            </div>
            <div class="form-row">
              <span>Подходов</span>
              <Stepper value={it.sets} min={1} onChange={(sets) => setItem(i, { sets: Math.max(1, Math.round(sets)) })} />
            </div>
            <div class="form-row">
              <span>{ex.kind === 'time' ? 'Секунд от' : 'Повторов от'}</span>
              <Stepper value={it.min} step={unitStep} onChange={(min) => setItem(i, { min, max: Math.max(min, it.max) })} />
            </div>
            <div class="form-row">
              <span>{ex.kind === 'time' ? 'Секунд до' : 'Повторов до'}</span>
              <Stepper value={it.max} step={unitStep} onChange={(max) => setItem(i, { max, min: Math.min(max, it.min) })} />
            </div>
            <div class="form-row">
              <span>Отдых после, с</span>
              <Stepper value={it.restSec} step={15} onChange={(restSec) => setItem(i, { restSec })} />
            </div>
            {ex.equipment !== 'none' && (
              <div class="form-row">
                <span>Стартовый вес, кг{ex.equipment === 'db2' ? ' ×2' : ''}</span>
                <Stepper
                  value={it.weight}
                  decimal
                  format={(v) => kg(v)}
                  onStep={(d) => stepWeight(ex.equipment, it.weight, d)}
                  onChange={(weight) => setItem(i, { weight })}
                />
              </div>
            )}
          </section>
        );
      })}

      <button class="btn wide ghost" onClick={() => setAdding(true)}>
        + Добавить упражнение
      </button>
      <label class="field">
        <span>Заминка</span>
        <textarea class="text-input" rows={2} value={tpl.cooldown} onChange={(e) => update({ cooldown: (e.target as HTMLTextAreaElement).value })} />
      </label>
      <p class="muted small">Стартовый вес используется, только если упражнение ещё ни разу не выполнялось.</p>
      {adding && <AddExerciseSheet exercises={exercises} onPick={add} onClose={() => setAdding(false)} />}
    </div>
  );
}
