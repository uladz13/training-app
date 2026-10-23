import { ExerciseIcon } from './ExerciseIcon';
import { useRef, useState } from 'preact/hooks';
import type { Exercise, SetEntry, WorkoutItem } from '../types';
import { Stepper, Check, Sheet } from './ui';
import { stepWeight, layoutLabel } from '../weights';
import type { Hint } from '../progression';
import { kg, secLabel } from '../util';
import { emptySet } from '../workoutLogic';
import { startRest, startSet, SET_REST_SEC } from '../timer';

interface Props {
  item: WorkoutItem;
  ex: Exercise;
  index: number;
  count: number;
  onChange: (item: WorkoutItem) => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
  hint?: Hint | null;
  /** открыто на весь экран; иначе — свёрнутая строка */
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

/** Цель в свёрнутой строке: «3 × 8–12 · 2×17 кг». */
function targetShort(item: WorkoutItem, ex: Exercise): string {
  const t = item.target;
  const r = ex.kind === 'time' && t.max >= 120 ? `${secLabel(t.min)}–${secLabel(t.max)}` : (t.min === t.max ? `${t.min}` : `${t.min}–${t.max}`) + (ex.kind === 'time' ? ' с' : '');
  const w = (item.sets.find((s) => !s.done) ?? item.sets[0])?.w;
  const wl = ex.equipment === 'none' || w == null ? '' : ` · ${ex.equipment === 'db2' ? '2×' : ''}${kg(w)} кг`;
  return `${t.sets} × ${r}${ex.perSide ? ' на сторону' : ''}${wl}`;
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

export function ExerciseCard({ item, ex, index, count, onChange, onDelete, onMove, hint, open, onOpen, onClose }: Props) {
  const [showTech, setShowTech] = useState(false);
  const [editing, setEditing] = useState(false);
  const collapsed = !open;

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
    // Все подходы отмечены — упражнение сворачивается.
    if (done && allDone) onClose();
  };

  // Таймер подхода (упражнения на время). Колбэк срабатывает позже — берём актуальное упражнение из ref.
  const itemRef = useRef(item);
  itemRef.current = item;
  const [sidesDone, setSidesDone] = useState<Record<number, ('l' | 'r')[]>>({});
  const runSet = (i: number, side?: 'l' | 'r') => {
    const s = item.sets[i];
    const sec = (side ? s[side] : s.v) ?? 0;
    startSet(sec, ex.name + (side ? (side === 'l' ? ' · Л' : ' · П') : ''), (actual) => {
      const cur = itemRef.current;
      const sides = side ? [...new Set([...(sidesDone[i] ?? []), side])] : [];
      const complete = !side || (sides.includes('l') && sides.includes('r'));
      const sets = cur.sets.map((x, j) => (j === i ? { ...x, [side ?? 'v']: actual, done: x.done || complete } : x));
      if (side) setSidesDone((m) => ({ ...m, [i]: sides }));
      if (!complete) {
        onChange({ ...cur, sets });
        return;
      }
      const allDone = sets.every((x) => x.done);
      onChange({ ...cur, sets, done: allDone ? true : cur.done });
      startRest(allDone ? cur.restSec : SET_REST_SEC, allDone ? 'до следующего упражнения' : ex.name);
      if (allDone) onClose();
    });
  };

  const toggleDone = () => {
    const done = !item.done;
    // Отметка упражнения отмечает и все подходы; снятие отметки подходы не трогает.
    const hadOpen = item.sets.some((s) => !s.done);
    const sets = done ? item.sets.map((s) => (s.done ? s : { ...s, done: true })) : item.sets;
    onChange({ ...item, done, sets });
    if (done && hadOpen) startRest(item.restSec, 'до следующего упражнения');
    if (done) onClose();
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

  const applyHint = () => {
    if (!hint?.apply) return;
    const { w, reps } = hint.apply;
    const sets = item.sets.map((s) => ({
      ...s,
      w,
      ...(ex.perSide ? { l: reps, r: reps } : { v: reps }),
      done: false
    }));
    onChange({ ...item, sets, done: false, hint: 'applied' });
  };
  const showHint = open && !!hint && !item.hint && !item.done && !item.sets.some((s) => s.done);
  const layoutW = (item.sets.find((s) => !s.done) ?? item.sets[item.sets.length - 1])?.w;

  const valueStep = ex.kind === 'time' ? 5 : 1;
  const fmtVal = (v: number | undefined) => (ex.kind === 'time' ? `${v ?? 0} с` : `${v ?? 0}`);

  return (
    <section class={'card ex-card' + (item.done ? ' done' : '') + (open ? ' open' : ' row')}>
      {open && (
        <button class="link ex-back" onClick={onClose}>
          ‹ Свернуть
        </button>
      )}
      <header class="ex-head">
        <ExerciseIcon ex={ex} size={collapsed ? 28 : 32} class={collapsed && item.done ? 'dim' : ''} />
        <button class="ex-title" onClick={() => (collapsed ? onOpen() : setShowTech((v) => !v))}>
          <span class="ex-name">{ex.name}</span>
          <span class="ex-target">{open ? targetLabel(item, ex) : item.done ? summary(item, ex) : targetShort(item, ex)}</span>
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

      {showHint && hint && (
        <div class={'hint hint-' + hint.tone}>
          <p>{hint.text}</p>
          <div class="hint-actions">
            {hint.apply && (
              <button class="chip accent" onClick={applyHint}>
                Применить {ex.equipment === 'db2' ? `2 × ${kg(hint.apply.w)}` : kg(hint.apply.w)} кг
              </button>
            )}
            <button class="chip" onClick={() => onChange({ ...item, hint: 'dismissed' })}>
              {hint.apply ? 'Оставить как есть' : 'Понятно'}
            </button>
          </div>
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
                {ex.kind === 'time' && !s.done && (
                  <div class="set-timer">
                    {ex.perSide ? (
                      (['l', 'r'] as const).map((side) => (
                        <button class="chip set-start" disabled={sidesDone[i]?.includes(side)} onClick={() => runSet(i, side)}>
                          ▶ {side === 'l' ? 'Л' : 'П'}
                        </button>
                      ))
                    ) : (
                      <button class="chip set-start" onClick={() => runSet(i)}>
                        ▶ Начать подход
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          {ex.equipment !== 'none' && layoutW != null && layoutW > 0 && (
            <div class="layout muted small">
              {ex.equipment === 'db2' ? 'Каждая гантель' : ex.equipment === 'barbell' ? 'Штанга' : 'Гантель'} {kg(layoutW)} кг: {layoutLabel(ex.equipment, layoutW)}
            </div>
          )}
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
            <button class="chip" onClick={() => (location.hash = '#/exercise/' + encodeURIComponent(ex.id))}>
              График
            </button>
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
