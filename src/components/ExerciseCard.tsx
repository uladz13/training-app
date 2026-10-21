import { useState } from 'preact/hooks';
import type { Exercise, SetEntry, WorkoutItem } from '../types';
import { Stepper, Check, Sheet } from './ui';
import { stepWeight } from '../weights';
import { kg, secLabel } from '../util';
import { emptySet } from '../workoutLogic';
import { startRest, SET_REST_SEC } from '../timer';

interface Props {
  item: WorkoutItem;
  ex: Exercise;
  index: number;
  count: number;
  onChange: (item: WorkoutItem) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}

function targetLabel(item: WorkoutItem, ex: Exercise): string {
  const t = item.target;
  const range = t.min === t.max ? `${t.min}` : `${t.min}–${t.max}`;
  const unit = ex.kind === 'time' ? (t.max >= 120 ? '' : ' с') : '';
  const r = ex.kind === 'time' && t.max >= 120 ? `${secLabel(t.min)}–${secLabel(t.max)}` : range + unit;
  const parts = [`${t.sets} × ${r}`];
  if (ex.perSide) parts.push('на сторону');
  parts.push(`отдых ${SET_REST_SEC} с` + (item.restSec ? `, после — ${secLabel(item.restSec)}` : ''));
  return parts.join(' · ');
}

export function summary(item: WorkoutItem, ex: Exercise): string {
  const vals = item.sets.map((s) => {
    if (ex.kind === 'time') {
      return ex.perSide && s.l !== s.r ? `${secLabel(s.l ?? 0)}/${secLabel(s.r ?? 0)}` : secLabel((ex.perSide ? s.l : s.v) ?? 0);
    }
    return ex.perSide ? (s.l === s.r ? `${s.l}` : `${s.l}/${s.r}`) : `${s.v}`;
  });
  const ws = [...new Set(item.sets.map((s) => s.w).filter((w) => w != null))];
  const w = ex.equipment === 'none' ? '' : ws.map((x) => (ex.equipment === 'db2' ? `2×${kg(x)}` : kg(x))).join('/') + ' кг · ';
  return w + vals.join(', ');
}

export function ExerciseCard({ item, ex, index, count, onChange, onDelete, onMove }: Props) {
  const [showTech, setShowTech] = useState(false);
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const collapsed = item.done && !expanded;

  const setSet = (i: number, patch: Partial<SetEntry>) => {
    const sets = item.sets.map((s, j) => (j === i ? { ...s, ...patch } : s));
    onChange({ ...item, sets });
  };

  const setWeight = (i: number, w: number) => {
    // Новый вес переносится и на следующие невыполненные подходы.
    const sets = item.sets.map((s, j) => (j === i || (j > i && !s.done) ? { ...s, w } : s));
    onChange({ ...item, sets });
  };

  const toggleSet = (i: number) => {
    const s = item.sets[i];
    const done = !s.done;
    const sets = item.sets.map((x, j) => (j === i ? { ...x, done } : x));
    const allDone = sets.every((x) => x.done);
    onChange({ ...item, sets, done: allDone ? true : item.done && done });
    // Таймер только информирует: между подходами — 20 с, после последнего — отдых упражнения.
    if (done) {
      if (allDone) startRest(item.restSec, 'до следующего упражнения');
      else startRest(SET_REST_SEC, ex.name);
    }
  };

  const toggleDone = () => {
    const done = !item.done;
    onChange({ ...item, done });
    setExpanded(false);
  };

  const addSet = () => {
    const last = item.sets[item.sets.length - 1];
    const s: SetEntry = last ? { ...last, done: false } : emptySet(ex, undefined, item.target.max);
    onChange({ ...item, done: false, sets: [...item.sets, s] });
  };
  const removeSet = () => {
    if (item.sets.length <= 1) return;
    onChange({ ...item, sets: item.sets.slice(0, -1) });
  };

  const valueStep = ex.kind === 'time' ? 5 : 1;
  const fmtVal = (v: number | undefined) => (ex.kind === 'time' ? `${v ?? 0} с` : `${v ?? 0}`);

  return (
    <section class={'card ex-card' + (item.done ? ' done' : '')}>
      <header class="ex-head">
        <button class="ex-title" onClick={() => (collapsed ? setExpanded(true) : setShowTech((v) => !v))}>
          <span class="ex-name">{ex.name}</span>
          <span class="ex-target">{collapsed ? summary(item, ex) : targetLabel(item, ex)}</span>
        </button>
        <Check checked={item.done} onClick={toggleDone} label="упражнение выполнено" />
      </header>

      {showTech && !collapsed && (
        <div class="technique">
          {ex.technique.split('\n').map((p) => (
            <p>{p}</p>
          ))}
        </div>
      )}

      {!collapsed && (
        <>
          <div class="sets">
            {item.sets.map((s, i) => (
              <div class={'set-row' + (s.done ? ' set-done' : '')}>
                <span class="set-n">{i + 1}</span>
                <div class={'set-fields' + (ex.perSide && ex.equipment !== 'none' ? ' three' : '')}>
                {ex.equipment !== 'none' && (
                  <div class="set-field">
                    <span class="field-label">{ex.equipment === 'db2' ? 'кг ×2' : 'кг'}</span>
                    <Stepper
                      value={s.w}
                      decimal
                      onChange={(w) => setWeight(i, w)}
                      onStep={(dir) => stepWeight(ex.equipment, s.w, dir)}
                      format={(v) => kg(v)}
                      label="вес"
                    />
                  </div>
                )}
                {ex.perSide ? (
                  <>
                    <div class="set-field">
                      <span class="field-label">Л</span>
                      <Stepper value={s.l} step={valueStep} format={fmtVal} onChange={(l) => setSet(i, { l })} label="левая" />
                    </div>
                    <div class="set-field">
                      <span class="field-label">П</span>
                      <Stepper value={s.r} step={valueStep} format={fmtVal} onChange={(r) => setSet(i, { r })} label="правая" />
                    </div>
                  </>
                ) : (
                  <div class="set-field">
                    <span class="field-label">{ex.kind === 'time' ? 'время' : 'повт.'}</span>
                    <Stepper value={s.v} step={valueStep} format={fmtVal} onChange={(v) => setSet(i, { v })} label="повторения" />
                  </div>
                )}
                </div>
                <Check checked={s.done} onClick={() => toggleSet(i)} label="подход выполнен" />
              </div>
            ))}
          </div>
          <footer class="ex-actions">
            <button class="chip" onClick={addSet}>
              + подход
            </button>
            <button class="chip" onClick={removeSet} disabled={item.sets.length <= 1}>
              − подход
            </button>
            <button class="chip" onClick={() => setShowTech((v) => !v)}>
              Техника
            </button>
            <button class="chip" onClick={() => setEditing(true)}>
              Изменить
            </button>
            {item.done && (
              <button class="chip" onClick={() => setExpanded(false)}>
                Свернуть
              </button>
            )}
          </footer>
        </>
      )}

      {editing && (
        <EditItemSheet
          item={item}
          ex={ex}
          index={index}
          count={count}
          onClose={() => setEditing(false)}
          onSave={(it) => {
            onChange(it);
            setEditing(false);
          }}
          onDelete={() => {
            setEditing(false);
            onDelete();
          }}
          onMove={onMove}
        />
      )}
    </section>
  );
}

function EditItemSheet({
  item,
  ex,
  index,
  count,
  onClose,
  onSave,
  onDelete,
  onMove
}: {
  item: WorkoutItem;
  ex: Exercise;
  index: number;
  count: number;
  onClose: () => void;
  onSave: (it: WorkoutItem) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [t, setT] = useState(item.target);
  const [rest, setRest] = useState(item.restSec);
  const unit = ex.kind === 'time' ? 5 : 1;
  return (
    <Sheet title={ex.name} onClose={onClose}>
      <div class="form-row">
        <span>Цель: подходов</span>
        <Stepper value={t.sets} min={1} onChange={(sets) => setT({ ...t, sets })} />
      </div>
      <div class="form-row">
        <span>{ex.kind === 'time' ? 'Секунд от' : 'Повторов от'}</span>
        <Stepper value={t.min} step={unit} onChange={(min) => setT({ ...t, min, max: Math.max(min, t.max) })} />
      </div>
      <div class="form-row">
        <span>{ex.kind === 'time' ? 'Секунд до' : 'Повторов до'}</span>
        <Stepper value={t.max} step={unit} onChange={(max) => setT({ ...t, max, min: Math.min(max, t.min) })} />
      </div>
      <div class="form-row">
        <span>Отдых после упражнения, с</span>
        <Stepper value={rest} step={15} onChange={setRest} />
      </div>
      <div class="sheet-actions">
        <button class="btn" disabled={index === 0} onClick={() => onMove(-1)}>
          ↑ Выше
        </button>
        <button class="btn" disabled={index === count - 1} onClick={() => onMove(1)}>
          ↓ Ниже
        </button>
      </div>
      <div class="sheet-actions">
        <button
          class="btn danger"
          onClick={() => {
            if (confirm(`Удалить «${ex.name}» из тренировки?`)) onDelete();
          }}
        >
          Удалить
        </button>
        <button class="btn primary" onClick={() => onSave({ ...item, target: t, restSec: rest })}>
          Сохранить
        </button>
      </div>
    </Sheet>
  );
}
